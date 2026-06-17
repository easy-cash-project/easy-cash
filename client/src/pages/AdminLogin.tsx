import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [openId, setOpenId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Вход выполнен успешно!");
      setOpenId("");
      setPassword("");
      // Redirect to admin panel
      setLocation("/moneymaker777/orders");
    },
    onError: (err) => {
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
      await loginMutation.mutateAsync({
        openId: openId.trim(),
        password: password.trim(),
      });
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
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || loginMutation.isPending}
                className="h-10"
              />
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
