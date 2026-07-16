import { useState, useEffect } from 'react';
import { Bot, Check, Sparkles, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import type { Package } from '../types';
import { compareAIService, type AIAnalysisResult } from '../services/compareAIService';

interface CompareAIProps {
  compareList: Package[];
  onSubscribe: (pkg: Package) => void;
}

export default function CompareAI({ compareList, onSubscribe }: CompareAIProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (compareList.length < 2) {
      setAnalysis(null);
      return;
    }

    setLoading(true);

    // Dynamic analysis delay 600ms - 1000ms as requested
    const delay = Math.floor(Math.random() * (1000 - 600 + 1)) + 600;
    const timer = setTimeout(() => {
      try {
        const result = compareAIService.analyzePackages(compareList);
        setAnalysis(result);
      } catch (err) {
        console.error('Error analyzing packages:', err);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [compareList]);

  if (compareList.length < 2) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Background Glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none -ml-20 -mb-20"></div>

      {/* Header Container */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-start space-x-3.5">
          <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Bot className="w-6.5 h-6.5 text-white animate-float" />
            <Sparkles className="absolute -top-1 -right-1 w-4.5 h-4.5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black tracking-tight text-white">Viettel AI Advisor</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">
                Realtime Analysis
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Phân tích dựa trên toàn bộ dữ liệu của các gói cước bạn đang so sánh
            </p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 min-h-[160px]">
        {loading ? (
          /* Loading State with beautiful shimmer & spin animation */
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-slate-800 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-200">AI đang phân tích dữ liệu...</p>
              <p className="text-[11px] text-slate-500 font-medium">Đối chiếu các điều khoản và thông số gói cước từ MongoDB</p>
            </div>
          </div>
        ) : analysis ? (
          /* Analysis Results */
          <div className="space-y-6 animate-fade-in">
            {/* Chatbot conversation style container */}
            <div className="space-y-4 bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3.5 text-[13px] text-slate-300 leading-relaxed font-medium">
                  {analysis.paragraphs.map((paragraph, index) => (
                    <p key={index} className="transition-all duration-200 hover:text-white">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation Box - Gói phù hợp nhất */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-red-500/20 rounded-xl p-5 md:p-6 shadow-lg shadow-red-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Gói phù hợp nhất</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-baseline gap-2">
                      {analysis.recommendedPackage.ten}
                      <span className="text-xs font-bold text-slate-500">({analysis.recommendedPackage.ma_goi})</span>
                    </h3>
                    <p className="text-base font-black text-primary mt-1">
                      {new Intl.NumberFormat('vi-VN').format(analysis.recommendedPackage.gia)}đ
                      <span className="text-xs text-slate-400 font-bold ml-1.5">
                        / {analysis.recommendedPackage.chu_ky_ngay} ngày
                      </span>
                    </p>
                  </div>
                  {/* Reasons Checkmarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                    {analysis.recommendationReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 font-semibold">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => onSubscribe(analysis.recommendedPackage)}
                    className="w-full md:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-red-500/25 flex items-center justify-center space-x-2 hover:shadow-red-500/35 hover:translate-y-[-1px]"
                  >
                    <span>Đăng ký gói này</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Insights Section - Chips */}
            {analysis.insights.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">AI Quick Insights</span>
                <div className="flex flex-wrap gap-2">
                  {analysis.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center space-x-1.5 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs transition-colors text-slate-200 font-bold"
                    >
                      <span className="text-sm shrink-0">{insight.icon}</span>
                      <span>{insight.label}</span>
                      <span className="text-slate-500 font-medium">•</span>
                      <span className="text-primary font-extrabold">{insight.packageName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
