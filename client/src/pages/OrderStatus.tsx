import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Clock, CheckCircle, XCircle, CreditCard, Cog } from "lucide-react";

export default function OrderStatus() {
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const [searchId, setSearchId] = useState(paramOrderId || "");
  const [queryId, setQueryId] = useState(paramOrderId || "");

  const { data: order, isLoading, error } = trpc.orders.getStatus.useQuery(
    { orderId: queryId },
    { enabled: !!queryId, retry: false }
  );
  const { data: currencies } = trpc.currencies.list.useQuery();

  const handleSearch = () => {
    if (searchId.trim()) {
      setQueryId(searchId.trim());
    }
  };

  const giveCurrency = currencies?.find(c => c.id === order?.giveCurrencyId);
  const receiveCurrency = currencies?.find(c => c.id === order?.receiveCurrencyId);

  const statusSteps = [
    { key: "pending", label: "Ожидает оплаты", icon: Clock },
    { key: "payment_received", label: "Оплата получена", icon: CreditCard },
    { key: "processing", label: "Обработка", icon: Cog },
    { key: "completed", label: "Завершено", icon: CheckCircle },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!order) return "inactive";
    if (order.status === "cancelled") return stepKey === order.status ? "active" : "inactive";
    const statusOrder = ["pending", "payment_received", "processing", "completed"];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "inactive";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold mb-2">Статус заявки</h1>
            <p className="text-muted-foreground">Введите ID заявки для отслеживания</p>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-8 animate-fade-in-up stagger-2">
            <Input
              placeholder="Введите ID заявки"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-secondary/50 border-border/50 font-mono"
            />
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Loading */}
          {isLoading && queryId && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {error && queryId && (
            <Card className="p-6 bg-card border-border/50 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <p className="text-muted-foreground">Заявка не найдена. Проверьте ID и попробуйте снова.</p>
            </Card>
          )}

          {/* Order Found */}
          {order && (
            <Card className="p-6 bg-card border-border/50 space-y-6 animate-scale-in">
              {/* Order ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Заявка:</span>
                <span className="font-mono font-semibold text-primary">{order.orderId}</span>
              </div>

              {/* Status Progress */}
              {order.status !== "cancelled" ? (
                <div className="space-y-1">
                  {statusSteps.map((step, idx) => {
                    const status = getStepStatus(step.key);
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          status === "completed" ? "bg-primary/20 text-primary" :
                          status === "active" ? "bg-primary text-primary-foreground" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${
                          status === "active" ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </span>
                        {status === "active" && (
                          <span className="ml-auto text-xs text-primary font-medium">Текущий</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <span className="font-medium text-destructive">Заявка отменена</span>
                </div>
              )}

              {/* Exchange Details */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Отдаёте:</span>
                  <span className="font-mono font-medium">{order.giveAmount} {giveCurrency?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Получаете:</span>
                  <span className="font-mono font-medium">{order.receiveAmount} {receiveCurrency?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Курс:</span>
                  <span className="font-mono text-muted-foreground">{order.exchangeRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Создана:</span>
                  <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
