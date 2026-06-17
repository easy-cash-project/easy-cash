import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminRates() {
  const { data: rates, isLoading, refetch } = trpc.adminRates.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [rate, setRate] = useState("");
  const [markup, setMarkup] = useState("0");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const createMutation = trpc.adminRates.create.useMutation({
    onSuccess: () => {
      toast.success("Курс добавлен");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminRates.delete.useMutation({
    onSuccess: () => {
      toast.success("Курс удалён");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.adminRates.update.useMutation({
    onSuccess: () => {
      toast.success("Курс обновлён");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowAdd(false);
    setFromId("");
    setToId("");
    setRate("");
    setMarkup("0");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleCreate = () => {
    if (!fromId || !toId || !rate) {
      toast.error("Заполните обязательные поля");
      return;
    }
    createMutation.mutate({
      fromCurrencyId: parseInt(fromId),
      toCurrencyId: parseInt(toId),
      rate,
      markupPercent: markup || "0",
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
    });
  };

  const getCurrencyName = (id: number) => currencies?.find(c => c.id === id)?.name || `ID:${id}`;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Курсы обмена</h1>
            <p className="text-sm text-muted-foreground">Управление курсами валютных пар</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="font-semibold">Новый курс</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger><SelectValue placeholder="Из валюты" /></SelectTrigger>
                <SelectContent>
                  {currencies?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger><SelectValue placeholder="В валюту" /></SelectTrigger>
                <SelectContent>
                  {currencies?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Курс (напр. 25000.00)" value={rate} onChange={e => setRate(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Наценка % (напр. 2.5)" value={markup} onChange={e => setMarkup(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Мин. сумма (необяз.)" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Макс. сумма (необяз.)" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Отмена</Button>
            </div>
          </Card>
        )}

        {/* Rates List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !rates?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Курсы не настроены</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rates.map((r) => (
              <RateRow
                key={r.id}
                rate={r}
                getCurrencyName={getCurrencyName}
                onDelete={() => deleteMutation.mutate({ id: r.id })}
                onUpdate={(data) => updateMutation.mutate({ id: r.id, ...data })}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function RateRow({ rate, getCurrencyName, onDelete, onUpdate }: {
  rate: any;
  getCurrencyName: (id: number) => string;
  onDelete: () => void;
  onUpdate: (data: { rate?: string; markupPercent?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editRate, setEditRate] = useState(rate.rate);
  const [editMarkup, setEditMarkup] = useState(rate.markupPercent);

  const effectiveRate = parseFloat(rate.rate) * (1 + parseFloat(rate.markupPercent) / 100);

  return (
    <Card className="p-4 bg-card border-border/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{getCurrencyName(rate.fromCurrencyId)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{getCurrencyName(rate.toCurrencyId)}</span>
          </div>
          {!editing ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Курс: <span className="font-mono text-foreground">{rate.rate}</span></span>
              <span>Наценка: <span className="font-mono text-foreground">{rate.markupPercent}%</span></span>
              <span>Итого: <span className="font-mono text-primary">{effectiveRate.toFixed(4)}</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <Input value={editRate} onChange={e => setEditRate(e.target.value)} placeholder="Курс" className="w-32 h-8 bg-secondary/50 text-sm" />
              <Input value={editMarkup} onChange={e => setEditMarkup(e.target.value)} placeholder="%" className="w-20 h-8 bg-secondary/50 text-sm" />
              <Button size="sm" onClick={() => { onUpdate({ rate: editRate, markupPercent: editMarkup }); setEditing(false); }} className="h-8 bg-primary text-primary-foreground">
                Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-8">
                Отмена
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
              Изменить
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
