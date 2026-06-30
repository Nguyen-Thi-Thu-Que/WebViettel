import type { ChatbotConfig, ChatMessage } from '../types';

export const processChatMessage = (
  text: string,
  config: ChatbotConfig
): { text: string; suggestedAction?: ChatMessage['suggestedAction'] } => {
  const normalizedText = text.toLowerCase().trim();

  // 1. Check for specific keywords defined in training
  for (const item of config.trainingKeywords) {
    if (normalizedText.includes(item.keyword.toLowerCase())) {
      let suggestedAction: ChatMessage['suggestedAction'] | undefined;
      
      if (item.suggestedPackageId) {
        if (item.suggestedPackageId === 'survey') {
          suggestedAction = {
            type: 'survey',
            payload: '/survey',
            label: 'Làm khảo sát ngay'
          };
        } else {
          suggestedAction = {
            type: 'view_details',
            payload: item.suggestedPackageId,
            label: `Xem chi tiết gói ${item.suggestedPackageId.toUpperCase()}`
          };
        }
      }

      return {
        text: item.response,
        suggestedAction
      };
    }
  }

  // 2. Intent detection for specific greetings or general topics
  if (normalizedText.includes('chào') || normalizedText.includes('hi') || normalizedText.includes('hello') || normalizedText.includes('bot')) {
    return {
      text: 'Xin chào! Tôi là trợ lý ảo Viettel AI. Tôi có thể giúp bạn tìm kiếm gói cước di động phù hợp (data tốc độ cao, gọi thoại, hay gói chuyên biệt MXH). Bạn muốn tôi tư vấn gói cước như thế nào?',
      suggestedAction: {
        type: 'survey',
        payload: '/survey',
        label: 'Khảo sát tìm gói cước'
      }
    };
  }

  if (normalizedText.includes('so sánh') || normalizedText.includes('khác nhau')) {
    return {
      text: 'Bạn có thể thêm tối đa 3 gói cước vào danh sách so sánh để đối chiếu trực quan về giá, data và phút gọi thoại, kèm theo nhận xét hữu ích từ AI. Hãy truy cập trang gói cước để chọn nhé!',
      suggestedAction: {
        type: 'view_details',
        payload: '',
        label: 'Xem danh sách gói cước'
      }
    };
  }

  if (normalizedText.includes('nạp tiền') || normalizedText.includes('số dư') || normalizedText.includes('tài khoản')) {
    return {
      text: 'Để nạp tiền vào tài khoản ảo Viettel của bạn, hãy truy cập vào Trang cá nhân -> Chọn Nạp tiền. Bạn có thể chọn quét VietQR hoặc ví điện tử để được cộng số dư lập tức.',
      suggestedAction: {
        type: 'survey',
        payload: '/profile?tab=topup',
        label: 'Nạp tiền ngay'
      }
    };
  }

  // 3. Fallback default response
  return {
    text: 'Cảm ơn bạn đã nhắn tin. Hiện tại tôi chưa hiểu ý của bạn. Bạn có thể hỏi về các chủ đề như: "gói data nhiều", "gói cước mạng xã hội", "gói gọi điện rẻ", "so sánh gói cước", hoặc nhấp vào nút dưới đây để làm khảo sát nhanh.',
    suggestedAction: {
      type: 'survey',
      payload: '/survey',
      label: 'Tìm gói cước phù hợp'
    }
  };
};
