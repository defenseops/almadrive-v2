"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Tag,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { hasToken, clearToken } from "@/lib/admin-api";

const NAV = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/admin/orders",    icon: ClipboardList,   label: "Заказы" },
  { href: "/admin/tariffs",   icon: Tag,             label: "Тарифы" },
  { href: "/admin/reviews",   icon: MessageSquare,   label: "Отзывы" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/admin");
    } else {
      setAuthed(true);
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/admin");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-white/8 bg-[#111111] shrink-0">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-60 z-50 bg-[#111111] border-r border-white/8 flex flex-col lg:hidden"
            >
              <SidebarContent pathname={pathname} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-white/8 bg-[#111111]">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Открыть меню"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-white">AlmaDrive Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onLogout,
  onClose,
}: {
  pathname: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-red-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px]">AD</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">AlmaDrive</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group ${
                active
                  ? "bg-red-600/15 text-red-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} className={active ? "text-red-500" : "text-gray-500 group-hover:text-gray-300 transition-colors"} />
              {label}
              {active && <ChevronRight size={12} className="ml-auto text-red-500/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-600/10 w-full transition-all duration-150 cursor-pointer"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </>
  );
}
