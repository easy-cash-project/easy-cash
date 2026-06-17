import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RefreshCw, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminAddresses() {
  const { data: addresses, isLoading, refetch } = trpc.adminAddresses.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [currencyId, setCurrencyId] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");

  const createMutation = trpc.adminAddresses.create.useMutation({
    onSuccess: () => {
      toast.success("Адрес добавлен");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminAddresses.delete.useMutation({
    onSuccess: () => {
      toast.success("Адрес удалён");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.adminAddresses.update.useMutation({
    onSuccess: () => {
      toast.success("Адрес обновлён");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowAdd(false);
    setCurrencyId("");
    setAddress("");
    setLabel("");
  };

  const handleCreate = () => {
    if (!currencyId || !address) {
      toast.error("Заполните обязательные поля");
      return;
    }
    createMutation.mutate({
      currencyId: parseInt(currencyId),
      address,
      label: label || null,
    });
  };

  const getCurrencyName = (id: number) => currencies?.find(c => c.id === id)?.name || `ID:${id}`;
  const cryptoCurrencies = currencies?.filter(c => c.type === "crypto") || [];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Адреса для депозитов</h1>
            <p className="text-sm text-muted-foreground">Крипто-адреса, которые показываются клиентам для перевода</p>
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
            <h3 className="font-semibold">Новый адрес</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={currencyId} onValueChange={setCurrencyId}>
                <SelectTrigger><SelectValue placeholder="Валюта" /></SelectTrigger>
                <SelectContent>
                  {cryptoCurrencies.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.network ? ` (${c.network})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Адрес кошелька" value={address} onChange={e => setAddress(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Метка (необяз.)" value={label} onChange={e => setLabel(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Отмена</Button>
            </div>
          </Card>
        )}

        {/* Addresses List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !addresses?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Адреса не настроены. Добавьте адреса для приёма криптовалюты.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <AddressRow
                key={addr.id}
                addr={addr}
                getCurrencyName={getCurrencyName}
                onDelete={() => deleteMutation.mutate({ id: addr.id })}
                onUpdate={(data) => updateMutation.mutate({ id: addr.id, ...data })}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AddressRow({ addr, getCurrencyName, onDelete, onUpdate }: {
  addr: any;
  getCurrencyName: (id: number) => string;
  onDelete: () => void;
  onUpdate: (data: { address?: string; label?: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editAddress, setEditAddress] = useState(addr.address);
  const [editLabel, setEditLabel] = useState(addr.label || "");

  const handleSave = () => {
    onUpdate({ address: editAddress, label: editLabel || null });
    setEditing(false);
  };

  return (
    <Card className="p-4 bg-card border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">{getCurrencyName(addr.currencyId)}</span>
            {addr.label && !editing && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{addr.label}</span>}
            <span className={`text-xs px-2 py-0.5 rounded ${addr.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {addr.isActive ? "Активен" : "Неактивен"}
            </span>
          </div>
          {!editing ? (
            <p className="font-mono text-sm text-muted-foreground truncate">{addr.address}</p>
          ) : (
            <div className="space-y-2 mt-2">
              <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Адрес" className="bg-secondary/50 text-sm font-mono" />
              <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="Метка (необяз.)" className="bg-secondary/50 text-sm" />
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleSave} className="text-primary hover:text-primary">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
