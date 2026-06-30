import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Trash2, ArrowRight } from 'lucide-react';
import { useChatbotStore } from '../store';
import type { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Chatbot() {
  const { messages, isOpen, setIsOpen, sendMessage, clearHistory } = useChatbotStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Track if bot is typing
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'user') {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleActionClick = (action: Exclude<ChatMessage['suggestedAction'], undefined>) => {
    if (action.type === 'view_details') {
      if (action.payload) {
        navigate(`/packages/${action.payload}`);
      } else {
        navigate('/packages');
      }
      setIsOpen(false);
    } else if (action.type === 'survey') {
      navigate(action.payload);
      setIsOpen(false);
    } else if (action.type === 'subscribe') {
      navigate(`/packages/${action.payload}`);
      setIsOpen(false);
    }
  };

  const quickPrompts = [
    'Gói data khủng',
    'Xem YouTube & TikTok',
    'Gói gọi thoại rẻ',
    'Làm khảo sát nhu cầu'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] bg-white border border-slate-200 shadow-lg rounded-xl flex flex-col mb-4 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Trợ lý ảo Viettel AI</h4>
                <p className="text-[10px] text-white/75 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-455 rounded-full mr-1.5" />
                  Sẵn sàng hỗ trợ bạn
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={clearHistory}
                title="Xóa lịch sử chat"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white focus:outline-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-[#F5F5F5] border border-slate-200 text-slate-800'
                    }`}
                  >
                    {/* Render bold text helper */}
                    {msg.text.split('**').map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className={`font-bold ${msg.sender === 'user' ? 'text-white' : 'text-slate-900'}`}>
                          {part}
                        </strong>
                      ) : part
                    )}
                  </div>

                  {/* Render Suggested Actions */}
                  {msg.suggestedAction && (
                    <button
                      onClick={() => handleActionClick(msg.suggestedAction!)}
                      className="flex items-center space-x-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-primary font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors focus:outline-none"
                    >
                      <span>{msg.suggestedAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start items-start space-x-2">
                <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-[#F5F5F5] border border-slate-200 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="px-4 py-2 border-t border-slate-200 flex space-x-2 overflow-x-auto no-scrollbar shrink-0 bg-white">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickQuestion(prompt)}
                className="shrink-0 bg-slate-50 border border-slate-200 hover:border-primary/30 hover:text-primary px-3 py-1.5 rounded-lg text-[10px] text-slate-650 transition-colors font-bold focus:outline-none"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary/50 transition-colors"
            />
            <button
              type="submit"
              className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex-shrink-0 focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Bubble Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-md transition-colors border border-white/10 focus:outline-none"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
