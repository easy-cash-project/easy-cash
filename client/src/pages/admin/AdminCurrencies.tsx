import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES_SEED } from "@shared/currencies";

export default function AdminCurrencies() {
  const { data: currencies, isLoading, refetch } = trpc.adminCurrencies.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"crypto" | "fiat">("crypto");
  const [network, setNetwork] = useState("");
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState("");

  const createMutation = trpc.adminCurrencies.create.useMutation({
    onSuccess: () => {
      toast.success("Валюта добавлена");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminCurrencies.delete.useMutation({
    onSuccess: () => {
      toast.success("Валюта удалена");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const seedMutation = trpc.adminCurrencies.create.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setShowAdd(false);
    setCode("");
    setName("");
    setType("crypto");
    setNetwork("");
    setSymbol("");
    setCategory("");
  };

  const handleCreate = () => {
    if (!code || !name) {
      toast.error("Заполните обязательные поля");
      return;
    }
    createMutation.mutate({
      code,
      name,
      type,
      network: network || null,
      symbol: symbol || null,
      category: category || null,
    });
  };

  const handleSeedAll = async () => {
    for (const c of CURRENCIES_SEED) {
      await seedMutation.mutateAsync({
        code: c.code,
        name: c.name,
        type: c.type,
        network: c.network,
        symbol: c.symbol,
        category: c.category,
        sortOrder: c.sortOrder,
      });
    }
    toast.success("Все валюты добавлены!");
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Валюты</h1>
            <p className="text-sm text-muted-foreground">Управление списком доступных валют</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            {(!currencies || currencies.length === 0) && (
              <Button variant="outline" size="sm" onClick={handleSeedAll}>
                Загрузить все валюты
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="font-semibold">Новая валюта</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Код (BTC, USDT...)" value={code} onChange={e => setCode(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />
              <Select value={type} onValueChange={(v) => setType(v as "crypto" | "fiat")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="fiat">Fiat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Сеть (ERC20, TRC20...)" value={network} onChange={e => setNetwork(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Символ (₿, ₮...)" value={symbol} onChange={e => setSymbol(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="Категория (Crypto, Карты...)" value={category} onChange={e => setCategory(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Отмена</Button>
            </div>
          </Card>
        )}

        {/* Currencies List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !currencies?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground mb-4">Валюты не настроены.</p>
            <Button onClick={handleSeedAll} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Загрузить стандартный набор валют
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currencies.map((c) => (
              <Card key={c.id} className="p-3 bg-card border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c.symbol}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                        {c.network && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{c.network}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.type === "crypto" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
                          {c.type}
                        </span>
                        {c.category && <span className="text-[10px] text-muted-foreground">{c.category}</span>}
                        <span className={`text-[10px] ${c.isActive ? "text-green-400" : "text-red-400"}`}>
                          {c.isActive ? "●" : "○"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: c.id })} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
