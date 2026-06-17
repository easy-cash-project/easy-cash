import { Link, useLocation } from "wouter";
import { ArrowLeftRight } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight">
            Easy<span className="text-primary">Cash</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className={`text-xs sm:text-sm font-medium transition-colors hover:text-primary ${
              location === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Обмен
          </Link>
          <Link
            href="/acquiring"
            className={`text-xs sm:text-sm font-medium transition-colors hover:text-primary ${
              location === "/acquiring" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Эквайринг
          </Link>
          <Link
            href="/status"
            className={`text-xs sm:text-sm font-medium transition-colors hover:text-primary ${
              location.startsWith("/status") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Статус
          </Link>

        </nav>
      </div>
    </header>
  );
}
