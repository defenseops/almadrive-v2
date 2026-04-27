"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, EyeOff, Trash2, Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  adminGetAllReviews, adminApproveReview, adminHideReview, adminDeleteReview,
  type AdminReview,
} from "@/lib/admin-api";

type Tab = "all" | "pending" | "approved";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: AdminReview;
  onApprove: (id: number) => Promise<void>;
  onHide: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function ReviewCard({ review, onApprove, onHide, onDelete }: ReviewCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function run(key: string, fn: () => Promise<void>) {
    setActionLoading(key);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    setActionLoading("delete");
    try {
      await onDelete(review.id);
      setDeleted(true);
    } finally {
      setActionLoading(null);
    }
  }

  if (deleted) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-xs font-medium text-gray-300 shrink-0">
            {(review.author_name?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-white font-medium">{review.author_name ?? "Аноним"}</p>
            <p className="text-[10px] text-gray-500">
              {new Date(review.created_at).toLocaleDateString("ru-RU", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              review.is_approved
                ? "text-green-400 bg-green-400/10"
                : "text-yellow-400 bg-yellow-400/10"
            }`}
          >
            {review.is_approved ? "Опубликован" : "На модерации"}
          </span>
        </div>
      </div>

      {/* Text */}
      <p className="text-sm text-gray-300 leading-relaxed">{review.text}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {!review.is_approved && (
          <button
            onClick={() => run("approve", () => onApprove(review.id))}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/15 hover:bg-green-600/25 text-green-400 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {actionLoading === "approve" ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Check size={11} />
            )}
            Опубликовать
          </button>
        )}

        {review.is_approved && (
          <button
            onClick={() => run("hide", () => onHide(review.id))}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600/15 hover:bg-yellow-600/25 text-yellow-400 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {actionLoading === "hide" ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <EyeOff size={11} />
            )}
            Скрыть
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={actionLoading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ml-auto"
        >
          {actionLoading === "delete" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Trash2 size={11} />
          )}
          Удалить
        </button>
      </div>
    </motion.div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    adminGetAllReviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: number) {
    const updated = await adminApproveReview(id);
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleHide(id: number) {
    const updated = await adminHideReview(id);
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDelete(id: number) {
    await adminDeleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered =
    tab === "pending"
      ? reviews.filter((r) => !r.is_approved)
      : tab === "approved"
      ? reviews.filter((r) => r.is_approved)
      : reviews;

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Отзывы</h1>
          <p className="text-gray-500 text-sm mt-1">Модерация и управление отзывами с сайта</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as Tab[]).map((t) => {
            const count =
              t === "all" ? reviews.length
              : t === "pending" ? reviews.filter((r) => !r.is_approved).length
              : reviews.filter((r) => r.is_approved).length;
            const label = t === "all" ? "Все" : t === "pending" ? "На модерации" : "Опубликованы";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tab === t
                    ? "bg-red-600/20 text-red-400 border border-red-600/30"
                    : "text-gray-500 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {label}
                {t === "pending" && pendingCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-yellow-500 text-black text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                ) : (
                  <span className="text-gray-600">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-gray-500 text-sm">Нет отзывов</div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {filtered.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onApprove={handleApprove}
                  onHide={handleHide}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AdminShell>
  );
}
