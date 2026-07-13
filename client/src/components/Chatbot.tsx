import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Trash2, ArrowRight } from 'lucide-react';
import { useChatbotStore } from '../store';
import type { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import aiAvatar from '../image/AI.png';

const Markdown = ReactMarkdown as any;

const getReactNodeText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getReactNodeText).join('');
  if (typeof node === 'object' && node.props && node.props.children) {
    return getReactNodeText(node.props.children);
  }
  return '';
};

export default function Chatbot() {
  const { messages, isOpen, setIsOpen, sendMessage, clearHistory } = useChatbotStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
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

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end text-xs font-semibold">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[92vw] sm:w-[380px] bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl flex flex-col mb-4 overflow-hidden z-50 text-left"
            style={{ minHeight: '400px', maxHeight: '75vh', height: '65vh' }}
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center space-x-3">
                <img
                  src={aiAvatar}
                  alt="Viettel AI"
                  className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
                />
                <div>
                  <h4 className="text-sm font-bold leading-tight">ViettelAI</h4>
                  <p className="text-[10px] text-white/80 font-normal">
                    Trợ lý tư vấn gói cước Viettel 24/7
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={clearHistory}
                  title="Xóa lịch sử chat"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white focus:outline-none cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/50"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                >
                  {msg.sender === 'bot' && (
                    <img
                      src={aiAvatar}
                      alt="AI Avatar"
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100 shadow-sm"
                    />
                  )}
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-7 shadow-sm break-words ${msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none whitespace-pre-wrap'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                        }`}
                    >
                      {msg.sender === 'user' ? (
                        msg.text.split('**').map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i} className="font-bold text-white">
                              {part}
                            </strong>
                          ) : part
                        )
                      ) : (
                        <div className="bot-msg-markdown space-y-2 text-xs leading-7 text-slate-800">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              li: ({ children, ...props }: any) => {
                                const textContent = getReactNodeText(children);
                                if (textContent.startsWith('Tên gói:')) {
                                  const rest = textContent.substring('Tên gói:'.length);
                                  return (
                                    <li className="list-none mt-0 mb-1" {...props}>
                                      <span className="font-semibold text-base text-slate-900">Tên gói:</span>
                                      <span className="font-semibold text-base text-primary ml-1">{rest}</span>
                                    </li>
                                  );
                                }
                                if (textContent.startsWith('Giá:')) {
                                  const rest = textContent.substring('Giá:'.length);
                                  return (
                                    <li className="list-none mt-0 mb-1" {...props}>
                                      <span className="font-semibold text-slate-700">Giá:</span>
                                      <span className="text-red-600 font-semibold ml-1">{rest}</span>
                                    </li>
                                  );
                                }
                                if (textContent.startsWith('Data:')) {
                                  const rest = textContent.substring('Data:'.length);
                                  return (
                                    <li className="list-none mt-0 mb-1" {...props}>
                                      <span className="font-semibold text-slate-700">Data:</span>
                                      <span className="text-blue-600 font-medium ml-1">{rest}</span>
                                    </li>
                                  );
                                }
                                if (textContent.startsWith('Chu kỳ:')) {
                                  const rest = textContent.substring('Chu kỳ:'.length);
                                  return (
                                    <li className="list-none mt-0 mb-1" {...props}>
                                      <span className="font-semibold text-slate-700">Chu kỳ:</span>
                                      <span className="text-gray-500 ml-1">{rest}</span>
                                    </li>
                                  );
                                }
                                return <li className="ml-4 list-disc mt-0 mb-1" {...props}>{children}</li>;
                              },
                              ul: ({ children }: any) => <ul className="mt-0 mb-1.5 pl-4 list-disc">{children}</ul>,
                              p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                              table: ({ children }: any) => <table className="w-full border-collapse border border-slate-200 my-2">{children}</table>,
                              th: ({ children }: any) => <th className="border border-slate-200 px-3 py-1.5 bg-slate-50 font-semibold">{children}</th>,
                              td: ({ children }: any) => <td className="border border-slate-200 px-3 py-1.5">{children}</td>,
                              h1: ({ children }: any) => <h1 className="text-sm font-bold mt-3 mb-1">{children}</h1>,
                              h2: ({ children }: any) => <h2 className="text-xs font-bold mt-2.5 mb-1">{children}</h2>,
                              h3: ({ children }: any) => <h3 className="text-xs font-bold mt-2 mb-1">{children}</h3>,
                            }}
                          >
                            {msg.text.replace(/\n\s*\n/g, '\n')}
                          </Markdown>
                        </div>
                      )}
                    </div>

                    {/* Render Suggested Actions */}
                    {msg.suggestedAction && (
                      <button
                        onClick={() => handleActionClick(msg.suggestedAction!)}
                        className="flex items-center space-x-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-primary font-bold px-3 py-1.5 rounded-xl text-[10px] transition-colors focus:outline-none cursor-pointer"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start items-start gap-3">
                  <img
                    src={aiAvatar}
                    alt="AI Avatar"
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100 shadow-sm"
                  />
                  <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex space-x-1 py-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              {/* Removed messagesEndRef div to rely solely on messagesContainerRef.scrollTo */}
            </div>



            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
              <input
                type="text"
                placeholder="Nhập câu hỏi của bạn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary/50 transition-colors"
              />
              <button
                type="submit"
                className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors flex-shrink-0 focus:outline-none cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Bubble Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border border-white/10 focus:outline-none cursor-pointer"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
