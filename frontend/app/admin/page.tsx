"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { adminLogin, saveToken } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(username, password);
      saveToken(data.access_token);
      router.push("/admin/dashboard");
    } catch {
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-sm bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AD</span>
            </div>
            <span className="text-white font-semibold tracking-wider uppercase text-sm">AlmaDrive</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Панель управления</h1>
          <p className="text-gray-500 text-sm mt-1">Войдите в аккаунт администратора</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 space-y-6"
        >
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-transparent border-b border-white/15 focus:border-red-600 text-white px-0 py-3 text-sm outline-none transition-colors duration-200 placeholder-gray-700"
              placeholder="admin"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-transparent border-b border-white/15 focus:border-red-600 text-white px-0 py-3 pr-10 text-sm outline-none transition-colors duration-200 placeholder-gray-700"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
