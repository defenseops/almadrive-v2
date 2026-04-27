"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  adminGetServices, adminGetVehicleClasses,
  adminUpdateServicePrice, adminUpdateMultiplier,
  type AdminService, type AdminVehicleClass,
} from "@/lib/admin-api";

function fmt(n: number) {
  return n.toLocaleString("ru-RU") + " ₸";
}

interface EditableRowProps {
  id: number;
  label: string;
  subLabel?: string;
  value: number;
  suffix?: string;
  onSave: (id: number, val: number) => Promise<void>;
  hint?: string;
}

function EditableRow({ id, label, subLabel, value, suffix = "₸", onSave, hint }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function cancel() {
    setEditing(false);
    setInput(String(value));
    setError("");
  }

  async function save() {
    const n = parseInt(input, 10);
    if (isNaN(n) || n < 0) {
      setError("Введите корректное число");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(id, n);
      setEditing(false);
    } catch {
      setError("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        {subLabel && <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>}
        {hint && <p className="text-xs text-gray-600 mt-0.5">{hint}</p>}
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <input
                  autoFocus
                  type="number"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  onKeyDown={handleKey}
                  min={0}
                  className="w-28 bg-white/[0.06] border border-white/15 focus:border-red-600/60 rounded-lg px-3 py-1.5 text-white text-sm outline-none transition-colors text-right tabular-nums"
                />
                {error && (
                  <p className="absolute -bottom-5 right-0 text-[10px] text-red-400 whitespace-nowrap">{error}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">{suffix}</span>
              <button
                onClick={save}
                disabled={saving}
                className="w-7 h-7 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Сохранить"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                onClick={cancel}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Отмена"
              >
                <X size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm text-white font-medium tabular-nums">
                {suffix === "₸" ? fmt(value) : `${value}%`}
              </span>
              <button
                onClick={() => { setEditing(true); setInput(String(value)); }}
                className="w-7 h-7 rounded-lg bg-white/0 group-hover:bg-white/5 text-gray-600 group-hover:text-gray-400 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Редактировать"
              >
                <Pencil size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TariffsPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<AdminVehicleClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetServices(), adminGetVehicleClasses()])
      .then(([s, v]) => { setServices(s); setVehicleClasses(v); })
      .finally(() => setLoading(false));
  }, []);

  async function saveServicePrice(id: number, price_from: number) {
    const updated = await adminUpdateServicePrice(id, price_from);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  async function saveMultiplier(id: number, multiplier: number) {
    const updated = await adminUpdateMultiplier(id, multiplier);
    setVehicleClasses((prev) => prev.map((v) => (v.id === id ? updated : v)));
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Тарифы</h1>
          <p className="text-gray-500 text-sm mt-1">Редактирование базовых цен услуг и коэффициентов автомобилей</p>
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Services */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mb-3 px-1">
                Услуги — базовая цена
              </h2>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {services.map((s) => (
                  <EditableRow
                    key={s.id}
                    id={s.id}
                    label={s.name}
                    subLabel={s.description ?? undefined}
                    value={s.price_from ?? 0}
                    suffix="₸"
                    onSave={saveServicePrice}
                    hint="Цена «от» — отправная точка расчёта"
                  />
                ))}
              </div>
            </motion.section>

            {/* Vehicle classes */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mb-3 px-1">
                Классы автомобилей — коэффициент цены
              </h2>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {vehicleClasses.map((v) => (
                  <EditableRow
                    key={v.id}
                    id={v.id}
                    label={v.name}
                    subLabel={v.description ?? undefined}
                    value={v.price_multiplier}
                    suffix="%"
                    onSave={saveMultiplier}
                    hint="100 = базовая цена, 150 = +50%"
                  />
                ))}
              </div>
            </motion.section>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-yellow-400/5 border border-yellow-400/15 rounded-xl px-5 py-4"
            >
              <p className="text-xs text-yellow-400/80">
                Итоговая цена заказа: <span className="font-medium">базовая цена × коэффициент / 100</span>.
                Изменения применяются к новым расчётам.
              </p>
            </motion.div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
