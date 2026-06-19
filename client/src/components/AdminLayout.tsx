import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowLeftRight, ClipboardList, DollarSign, Wallet, Coins, Users, Loader2, Menu, X, TrendingUp } from "lucide-react";

const navItems = [
  { href: "/moneymaker777/orders", label: "Заявки", icon: ClipboardList },
  { href: "/moneymaker777/rates", label: "Курсы", icon: DollarSign },
  { href: "/moneymaker777/rub-commissions", label: "Покупка/Продажа РУБ", icon: TrendingUp },
  { href: "/moneymaker777/addresses", label: "Адреса", icon: Wallet },
  { href: "/moneymaker777/currencies", label: "Валюты", icon: Coins },
  { href: "/moneymaker777/users", label: "Пользователи", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/moneymaker777/login';
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Перенаправление на страницу входа...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Доступ запрещён</p>
          <p className="text-muted-foreground">У вас нет прав администратора</p>
          <Link href="/" className="text-primary hover:underline text-sm">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold">
            Easy<span className="text-primary">Cash</span>
          </span>
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/50 bg-card/95 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/admin/orders" && location === "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border/50 bg-card/50 flex-col shrink-0">
        <div className="p-4 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold">
              Easy<span className="text-primary">Cash</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">Панель администратора</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/admin/orders" && location === "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground truncate">{user.name || user.email}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
