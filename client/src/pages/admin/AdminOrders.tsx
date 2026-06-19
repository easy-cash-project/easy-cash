import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "pending", label: "Ожидает оплаты" },
  { value: "payment_received", label: "Оплата получена" },
  { value: "processing", label: "Обработка" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Отменено" },
];

export default function AdminOrders() {
  const { data: orders, isLoading, refetch } = trpc.adminOrders.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const updateStatusMutation = trpc.adminOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус обновлён");
      refetch();
      setSelectedOrder(null);
      setNewStatus("");
      setAdminNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  const getCurrencyName = (id: number) => currencies?.find(c => c.id === id)?.name || "—";

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      payment_received: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      processing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      completed: "bg-green-500/10 text-green-400 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config[status] || ""}`}>
        {label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Заявки</h1>
            <p className="text-sm text-muted-foreground">Управление заявками на обмен</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !orders?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Заявок пока нет</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders?.map((order: any) => (
              <Card key={order.id} className="p-4 bg-card border-border/50 hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-primary">{order.orderId}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Отдаёт:</span>
                        <p className="font-medium font-mono">{order.giveAmount} {getCurrencyName(order.giveCurrencyId)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Получает:</span>
                        <p className="font-medium font-mono">{order.receiveAmount} {getCurrencyName(order.receiveCurrencyId)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telegram:</span>
                        <p className="font-medium">{order.telegramHandle}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Реквизиты:</span>
                        <p className="font-medium truncate">{order.payoutDetails}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Депозит: <span className="font-mono">{order.depositAddress}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                  >
                    {selectedOrder === order.id ? "Закрыть" : "Изменить"}
                  </Button>
                </div>

                {/* Status Update Panel */}
                {selectedOrder === order.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Новый статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Заметка (необязательно)"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="bg-secondary/50"
                      />
                      <Button
                        onClick={() => {
                          if (!newStatus) { toast.error("Выберите статус"); return; }
                          updateStatusMutation.mutate({
                            id: order.id,
                            status: newStatus as any,
                            adminNote: adminNote || undefined,
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
