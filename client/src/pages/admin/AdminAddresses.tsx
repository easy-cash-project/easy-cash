import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Pencil, X, Check, Plus } from "lucide-react";
import { toast } from "sonner";

// List of supported cryptocurrencies
const SUPPORTED_CRYPTOS = [
  { code: 'USDT_TRC20', name: 'USDT (Tron)' },
  { code: 'USDT_BEP20', name: 'USDT (BSC)' },
  { code: 'USDT_SOL', name: 'USDT (Solana)' },
  { code: 'USDT_TON', name: 'USDT (Ton)' },
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'LTC', name: 'Litecoin' },
  { code: 'TON', name: 'Ton' },
  { code: 'XMR', name: 'Monero' },
];

export default function AdminAddresses() {
  const { data: addresses, isLoading, refetch } = trpc.adminAddresses.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  const createMutation = trpc.adminAddresses.create.useMutation({
    onSuccess: () => {
      toast.success("Адрес добавлен");
      refetch();
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

  const getCurrencyByCode = (code: string) => {
    return currencies?.find(c => c.code === code);
  };

  const getAddressesForCurrency = (currencyId: number) => {
    return addresses?.filter(a => a.currencyId === currencyId) || [];
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Адреса для депозитов</h1>
            <p className="text-sm text-muted-foreground">Крипто-адреса, которые показываются клиентам для перевода</p>
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
        ) : !currencies?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Валюты не настроены</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {SUPPORTED_CRYPTOS.map((crypto) => {
              const currency = getCurrencyByCode(crypto.code);
              if (!currency) return null;

              const cryptoAddresses = getAddressesForCurrency(currency.id);

              return (
                <CryptoAddressCard
                  key={crypto.code}
                  crypto={crypto}
                  currency={currency}
                  addresses={cryptoAddresses}
                  onDelete={(id) => deleteMutation.mutate({ id })}
                  onUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
                  onCreate={(data) => createMutation.mutate(data)}
                  isDeleting={deleteMutation.isPending}
                  isUpdating={updateMutation.isPending}
                  isCreating={createMutation.isPending}
                />
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CryptoAddressCard({
  crypto,
  currency,
  addresses,
  onDelete,
  onUpdate,
  onCreate,
  isDeleting,
  isUpdating,
  isCreating,
}: {
  crypto: any;
  currency: any;
  addresses: any[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: any) => void;
  onCreate: (data: any) => void;
  isDeleting: boolean;
  isUpdating: boolean;
  isCreating: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleAddAddress = () => {
    if (!newAddress.trim()) {
      toast.error("Введите адрес");
      return;
    }

    onCreate({
      currencyId: currency.id,
      address: newAddress,
      label: newLabel || null,
    });

    setNewAddress("");
    setNewLabel("");
    setShowAddForm(false);
  };

  return (
    <Card className="p-4 bg-card border-border/50">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">{crypto.name}</h3>
            <p className="text-xs text-muted-foreground">{crypto.code}</p>
          </div>
          {!showAddForm && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить адрес
            </Button>
          )}
        </div>

        {/* Add Address Form */}
        {showAddForm && (
          <div className="bg-secondary/30 p-3 rounded-lg space-y-2">
            <div className="space-y-2">
              <Input
                placeholder="Адрес кошелька"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="bg-background text-sm"
              />
              <Input
                placeholder="Метка (необязательно)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-background text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddAddress}
                disabled={isCreating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добавить"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAddress("");
                  setNewLabel("");
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-secondary/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Адреса не добавлены</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <AddressRow
                key={addr.id}
                addr={addr}
                onDelete={() => onDelete(addr.id)}
                onUpdate={(data) => onUpdate(addr.id, data)}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function AddressRow({
  addr,
  onDelete,
  onUpdate,
  isDeleting,
  isUpdating,
}: {
  addr: any;
  onDelete: () => void;
  onUpdate: (data: any) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editAddress, setEditAddress] = useState(addr.address);
  const [editLabel, setEditLabel] = useState(addr.label || "");

  const handleSave = () => {
    if (!editAddress.trim()) {
      toast.error("Адрес не может быть пустым");
      return;
    }
    onUpdate({ address: editAddress, label: editLabel || null });
    setEditing(false);
  };

  return (
    <div className="bg-secondary/30 p-3 rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {!editing ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono text-sm text-foreground truncate">{addr.address}</p>
                {addr.label && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {addr.label}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    addr.isActive
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {addr.isActive ? "Активен" : "Неактивен"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Адрес"
                className="bg-background text-sm font-mono"
              />
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Метка (необязательно)"
                className="bg-background text-sm"
              />
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setEditAddress(addr.address);
                  setEditLabel(addr.label || "");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
