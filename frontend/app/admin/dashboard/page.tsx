"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ClipboardList, Car, User, DollarSign,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminGetBookings, type Booking } from "@/lib/admin-api";

function fmt(n: number) {
  return n.toLocaleString("ru-RU") + " ₸";
}

function getChartData(bookings: Booking[]) {
  const days: Record<string, { date: string; earnings: number; orders: number }> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
    days[key] = { date: label, earnings: 0, orders: 0 };
  }
  for (const b of bookings) {
    const key = b.created_at.slice(0, 10);
    if (days[key]) {
      days[key].orders += 1;
      days[key].earnings += b.owner_earnings ?? 0;
    }
  }
  return Object.values(days);
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
  delay?: number;
}

function StatCard({ label, value, sub, icon: Icon, accent = "text-red-500", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-start gap-4"
    >
      <div className={`p-2.5 rounded-xl bg-white/5 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-medium">{fmt(payload[0].value)}</p>
    </div>
  );
};

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = bookings.filter((b) => b.status === "done");
  const ownerOrders = done.filter((b) => b.executor === "owner");
  const hiredOrders = done.filter((b) => b.executor === "hired");
  const totalEarnings = done.reduce((s, b) => s + (b.owner_earnings ?? 0), 0);
  const chartData = getChartData(bookings);

  const recent = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const STATUS_LABELS: Record<string, string> = {
    new: "Новый",
    confirmed: "Подтверждён",
    in_progress: "В процессе",
    done: "Выполнен",
    cancelled: "Отменён",
  };

  const STATUS_COLORS: Record<string, string> = {
    new: "text-blue-400 bg-blue-400/10",
    confirmed: "text-yellow-400 bg-yellow-400/10",
    in_progress: "text-orange-400 bg-orange-400/10",
    done: "text-green-400 bg-green-400/10",
    cancelled: "text-gray-500 bg-gray-500/10",
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Дашборд</h1>
          <p className="text-gray-500 text-sm mt-1">Общая статистика по заказам и доходам</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Всего заказов"
            value={String(bookings.length)}
            sub={`Выполнено: ${done.length}`}
            icon={ClipboardList}
            accent="text-red-500"
            delay={0}
          />
          <StatCard
            label="Наши заказы"
            value={String(ownerOrders.length)}
            sub={ownerOrders.length ? fmt(ownerOrders.reduce((s, b) => s + (b.owner_earnings ?? 0), 0)) : "—"}
            icon={User}
            accent="text-blue-400"
            delay={0.05}
          />
          <StatCard
            label="Наёмники"
            value={String(hiredOrders.length)}
            sub={hiredOrders.length ? fmt(hiredOrders.reduce((s, b) => s + (b.owner_earnings ?? 0), 0)) : "—"}
            icon={Car}
            accent="text-purple-400"
            delay={0.1}
          />
          <StatCard
            label="Наш заработок"
            value={totalEarnings ? fmt(totalEarnings) : "—"}
            sub="За всё время"
            icon={TrendingUp}
            accent="text-green-400"
            delay={0.15}
          />
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="bg-white/[0.04] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-sm font-medium text-white mb-1">Заработок за 30 дней</h2>
          <p className="text-xs text-gray-500 mb-6">Наша доля от выполненных заказов</p>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fill="url(#earningsGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
          className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-sm font-medium text-white">Последние заказы</h2>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">Нет заказов</div>
            ) : (
              recent.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <span className="text-gray-600 text-xs w-8">#{b.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{b.contact}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(b.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[b.status] ?? "text-gray-400 bg-white/5"}`}>
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                  {b.executor && (
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${b.executor === "owner" ? "text-blue-400 bg-blue-400/10" : "text-purple-400 bg-purple-400/10"}`}>
                      {b.executor === "owner" ? "Мы" : "Наёмник"}
                    </span>
                  )}
                  {b.actual_price != null && (
                    <span className="text-xs text-green-400 font-medium tabular-nums">{fmt(b.actual_price)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AdminShell>
  );
}
