"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, X, CheckCircle, AlertCircle } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { createServiceReview, type ServiceReview } from "@/lib/api";

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Оценка: ${rating} из ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={12} className={i < rating ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"} aria-hidden="true" />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: ServiceReview; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-[#111111] border border-white/6 hover:border-red-600/25 transition-all duration-400 p-7 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="number-label opacity-30">{String(index + 1).padStart(2, "0")}</div>
        <StarRating rating={review.rating} />
      </div>

      <p className="text-gray-400 text-sm leading-relaxed flex-1 line-clamp-5 font-light italic">
        &ldquo;{review.text}&rdquo;
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/6">
        <div>
          <div className="text-white text-sm font-medium">{review.author_name || "Анонимный клиент"}</div>
          <div className="text-gray-600 text-xs mt-0.5 font-light">
            {new Date(review.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Hover accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
    </motion.article>
  );
}

function ReviewForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("reviews.form");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const inputClass = "w-full bg-transparent border border-white/10 focus:border-red-600/50 text-white placeholder-gray-600 px-4 py-3 text-sm outline-none transition-all duration-300 font-light";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 5) return;
    setStatus("loading");
    try {
      await createServiceReview({ author_name: name || null, rating, text });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#111111] border border-white/8 p-8 w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-600 hover:text-white transition-colors cursor-pointer" aria-label="Закрыть">
          <X size={18} />
        </button>

        <h3 className="font-serif text-2xl text-white mb-7 italic">{t("title")}</h3>

        {status === "success" ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="text-red-500 mx-auto mb-4" aria-hidden="true" />
            <p className="text-white font-light">{t("success")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className={inputClass} />

            <div>
              <label className="block text-[10px] text-gray-600 uppercase tracking-[0.25em] mb-3 font-sans">{t("rating")}</label>
              <div className="flex gap-2" role="radiogroup">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setRating(v)} className="p-1 transition-transform hover:scale-110 cursor-pointer" aria-label={`${v} звезд`} aria-pressed={v <= rating}>
                    <Star size={22} className={v <= rating ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("text")} className={`${inputClass} resize-none`} required />

            {status === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm" role="alert">
                <AlertCircle size={15} aria-hidden="true" /> {t("error")}
              </div>
            )}

            <button type="submit" disabled={status === "loading"} className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] uppercase tracking-[0.25em] font-medium py-3.5 transition-all duration-300 cursor-pointer disabled:opacity-40">
              {status === "loading" ? "..." : t("submit")}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Reviews({ reviews }: { reviews: ServiceReview[] }) {
  const t = useTranslations("reviews");
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="reviews" className="py-28 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />

      {/* Large background number */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 font-serif text-[20rem] leading-none text-white/[0.015] select-none pointer-events-none">
        04
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <SectionTitle title={t("title")} subtitle={t("subtitle")} number="04" />

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 mb-12">
            {reviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600 font-light italic font-serif text-lg">
            Будьте первым, кто оставит отзыв
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 border border-white/15 text-gray-400 hover:border-red-600/50 hover:text-red-400 text-[10px] uppercase tracking-[0.25em] font-medium px-7 py-3 transition-all duration-300 cursor-pointer"
          >
            <Plus size={13} aria-hidden="true" />
            {t("addReview")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && <ReviewForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </section>
  );
}
