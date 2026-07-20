import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Package } from '../types';
import { compareApi } from '../services/api';

interface CompareAIProps {
  compareList: Package[];
  onSubscribe: (pkg: Package) => void;
}

interface AIResult {
  title: string;
  summary: any;
  best_value: any;
  recommendation: any;
}

export default function CompareAI({ compareList }: CompareAIProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIResult | null>(null);

  useEffect(() => {
    if (compareList.length < 2) {
      setAnalysis(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const maGoiList = compareList.map(p => (p.ma_goi || p.id || '').trim()).filter(Boolean);

    compareApi.analyzeAI(maGoiList)
      .then((data) => {
        if (!isMounted) return;
        setAnalysis({
          title: 'Gợi Ý Từ Trợ Lý Ảo ViettelAI',
          summary: data.summary ?? '',
          best_value: data.best_value ?? '',
          recommendation: data.recommendation ?? ''
        });
      })
      .catch((err) => {
        console.error('Error fetching AI compare analysis:', err);
        if (!isMounted) return;
        setAnalysis(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
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
      <div className="text-xs text-gray-700 font-semibold leading-relaxed">
        {typeof analysis.summary === 'object' && analysis.summary !== null
          ? Object.values(analysis.summary).map((val: any, idx: number) => (
              <p key={idx}>{String(val)}</p>
            ))
          : <p>{String(analysis.summary || '')}</p>
        }
      </div>

      {/* Differences / Best Value */}
      {analysis.best_value && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
            Khác biệt nổi bật & Tối ưu nhất
          </h4>
          <ul className="space-y-1.5 pl-4 list-disc text-xs text-gray-600 font-semibold leading-relaxed">
            <li className="marker:text-gray-300 pl-0.5">
              {typeof analysis.best_value === 'object' && analysis.best_value !== null
                ? Object.entries(analysis.best_value).map(([k, v]) => `${k}: ${String(v)}`).join('; ')
                : String(analysis.best_value)
              }
            </li>
          </ul>
        </div>
      )}

      {/* Recommendation/Suggestion */}
      <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-2">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
          Gợi ý định hướng
        </h4>
        {typeof analysis.recommendation === 'object' && analysis.recommendation !== null
          ? Object.entries(analysis.recommendation).map(([key, val]) => (
              <p key={key} className="text-xs text-gray-700 leading-relaxed font-semibold">
                <strong>{key}:</strong> {String(val)}
              </p>
            ))
          : <p className="text-xs text-gray-700 leading-relaxed font-semibold">{String(analysis.recommendation || '')}</p>
        }
      </div>
    </div>
  );
}
