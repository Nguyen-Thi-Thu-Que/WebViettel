const FAQ = require('../models/FAQ');

const faqService = {
  getAllFAQs: async () => {
    return await FAQ.find().sort({ createdAt: 1 });
  },

  createFAQ: async (faqData) => {
    // Generate next string ID if not provided
    let faqId = faqData.id;
    if (!faqId) {
      const count = await FAQ.countDocuments();
      faqId = `faq_${count + 1}_${Date.now()}`;
    }

    const newFaq = await FAQ.create({
      id: faqId,
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category || 'Hỗ trợ chung'
    });
    return newFaq;
  },

  updateFAQ: async (faqId, updateData) => {
    const faq = await FAQ.findOne({ id: faqId });
    if (!faq) {
      throw new Error(`Không tìm thấy câu hỏi FAQ với ID ${faqId} để cập nhật.`);
    }

    faq.question = updateData.question || faq.question;
    faq.answer = updateData.answer || faq.answer;
    faq.category = updateData.category || faq.category;

    await faq.save();
    return faq;
  },

  deleteFAQ: async (faqId) => {
    const result = await FAQ.deleteOne({ id: faqId });
    if (result.deletedCount === 0) {
      throw new Error(`Không tìm thấy câu hỏi FAQ với ID ${faqId} để xóa.`);
    }
    return true;
  },

  // Auto seed helper
  checkAndSeedFAQs: async () => {
    const count = await FAQ.countDocuments();
    if (count > 0) return;

    console.log("Seeding default FAQs into database...");
    const DEFAULT_FAQS = [
      {
        id: 'faq_01',
        question: 'Làm thế nào để đăng ký gói cước di động?',
        answer: 'Bạn chỉ cần chọn gói cước phù hợp trên trang danh sách gói cước, nhấn nút "Đăng ký" và xác nhận thanh toán. Yêu cầu là tài khoản chính của bạn phải đủ số dư bằng giá trị gói cước.',
        category: 'Đăng ký'
      },
      {
        id: 'faq_02',
        question: 'Sau khi hết dung lượng tốc độ cao trong ngày, tôi có truy cập tiếp được không?',
        answer: 'Tùy thuộc vào gói cước bạn đăng ký. Đối với hầu hết các gói như SD135, V120C, hệ thống sẽ tạm dừng kết nối Internet để tránh phát sinh cước. Đối với gói UMAX300, bạn vẫn tiếp tục sử dụng bình thường không giới hạn tốc độ cao.',
        category: 'Đăng ký'
      },
      {
        id: 'faq_03',
        question: 'Làm thế nào để nạp tiền vào tài khoản ảo trên website?',
        answer: 'Bạn vào trang "Hồ sơ cá nhân", chọn mục "Nạp tiền". Sau đó nhập số tiền mong muốn, chọn hình thức thanh toán (VietQR, ví điện tử) và bấm xác nhận. Tài khoản của bạn sẽ lập tức được cộng số dư để trải nghiệm thử.',
        category: 'Nạp tiền'
      },
      {
        id: 'faq_04',
        question: 'Hủy gói cước Viettel như thế nào?',
        answer: 'Bạn có thể hủy gia hạn gói bằng cách soạn tin HUY [TênGói] gửi 191, hoặc hủy hoàn toàn gói cước soạn HUYDATA [TênGói] gửi 191. Trên giao diện này, bạn cũng có thể xem danh sách gói đã đăng ký và nhấn nút Hủy gia hạn nhanh.',
        category: 'Hỗ trợ chung'
      },
      {
        id: 'faq_05',
        question: 'Tôi có thể dùng chung gói cước mạng xã hội với gói data thường không?',
        answer: 'Hoàn toàn được. Ví dụ bạn có thể đăng ký gói MXH100 để được miễn phí 100% dung lượng YouTube/TikTok/Facebook và đăng ký thêm gói ST5K/ST15K để sử dụng data thông thường cho các nhu cầu lướt web khác.',
        category: 'Hỗ trợ chung'
      }
    ];

    await FAQ.insertMany(DEFAULT_FAQS);
    console.log("Successfully seeded 5 default FAQs.");
  }
};

module.exports = faqService;
