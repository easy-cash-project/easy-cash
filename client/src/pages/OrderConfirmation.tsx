import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = trpc.orders.getStatus.useQuery(
    { orderId: orderId || "" },
    { enabled: !!orderId }
  );
  const { data: currencies } = trpc.currencies.list.useQuery();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано в буфер обмена");
  };

  const giveCurrency = currencies?.find(c => c.id === order?.giveCurrencyId);
  const receiveCurrency = currencies?.find(c => c.id === order?.receiveCurrencyId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Заявка не найдена</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Заявка создана!</h1>
            <p className="text-muted-foreground">
              Переведите указанную сумму на адрес ниже
            </p>
          </div>

          <Card className="p-6 bg-card border-border/50 space-y-6 animate-fade-in-up stagger-2">
            {/* Order ID */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">ID заявки:</span>
              <span className="font-mono font-semibold text-primary">{order.orderId}</span>
            </div>

            {/* Exchange Summary */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
              <div className="text-center p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Вы отдаёте</p>
                <p className="text-lg font-bold font-mono">{order.giveAmount}</p>
                <p className="text-sm text-muted-foreground">{giveCurrency?.name}</p>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="text-center p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Вы получаете</p>
                <p className="text-lg font-bold font-mono">{order.receiveAmount}</p>
                <p className="text-sm text-muted-foreground">{receiveCurrency?.name}</p>
              </div>
            </div>

            {/* Deposit Address */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Адрес для перевода
              </label>
              <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/50 border border-border/50">
                <code className="flex-1 text-sm font-mono break-all text-foreground">
                  {order.depositAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(order.depositAddress)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-destructive font-medium">
                ⚠️ Отправьте ровно {order.giveAmount} {giveCurrency?.code} на этот адрес
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">Статус:</span>
              <StatusBadge status={order.status} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link href={`/status/${order.orderId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Отследить статус
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(order.orderId)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Копировать ID
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Ожидает оплаты", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    payment_received: { label: "Оплата получена", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    processing: { label: "Обработка", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    completed: { label: "Завершено", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    cancelled: { label: "Отменено", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  );
}
