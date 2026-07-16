import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Package } from '../types';
import { compareAIService, type AIAnalysisResult } from '../services/compareAIService';

interface CompareAIProps {
  compareList: Package[];
  onSubscribe: (pkg: Package) => void;
}

export default function CompareAI({ compareList }: CompareAIProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (compareList.length < 2) {
      setAnalysis(null);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      try {
        const result = compareAIService.analyzePackages(compareList);
        setAnalysis(result);
      } catch (err) {
        console.error('Error analyzing packages:', err);
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [compareList]);

  if (compareList.length < 2) return null;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center min-h-[160px] transition-all duration-300">
        <div className="w-6 h-6 border-2 border-[#EE0033] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-[11px] font-bold text-gray-500 animate-pulse">Đang phân tích...</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden transition-all duration-300 animate-fade-in space-y-5">
      {/* Title */}
      <div className="flex items-center space-x-2 pb-3 border-b border-gray-150">
        <Sparkles className="w-5 h-5 text-[#EE0033]" />
        <h3 className="text-sm font-extrabold tracking-tight text-gray-900 uppercase">
          {analysis.title}
        </h3>
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-700 font-semibold leading-relaxed">
        {analysis.summary}
      </p>

      {/* Differences */}
      {analysis.differences.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
            Khác biệt nổi bật
          </h4>
          <ul className="space-y-1.5 pl-4 list-disc text-xs text-gray-600 font-semibold leading-relaxed">
            {analysis.differences.map((diff, idx) => (
              <li key={idx} className="marker:text-gray-300 pl-0.5">
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation/Suggestion */}
      <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-2">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
          Gợi ý định hướng
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
          {analysis.suggestion}
        </p>
      </div>
    </div>
  );
}
