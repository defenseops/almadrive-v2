"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, Check, Loader2, ChevronDown,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  adminGetBookings, adminUpdateStatus, adminUpdateAssignment, type Booking,
} from "@/lib/admin-api";

const STATUSES = ["", "new", "confirmed", "in_progress", "done", "cancelled"] as const;
const MANUAL_STATUSES = ["new", "confirmed", "in_progress", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  "": "Все",
  new: "Новый",
  confirmed: "Подтверждён",
  in_progress: "В процессе",
  done: "Выполнен",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  confirmed: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  in_progress: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  done: "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled: "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

function fmt(n: number) {
  return n.toLocaleString("ru-RU") + " ₸";
}

interface AssignModalProps {
  booking: Booking;
  onClose: () => void;
  onSave: (executor: string, price: number) => Promise<void>;
}

function AssignModal({ booking, onClose, onSave }: AssignModalProps) {
  const [executor, setExecutor] = useState<"owner" | "hired">(
    (booking.executor as "owner" | "hired") ?? "owner"
  );
  const [price, setPrice] = useState(String(booking.actual_price ?? booking.estimated_price ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const p = parseInt(price, 10);
    if (!price || isNaN(p) || p < 0) {
      setError("Введите корректную сумму");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(executor, p);
      onClose();
    } catch {
      setError("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }

  const ownerEarnings = price
    ? (executor === "owner" ? parseInt(price, 10) : Math.floor(parseInt(price, 10) * 0.2))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">Завершить заказ</h2>
            <p className="text-xs text-gray-500 mt-0.5">Заказ #{booking.id} · {booking.contact}</p>
            <p className="text-xs text-yellow-400/80 mt-1">Заказ станет выполненным автоматически</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Executor toggle */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-3">Исполнитель</p>
          <div className="grid grid-cols-2 gap-2">
            {(["owner", "hired"] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setExecutor(ex)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer ${
                  executor === ex
                    ? ex === "owner"
                      ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                      : "bg-purple-600/20 border-purple-500/50 text-purple-300"
                    : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {ex === "owner" ? "Мы берём" : "Наёмник"}
              </button>
            ))}
          </div>
          {executor === "hired" && (
            <p className="text-xs text-gray-500 mt-2">Наш заработок: 20% от суммы</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium block mb-2">
            Итоговая сумма клиента (₸)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setError(""); }}
            min={0}
            className="w-full bg-white/[0.04] border border-white/10 focus:border-red-600/60 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors duration-200 placeholder-gray-600"
            placeholder="например: 15000"
          />
          {ownerEarnings !== null && !isNaN(ownerEarnings) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-400 mt-2"
            >
              Наш заработок: {fmt(ownerEarnings)}
            </motion.p>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StatusDropdownProps {
  current: string;
  bookingId: number;
  onChange: (id: number, status: string) => Promise<void>;
}

function StatusDropdown({ current, bookingId, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function select(status: string) {
    setOpen(false);
    if (status === current) return;
    setLoading(true);
    try {
      await onChange(bookingId, status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border font-medium transition-all cursor-pointer ${
          STATUS_COLORS[current] ?? "text-gray-400 bg-white/5 border-white/10"
        }`}
      >
        {loading ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          STATUS_LABELS[current] ?? current
        )}
        <ChevronDown size={10} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-20 py-1 min-w-[140px]"
          >
            {MANUAL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                  s === current
                    ? "text-white bg-white/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
            <div className="px-3 py-2 text-xs text-gray-600 border-t border-white/5 mt-1">
              Выполнен — автоматически при назначении
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [assigning, setAssigning] = useState<Booking | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetBookings();
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    const updated = await adminUpdateStatus(id, status);
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  async function handleAssign(executor: string, price: number) {
    if (!assigning) return;
    const updated = await adminUpdateAssignment(assigning.id, executor, price);
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  const filtered = filter ? bookings.filter((b) => b.status === filter) : bookings;

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Заказы</h1>
            <p className="text-gray-500 text-sm mt-1">Управление заявками и назначение исполнителей</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-all cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            Обновить
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === s
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "text-gray-500 hover:text-white border border-transparent hover:border-white/10"
              }`}
            >
              {STATUS_LABELS[s]}
              <span className="ml-1.5 text-gray-600">
                {s === "" ? bookings.length : bookings.filter((b) => b.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-gray-500 text-sm">Нет заказов</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {["#", "Контакт", "Дата", "Статус", "Исполнитель", "Сумма", "Наш заработок", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs text-gray-600">#{b.id}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-white">{b.contact}</p>
                        {b.comment && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[160px]">{b.comment}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(b.service_date).toLocaleDateString("ru-RU", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusDropdown
                          current={b.status}
                          bookingId={b.id}
                          onChange={handleStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        {b.executor ? (
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                            b.executor === "owner"
                              ? "text-blue-400 bg-blue-400/10"
                              : "text-purple-400 bg-purple-400/10"
                          }`}>
                            {b.executor === "owner" ? "Мы" : "Наёмник"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-300 tabular-nums whitespace-nowrap">
                        {b.actual_price != null ? fmt(b.actual_price) : (
                          b.estimated_price != null ? (
                            <span className="text-gray-600">~{fmt(b.estimated_price)}</span>
                          ) : "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs tabular-nums whitespace-nowrap">
                        {b.owner_earnings != null ? (
                          <span className="text-green-400 font-medium">{fmt(b.owner_earnings)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setAssigning(b)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Назначить
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {assigning && (
          <AssignModal
            booking={assigning}
            onClose={() => setAssigning(null)}
            onSave={handleAssign}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
