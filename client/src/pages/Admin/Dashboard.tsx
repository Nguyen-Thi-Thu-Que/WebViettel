import { Activity, CreditCard, Users, Wifi } from 'lucide-react';
import { useAuthStore, usePackageStore } from '../../store';

export default function Dashboard() {
  const { transactions } = useAuthStore();
  const { packages } = usePackageStore();

  // 1. Calculate Statistics
  const totalUsersCount = 520; // Simulated customer accounts count
  const totalPackagesCount = packages.length;
  
  // Total Revenue: sum of all deposits in transaction logs
  const totalRevenueVal = transactions
    .filter(t => t.type === 'deposit' && t.status === 'success')
    .reduce((sum, curr) => sum + curr.amount, 142500000); // 142M base + current deposits

  // Package registrations count
  const totalSubscriptionsCount = packages.length * 450 + 8420;

  const stats = [
    { label: 'Doanh thu (Giả lập)', val: `${totalRevenueVal.toLocaleString()}đ`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Số lượng Người dùng', val: totalUsersCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tổng số Gói cước', val: totalPackagesCount.toString(), icon: Wifi, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Lượt đăng ký gói', val: totalSubscriptionsCount.toLocaleString(), icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  // 2. SVG Mock Chart coordinates (points for transactions)
  const chartPoints = [
    { label: '25/06', val: 12000000 },
    { label: '26/06', val: 15000000 },
    { label: '27/06', val: 14000000 },
    { label: '28/06', val: 18000000 },
    { label: '29/06', val: 22000000 },
    { label: '30/06', val: 25000000 }
  ];
  
  // Map points to SVG coordinates (width 600, height 180)
  const maxVal = Math.max(...chartPoints.map(p => p.val));
  const minVal = Math.min(...chartPoints.map(p => p.val));
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = 30;

  const pointsString = chartPoints.map((pt, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / (chartPoints.length - 1);
    // Normalize Y value between padding and height-padding
    const y = svgHeight - padding - ((pt.val - minVal) * (svgHeight - padding * 2)) / (maxVal - minVal || 1);
    return `${x},${y}`;
  }).join(' ');

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in text-xs font-semibold">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hệ thống báo cáo tổng quan</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-semibold">Theo dõi thời gian thực dữ liệu đăng ký gói cước di động và số dư ví khách hàng.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stat.val}</h3>
              </div>
              <div className={`p-3 rounded-lg shrink-0 ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG Growth Chart Section */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Xu hướng nạp tiền & Đăng ký gói (7 ngày gần nhất)</h3>
          <p className="text-[10px] text-slate-500 font-semibold">Thống kê doanh số giao dịch thanh toán ảo hàng ngày</p>
        </div>

        <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden">
          {/* Responsive SVG Chart */}
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EE0033" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#EE0033" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const yVal = padding + ratio * (svgHeight - padding * 2);
              return (
                <line
                  key={idx}
                  x1={padding}
                  y1={yVal}
                  x2={svgWidth - padding}
                  y2={yVal}
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area under the line */}
            <path
              d={`M ${padding},${svgHeight - padding} L ${pointsString} L ${svgWidth - padding},${svgHeight - padding} Z`}
              fill="url(#chartGradient)"
            />

            {/* Line plot */}
            <polyline
              fill="none"
              stroke="#EE0033"
              strokeWidth="2.5"
              points={pointsString}
            />

            {/* Dot markers & value labels */}
            {chartPoints.map((pt, idx) => {
              const x = padding + (idx * (svgWidth - padding * 2)) / (chartPoints.length - 1);
              const y = svgHeight - padding - ((pt.val - minVal) * (svgHeight - padding * 2)) / (maxVal - minVal || 1);
              return (
                <g key={idx} className="group">
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#EE0033"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Axis labels */}
                  <text
                    x={x}
                    y={svgHeight - 8}
                    fill="#64748b"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                  {/* Value overlay tooltips */}
                  <text
                    x={x}
                    y={y - 8}
                    fill="#0f172a"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="opacity-90"
                  >
                    {(pt.val / 1000000).toFixed(0)}M
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Recent Activities Section */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Giao dịch đăng ký & Nạp ví gần đây</h3>
          <p className="text-[10px] text-slate-500 font-semibold">Hoạt động mới nhất được thực hiện bởi người dùng trên hệ thống</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3">Giao dịch</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3">Ngày thực hiện</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">
                    {tx.type === 'deposit' ? (
                      <span className="text-emerald-600">Nạp ví ảo</span>
                    ) : (
                      <span className="text-primary">Đăng ký gói</span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-medium">0987654321</td>
                  <td className="p-3 font-bold text-slate-900">
                    {tx.type === 'deposit' ? '+' : '-'}
                    {tx.amount.toLocaleString()}đ
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {tx.type === 'deposit' ? `Qua cổng ${tx.paymentMethod}` : `Đăng ký gói ${tx.packageName}`}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString('vi-VN')} {new Date(tx.createdAt).toLocaleTimeString('vi-VN')}
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2 py-0.5 rounded font-bold">
                      Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
