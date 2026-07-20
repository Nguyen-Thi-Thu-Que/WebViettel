/**
 * chatbotController.js — Hard-controlled RAG Chatbot Controller
 *
 * Luồng xử lý request chat chính (7 bước):
 *   B0. OFF-TOPIC     → Kiểm tra lạc đề (intent trống rỗng), trả về tĩnh, KHÔNG gọi AI
 *   B1. intentParser  → Phân tích câu hỏi thành object có cấu trúc
 *   B2. packageMatcher→ Query MongoDB lấy tối đa 3 gói cước chính xác
 *   B3. ZERO-MATCH    → Trả về văn bản tĩnh, TUYỆT ĐỐI không gọi AI
 *   B4. promptBuilder → Dựng prompt XML + System Prompt chống ảo giác
 *   B5. AI (Groq/Ollama)→ Sinh câu trả lời tự nhiên từ LLM
 *   B6. ChatHistory   → Lưu lịch sử + đầy đủ packages vào MongoDB
 */

const intentParser = require('../services/chatbot/intentParser');
const { matchPackages } = require('../services/chatbot/packageMatcher');
const { buildPrompt } = require('../services/chatbot/promptBuilder');
const { generateContent } = require('../services/ai/ai.service');
const chatbotService = require('../services/chatbotService');
const ChatHistory = require('../models/ChatHistory');

// ─── Constant messages ────────────────────────────────────────────────────────

/**
 * B3: Văn bản tĩnh trả về khi không tìm thấy gói phù hợp.
 * TUYỆT ĐỐI KHÔNG gọi Groq/Ollama trong trường hợp này.
 */
const NO_MATCH_TEXT =
  'Dạ, hiện tại hệ thống không tìm thấy gói cước nào đáp ứng chính xác các tiêu chí của bạn. ' +
  'Bạn có thể thay đổi khoảng giá, chu kỳ hoặc thực hiện Khảo sát chọn gói tại thanh menu để nhận đề xuất tốt nhất nhé!';

/**
 * B0: Văn bản tĩnh trả về khi người dùng hỏi lạc đề (không có bất kỳ tiêu chí viễn thông nào).
 */
const OFF_TOPIC_TEXT =
  'Dạ, tôi là trợ lý ảo chuyên phụ trách tư vấn các gói cước di động và dịch vụ viễn thông của Viettel. ' +
  'Hiện tại tôi chưa có dữ liệu để giải đáp các thắc mắc nằm ngoài phạm vi này, mong bạn thông cảm nhé!';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Phát hiện suggestedAction từ reply text.
 * Chỉ nhận diện hành động khảo sát; trả về null nếu không khớp.
 * suggestedAction mặc định là null — không tự động tạo link "Xem chi tiết gói".
 */
function detectSuggestedAction(replyText) {
  if (!replyText) return null;
  const lower = replyText.toLowerCase();

  // Nếu AI nhắc đến khảo sát
  if (/khảo\s*sát|survey/i.test(lower)) {
    return {
      type:    'survey',
      payload: '/survey',
      label:   'Làm khảo sát ngay'
    };
  }

  return null;
}

/**
 * Lưu một tin nhắn vào ChatHistory (chỉ khi user đã đăng nhập).
 * Đảm bảo trường `packages` lưu đầy đủ thông tin để Frontend render PackageCard.
 */
async function saveChatHistory(userId, sender, text, suggestedAction, packages) {
  if (!userId) return;
  try {
    await ChatHistory.create({
      userId,
      sender,
      text,
      suggestedAction: suggestedAction || null,
      packages: packages || []
    });
  } catch (err) {
    console.error('[ChatHistory] Lỗi lưu lịch sử:', err.message);
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

const chatbotController = {

  // ── Lấy cấu hình Chatbot (Admin) ──────────────────────────────────────────
  getConfig: async (req, res, next) => {
    try {
      const config = await chatbotService.getConfig();
      return res.status(200).json({
        success: true,
        message: 'Lấy cấu hình Chatbot thành công.',
        data: config
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Cập nhật cấu hình Chatbot (Admin) ─────────────────────────────────────
  updateConfig: async (req, res, next) => {
    try {
      const { systemPrompt } = req.body;
      if (!systemPrompt) {
        return res.status(400).json({
          success: false,
          message: 'System prompt không được để trống.'
        });
      }

      const updated = await chatbotService.updateConfig(req.body);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình AI Chatbot thành công!',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Xử lý tin nhắn chat chính (6 bước RAG cứng) ───────────────────────────
  processMessage: async (req, res, next) => {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    try {
      // Validate input
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn không được để trống.'
        });
      }

      const trimmedMessage = message.trim();

      // ── Lưu tin nhắn người dùng vào lịch sử ─────────────────────────────
      await saveChatHistory(userId, 'user', trimmedMessage, null, []);

      // ── B1: Phân tích intent ──────────────────────────────────────────────────
      // console.time('[RAG] Total');
      // console.log('[RAG] B1 - Intent parsing:', trimmedMessage);

      const intent = intentParser(trimmedMessage);

      // ── B0: Kiểm tra Lạc ĐỀ — NGUYÊN TẮC: không gọi DB hay AI ────────────────
      // Nếu intent hoàn toàn trống rỗng (không giá, không chu kỳ, không mạng, không app, không gói, không feature)
      // → người dùng đang hỏi lạc đề
      const cycle = intent.cycleFilter || {};
      const hasCycleFilter = (cycle.cycleDays != null || cycle.isLongTerm != null);

      const isOffTopic = (
        intent.minPrice    === null &&
        intent.maxPrice    === null &&
        !hasCycleFilter             &&
        intent.networkType === null &&
        (!intent.apps         || intent.apps.length        === 0) &&
        (!intent.packageCodes || intent.packageCodes.length === 0) &&
        (!intent.features     ||
          (!intent.features.data && !intent.features.voice && !intent.features.sms))
      );

      console.log('[DEBUG Controller] Intent:', JSON.stringify(intent), '→ isOffTopic:', isOffTopic);

      if (isOffTopic) {
        console.log('[DEBUG Controller] Off-topic detected → returning static refusal');

        await saveChatHistory(userId, 'bot', OFF_TOPIC_TEXT, null, []);

        return res.status(200).json({
          success: true,
          message: 'Xử lý tin nhắn thành công.',
          data: {
            text:                OFF_TOPIC_TEXT,
            message:             OFF_TOPIC_TEXT,
            packages:            [],
            recommendedPackages: [],
            suggestedAction:     null
          }
        });
      }

      // ── B2: Truy vấn MongoDB — lấy tối đa 3 gói cước chính xác ───────────
      const matchResult = await matchPackages(intent);
      console.log(
        '[DEBUG Controller] Match result: noMatch=%s, count=%d',
        matchResult.noMatchFound,
        matchResult.packages ? matchResult.packages.length : 0
      );

      // ── B3: ZERO-MATCH — Trả về văn bản tĩnh, TUYỆT ĐỐI không gọi AI ────
      if (matchResult.noMatchFound) {
        // console.log('[RAG] B3 - Zero match → skipping AI call (returning static text)');
        // console.timeEnd('[RAG] Total');

        // Lưu reply no-match vào lịch sử
        await saveChatHistory(
          userId,
          'bot',
          NO_MATCH_TEXT,
          null,
          []
        );

        return res.status(200).json({
          success: true,
          message: 'Xử lý tin nhắn thành công.',
          data: {
            text: NO_MATCH_TEXT,
            message: NO_MATCH_TEXT,
            packages: [],
            recommendedPackages: [],
            suggestedAction: null
          }
        });
      }

      const matchedPackages = matchResult.packages; // Tối đa 3 gói

      // ── B4: Dựng prompt XML với System Prompt mệnh lệnh tuyệt đối ─────────
      // console.log('[RAG] B4 - Building XML prompt with', matchedPackages.length, 'packages');
      const prompt = buildPrompt(trimmedMessage, matchedPackages, intent);

      // ── B5: Gọi LLM — Groq (llama-3.1-8b-instant) → Ollama fallback ──────
      // console.log('[RAG] B5 - Calling AI (Groq → Ollama fallback)...');
      let replyText;
      try {
        replyText = await generateContent(prompt);
      } catch (aiError) {
        console.error('[RAG] B5 - AI error:', aiError.message);
        // Fallback tối giản: liệt kê gói mà không có AI narrative
        replyText =
          'Dạ, dưới đây là các gói cước phù hợp với yêu cầu của bạn:\n' +
          matchedPackages
            .map(p =>
              `- **${p.ma_goi}** (${p.ten}): ${Number(p.gia).toLocaleString('vi-VN')}đ / ${p.chu_ky_ngay} ngày`
            )
            .join('\n');
      }

      // console.timeEnd('[RAG] Total');

      // Phát hiện suggestedAction — mặc định null nếu không có từ khóa khảo sát
      const suggestedAction = detectSuggestedAction(replyText);

      // ── B6: Lưu lịch sử bot reply với đầy đủ packages ─────────────────────
      // Trường `packages` lưu toàn bộ thông tin để Frontend render PackageCard
      await saveChatHistory(
        userId,
        'bot',
        replyText,
        suggestedAction,
        matchedPackages
      );

      // ── Trả về response ───────────────────────────────────────────────────
      return res.status(200).json({
        success: true,
        message: 'Xử lý tin nhắn thành công.',
        data: {
          text: replyText,
          message: replyText,
          packages: matchedPackages,
          recommendedPackages: matchedPackages,
          suggestedAction
        }
      });

    } catch (error) {
      console.timeEnd('[RAG] Total');
      console.error('[RAG] Unhandled error:', error);
      next(error);
    }
  }
};

module.exports = chatbotController;
