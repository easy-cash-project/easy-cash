import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeftRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [openId, setOpenId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      console.log("Login successful:", data);
      
      // Store JWT token in localStorage FIRST - before any other operations
      if (data.token) {
        localStorage.setItem("auth-token", data.token);
        console.log("Token stored in localStorage");
      }
      
      toast.success("Вход выполнен успешно!");
      
      // Clear form
      setOpenId("");
      setPassword("");
      
      // Invalidate and refetch auth.me query to get fresh data with new token
      console.log("Invalidating auth.me query");
      await utils.auth.me.invalidate();
      
      // Wait a bit for the query to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to admin panel
      console.log("Redirecting to admin panel");
      setLocation("/moneymaker777/orders");
    },
    onError: (err) => {
      console.error("Login error:", err);
      toast.error(err.message || "Ошибка входа");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!openId.trim()) {
      toast.error("Введите OpenID");
      return;
    }
    
    if (!password.trim()) {
      toast.error("Введите пароль");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting login with:", { openId: openId.trim() });
      await loginMutation.mutateAsync({
        openId: openId.trim(),
        password: password.trim(),
      });
    } catch (error) {
      console.error("Login mutation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Easy<span className="text-primary">Cash</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Панель администратора</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-6 space-y-6 border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Вход в систему</h2>
            <p className="text-sm text-muted-foreground">
              Введите ваши учётные данные для доступа
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OpenID Input */}
            <div className="space-y-2">
              <label htmlFor="openId" className="text-sm font-medium">
                OpenID
              </label>
              <Input
                id="openId"
                type="text"
                placeholder="Введите OpenID"
                value={openId}
                onChange={(e) => setOpenId(e.target.value)}
                disabled={isLoading || loginMutation.isPending}
                className="h-10"
                autoComplete="username"
              />
            </div>

            {/* Password Input with Show/Hide Button */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || loginMutation.isPending}
                  className="h-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || loginMutation.isPending}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || loginMutation.isPending}
              className="w-full h-10 font-medium"
            >
              {isLoading || loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>

          {/* Error Message */}
          {loginMutation.error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {loginMutation.error.message}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Защищённая административная панель</p>
        </div>
      </div>
    </div>
  );
}
