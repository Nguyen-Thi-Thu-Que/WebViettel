export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex gap-2">
        <div className="h-4 bg-slate-200 rounded w-16" />
        <div className="h-4 bg-slate-200 rounded w-12" />
      </div>
      <div className="h-6 bg-slate-200 rounded w-3/4" />
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <div className="h-9 bg-slate-200 rounded flex-1" />
        <div className="h-9 bg-slate-200 rounded w-10" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
    </tr>
  );
}
