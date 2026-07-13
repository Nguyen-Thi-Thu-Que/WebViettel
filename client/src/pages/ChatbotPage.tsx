import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ArrowRight } from 'lucide-react';
import { useChatbotStore } from '../store';
import type { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

export default function ChatbotPage() {
  const { messages, sendMessage, clearHistory } = useChatbotStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };



  const handleActionClick = (action: Exclude<ChatMessage['suggestedAction'], undefined>) => {
    if (action.type === 'view_details') {
      if (action.payload) {
        navigate(`/packages/${action.payload}`);
      } else {
        navigate('/packages');
      }
    } else if (action.type === 'survey') {
      navigate(action.payload);
    } else if (action.type === 'subscribe') {
      navigate(`/packages/${action.payload}`);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[500px] text-xs font-semibold bg-transparent">
      {/* Flat Header */}
      <div className="border-b border-slate-200/60 p-4 flex items-center justify-between z-10 bg-white rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <img 
            src={aiAvatar} 
            alt="Viettel AI" 
            className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
          />
          <div>
            <h4 className="text-base font-bold leading-tight text-slate-800">ViettelAI</h4>
            <p className="text-xs text-slate-500 font-normal">
              Trợ lý tư vấn gói cước Viettel 24/7
            </p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          title="Xóa lịch sử chat"
          className="p-2 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-colors text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer flex items-center space-x-1 bg-white"
        >
          <Trash2 className="w-4 h-4 text-slate-550" />
          <span className="text-[10px] font-bold">Xóa lịch sử</span>
        </button>
      </div>

      {/* Main Chat Area - Flat Style */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-slate-50/50 no-scrollbar"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-4`}
            >
              {msg.sender === 'bot' && (
                <img 
                  src={aiAvatar} 
                  alt="AI Avatar" 
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100 shadow-sm"
                />
              )}
              <div className="max-w-[80%] space-y-2">
                <div
                  className={msg.sender === 'user' ? 'user-message whitespace-pre-wrap break-words text-xs leading-7 shadow-sm' : 'ai-message break-words text-xs leading-7 shadow-sm'}
                  style={msg.sender === 'user'
                    ? { padding: '10px 15px', borderRadius: '12px 12px 0 12px', backgroundColor: '#E61B2E', color: 'white' }
                    : { padding: '10px 15px', borderRadius: '12px 12px 12px 0', backgroundColor: '#f4f4f4', color: '#333' }
                  }
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
                    <div className="bot-msg-markdown space-y-1 text-xs leading-7 text-slate-800">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                        components={{
                          li: ({ children, ...props }: any) => {
                            const textContent = getReactNodeText(children);
                            if (textContent.startsWith('Tên gói:')) {
                              const rest = textContent.substring('Tên gói:'.length);
                              return (
                                <li className="list-none mt-0 mb-0.5" {...props}>
                                  <span className="font-semibold text-base text-slate-900">Tên gói:</span>
                                  <span className="font-semibold text-base text-primary ml-1">{rest}</span>
                                </li>
                              );
                            }
                            if (textContent.startsWith('Giá:')) {
                              const rest = textContent.substring('Giá:'.length);
                              return (
                                <li className="list-none mt-0 mb-0.5" {...props}>
                                  <span className="font-semibold text-slate-700">Giá:</span>
                                  <span className="text-red-600 font-semibold ml-1">{rest}</span>
                                </li>
                              );
                            }
                            if (textContent.startsWith('Data:')) {
                              const rest = textContent.substring('Data:'.length);
                              return (
                                <li className="list-none mt-0 mb-0.5" {...props}>
                                  <span className="font-semibold text-slate-700">Data:</span>
                                  <span className="text-blue-600 font-medium ml-1">{rest}</span>
                                </li>
                              );
                            }
                            if (textContent.startsWith('Chu kỳ:')) {
                              const rest = textContent.substring('Chu kỳ:'.length);
                              return (
                                <li className="list-none mt-0 mb-0.5" {...props}>
                                  <span className="font-semibold text-slate-700">Chu kỳ:</span>
                                  <span className="text-gray-500 ml-1">{rest}</span>
                                </li>
                              );
                            }
                            return <li className="ml-4 list-disc mt-0 mb-0.5" {...props}>{children}</li>;
                          },
                          ul: ({ children }: any) => <ul className="mt-0 mb-1 pl-4 list-disc space-y-0.5">{children}</ul>,
                          p: ({ children }: any) => <p className="mb-1 last:mb-0">{children}</p>,
                          table: ({ children }: any) => <table className="w-full border-collapse border border-slate-200 my-2">{children}</table>,
                          th: ({ children }: any) => <th className="border border-slate-200 px-3 py-1.5 bg-slate-50 font-semibold">{children}</th>,
                          td: ({ children }: any) => <td className="border border-slate-200 px-3 py-1.5">{children}</td>,
                          h1: ({ children }: any) => <h1 className="text-sm font-bold mt-2 mb-1">{children}</h1>,
                          h2: ({ children }: any) => <h2 className="text-xs font-bold mt-2 mb-1">{children}</h2>,
                          h3: ({ children }: any) => <h3 className="text-xs font-bold mt-1.5 mb-1">{children}</h3>,
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
                    className="flex items-center space-x-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-primary font-bold px-3.5 py-2 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{msg.suggestedAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start items-start gap-4">
              <img 
                src={aiAvatar} 
                alt="AI Avatar" 
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100 shadow-sm"
              />
              <div className="flex flex-col space-y-1">
                <div 
                  className="ai-message flex items-center space-x-2"
                  style={{ padding: '10px 15px', borderRadius: '12px 12px 12px 0', backgroundColor: '#f4f4f4', color: '#333' }}
                >
                  <div className="flex space-x-1 py-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium animate-pulse ml-1">AI đang suy nghĩ...</span>
              </div>
            </div>
          )}
          
          {/* Removed messagesEndRef div to rely solely on messagesContainerRef.scrollTo */}
        </div>
      </div>



      {/* Input Form Footer - Flat Strip Style */}
      <div className="border-t border-slate-200/50 bg-slate-50/80 p-4 z-10 rounded-b-2xl">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end space-x-3">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Nhập câu hỏi của bạn (Nhấn Enter để gửi, Shift + Enter để xuống dòng)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-450 focus:outline-none focus:border-primary/30 focus:shadow-[0_0_0_4px_rgba(230,27,46,0.1)] transition-all resize-none max-h-32 min-h-[38px] leading-relaxed no-scrollbar"
            />
            <button
              type="submit"
              className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors flex-shrink-0 focus:outline-none cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
