"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, AlertCircle, ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { formatPrice } from "@/lib/utils";
import {
  getServices, getVehicleClasses, calculatePrice, createBooking,
  type Service, type VehicleClass, type PriceCalculation,
} from "@/lib/api";

const schema = z.object({
  service_id: z.string().min(1, "required"),
  vehicle_class_id: z.string().min(1, "required"),
  service_date: z.string().min(1, "required"),
  contact: z.string().min(5, "required").max(255),
  comment: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

/* Floating label input */
function Field({
  id, label, error, required, children,
}: { id: string; label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className={`absolute left-0 -top-5 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-200 ${
          error ? "text-red-500" : "text-gray-600 group-focus-within:text-red-400"
        }`}
      >
        {label}{required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1.5"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

const inputBase =
  "w-full bg-transparent border-b border-white/15 focus:border-red-600 text-white placeholder-gray-700 px-0 py-3 text-sm outline-none transition-all duration-300 font-light appearance-none";

export default function BookingForm() {
  const t = useTranslations("booking");
  const tInfo = useTranslations("booking.info");

  const [services, setServices] = useState<Service[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [priceCalc, setPriceCalc] = useState<PriceCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const serviceId = watch("service_id");
  const vehicleClassId = watch("vehicle_class_id");

  useEffect(() => {
    Promise.all([getServices(), getVehicleClasses()]).then(([s, v]) => {
      setServices(s); setVehicleClasses(v);
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      const svc = services.find((s) => s.name === name);
      if (svc) setValue("service_id", String(svc.id));
    };
    window.addEventListener("selectService", handler);
    return () => window.removeEventListener("selectService", handler);
  }, [services, setValue]);

  useEffect(() => { setPriceCalc(null); }, [serviceId, vehicleClassId]);

  const handleCalculate = async () => {
    if (!serviceId || !vehicleClassId) return;
    setCalculating(true);
    try {
      const result = await calculatePrice({
        service_id: Number(serviceId),
        vehicle_class_id: Number(vehicleClassId),
      });
      setPriceCalc(result);
    } catch {
      setError(t("messages.calcError"));
    } finally {
      setCalculating(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError("");
    try {
      let price = priceCalc?.estimated_price ?? null;
      if (!price && data.service_id && data.vehicle_class_id) {
        try {
          const calc = await calculatePrice({
            service_id: Number(data.service_id),
            vehicle_class_id: Number(data.vehicle_class_id),
          });
          price = calc.estimated_price;
        } catch {}
      }
      await createBooking({
        service_id: Number(data.service_id),
        vehicle_class_id: Number(data.vehicle_class_id),
        service_date: new Date(data.service_date).toISOString(),
        contact: data.contact,
        comment: data.comment || null,
        estimated_price: price,
      });
      setSubmitted(true);
      reset();
      setPriceCalc(null);
    } catch {
      setError(t("messages.error"));
    }
  };

  const nowMin = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  })();

  return (
    <section id="booking" className="py-28 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />

      {/* Bg number */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 font-serif text-[20rem] leading-none text-white/[0.015] select-none pointer-events-none">
        03
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <SectionTitle title={t("title")} subtitle={t("subtitle")} number="03" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

          {/* ── Left: why us ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h3 className="font-serif text-2xl text-white italic mb-8">{tInfo("title")}</h3>
              <ul className="space-y-5">
                {(tInfo.raw("items") as string[]).map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.5 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1 shrink-0 flex flex-col items-center">
                      <div className="w-5 h-5 border border-red-600/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-red-600" />
                      </div>
                      {i < (tInfo.raw("items") as string[]).length - 1 && (
                        <div className="w-px h-5 bg-white/6 mt-1" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500 font-light leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Brand accent */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border border-white/5 p-8 bg-[#111111] relative overflow-hidden"
            >
              <div className="font-serif text-5xl text-white/5 italic leading-none mb-3 select-none">
                AlmaDrive
              </div>
              <p className="text-gray-600 text-xs font-light uppercase tracking-[0.3em]">
                Premium Transfer · Almaty
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-px red-line opacity-40" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/5 blur-2xl rounded-full" />
            </motion.div>
          </div>

          {/* ── Right: form ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                /* ── Success state ─────────────────────────────────── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center text-center py-20 px-8 border border-white/6 bg-[#111111] min-h-[500px]"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, duration: 0.6, ease: "backOut" }}
                    className="w-16 h-16 border border-red-600/40 flex items-center justify-center mb-8"
                  >
                    <CheckCircle size={28} className="text-red-500" aria-hidden="true" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-serif text-3xl text-white italic mb-4"
                  >
                    {t("messages.success")}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-gray-500 text-sm font-light mb-8 max-w-xs"
                  >
                    Мы свяжемся с вами в течение 15 минут для подтверждения
                  </motion.p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[10px] uppercase tracking-[0.25em] text-gray-600 hover:text-white border-b border-white/15 hover:border-white/50 pb-0.5 transition-all duration-300 cursor-pointer"
                  >
                    Отправить ещё одну заявку
                  </button>
                </motion.div>
              ) : (
                /* ── Form ─────────────────────────────────────────── */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="relative"
                >
                  {/* Top label */}
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-4 h-px bg-red-600" />
                    <span className="number-label">Оставьте заявку</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-9">

                    {/* Service */}
                    <Field id="service_id" label={t("form.service")} required error={errors.service_id ? t("messages.validation") : undefined}>
                      <div className="relative">
                        <select
                          id="service_id"
                          {...register("service_id")}
                          className={inputBase}
                          aria-required="true"
                          aria-invalid={!!errors.service_id}
                        >
                          <option value="" className="bg-[#111]">— выберите —</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#111]">
                              {s.name}{s.price_from ? ` · от ${formatPrice(s.price_from)} ₸` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-0 top-3.5 text-gray-600 pointer-events-none" />
                      </div>
                    </Field>

                    {/* Vehicle class */}
                    <Field id="vehicle_class_id" label={t("form.vehicleClass")} required error={errors.vehicle_class_id ? t("messages.validation") : undefined}>
                      <div className="relative">
                        <select
                          id="vehicle_class_id"
                          {...register("vehicle_class_id")}
                          className={inputBase}
                          aria-required="true"
                          aria-invalid={!!errors.vehicle_class_id}
                        >
                          <option value="" className="bg-[#111]">— выберите —</option>
                          {vehicleClasses.map((v) => {
                            const diff = Math.max(v.price_multiplier - 100, 0);
                            return (
                              <option key={v.id} value={v.id} className="bg-[#111]">
                                {v.name}{diff > 0 ? ` +${diff}%` : ""}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown size={13} className="absolute right-0 top-3.5 text-gray-600 pointer-events-none" />
                      </div>
                    </Field>

                    {/* Date */}
                    <Field id="service_date" label={t("form.date")} required error={errors.service_date ? t("messages.validation") : undefined}>
                      <input
                        id="service_date"
                        type="datetime-local"
                        min={nowMin}
                        {...register("service_date")}
                        className={inputBase}
                        aria-required="true"
                        aria-invalid={!!errors.service_date}
                      />
                    </Field>

                    {/* Contact */}
                    <Field id="contact" label={t("form.contact")} required error={errors.contact ? t("messages.validation") : undefined}>
                      <input
                        id="contact"
                        type="text"
                        placeholder="+7 777 000 00 00"
                        {...register("contact")}
                        className={inputBase}
                        aria-required="true"
                        aria-invalid={!!errors.contact}
                      />
                    </Field>

                    {/* Comment — full width */}
                    <div className="sm:col-span-2">
                      <Field id="comment" label={t("form.comment")}>
                        <textarea
                          id="comment"
                          rows={2}
                          {...register("comment")}
                          placeholder="Откуда, куда, особые пожелания..."
                          className={`${inputBase} resize-none`}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-8 h-px bg-white/5" />

                  {/* Calculate + price result */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={!serviceId || !vehicleClassId || calculating}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:text-white border-b border-white/10 hover:border-white/40 pb-0.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-live="polite"
                    >
                      {calculating
                        ? <><Loader2 size={12} className="animate-spin" /> Считаем...</>
                        : <>{t("form.calculate")}</>
                      }
                    </button>

                    <AnimatePresence>
                      {priceCalc && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.35 }}
                          className="flex items-baseline gap-2"
                        >
                          <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">{t("price.estimated")}:</span>
                          <span className="font-serif text-2xl text-white italic">
                            {formatPrice(priceCalc.estimated_price)}
                          </span>
                          <span className="text-gray-500 text-sm">{t("price.currency")}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2.5 text-red-400 text-sm border-l-2 border-red-600 pl-4 py-2 mb-6 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle size={14} aria-hidden="true" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex items-center gap-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="bg-red-600 group-hover:bg-red-700 text-white text-[11px] uppercase tracking-[0.3em] font-medium px-8 py-4 transition-all duration-300 flex items-center gap-3">
                      {isSubmitting
                        ? <><Loader2 size={14} className="animate-spin" /> {t("form.submitting")}</>
                        : <>{t("form.submit")} <ArrowRight size={14} /></>
                      }
                    </span>
                    <span className="text-gray-700 text-[10px] uppercase tracking-[0.2em] font-light hidden sm:block">
                      {t("price.disclaimer")}
                    </span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
