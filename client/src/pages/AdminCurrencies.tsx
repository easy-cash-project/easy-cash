import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CurrencyForm {
  code: string;
  name: string;
  type: "crypto" | "fiat";
  network?: string;
  symbol?: string;
  isActive: boolean;
}

interface RateForm {
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: string;
  markupPercent: string;
  isActive: boolean;
}

export default function AdminCurrencies() {
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [newCurrency, setNewCurrency] = useState<CurrencyForm>({
    code: "",
    name: "",
    type: "crypto",
    network: "",
    symbol: "",
    isActive: true,
  });

  const [editingRate, setEditingRate] = useState<any>(null);
  const [newRate, setNewRate] = useState<RateForm>({
    fromCurrencyId: 0,
    toCurrencyId: 0,
    rate: "0",
    markupPercent: "0",
    isActive: true,
  });

  // Fetch currencies
  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const response = await trpc.currencies.list.query();
      return response;
    },
  });

  // Fetch rates
  const ratesQuery = useQuery({
    queryKey: ["rates"],
    queryFn: async () => {
      const response = await trpc.rates.listAll.query();
      return response;
    },
  });

  // Create currency mutation
  const createCurrencyMutation = useMutation({
    mutationFn: async (data: CurrencyForm) => {
      return trpc.currencies.create.mutate(data);
    },
    onSuccess: () => {
      toast.success("Валюта добавлена");
      currenciesQuery.refetch();
      setNewCurrency({
        code: "",
        name: "",
        type: "crypto",
        network: "",
        symbol: "",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: async (data: any) => {
      return trpc.currencies.update.mutate({
        id: data.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("Валюта обновлена");
      currenciesQuery.refetch();
      setEditingCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete currency mutation
  const deleteCurrencyMutation = useMutation({
    mutationFn: async (id: number) => {
      return trpc.currencies.delete.mutate({ id });
    },
    onSuccess: () => {
      toast.success("Валюта удалена");
      currenciesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Create rate mutation
  const createRateMutation = useMutation({
    mutationFn: async (data: RateForm) => {
      return trpc.rates.create.mutate({
        ...data,
        rate: parseFloat(data.rate),
        markupPercent: parseFloat(data.markupPercent),
      });
    },
    onSuccess: () => {
      toast.success("Курс добавлен");
      ratesQuery.refetch();
      setNewRate({
        fromCurrencyId: 0,
        toCurrencyId: 0,
        rate: "0",
        markupPercent: "0",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async (data: any) => {
      return trpc.rates.update.mutate({
        id: data.id,
        rate: parseFloat(data.rate),
        markupPercent: parseFloat(data.markupPercent),
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      toast.success("Курс обновлен");
      ratesQuery.refetch();
      setEditingRate(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      return trpc.rates.delete.mutate({ id });
    },
    onSuccess: () => {
      toast.success("Курс удален");
      ratesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const currencies = currenciesQuery.data || [];
  const rates = ratesQuery.data || [];

  const getCurrencyName = (id: number) => {
    const currency = currencies.find((c: any) => c.id === id);
    return currency ? `${currency.code} (${currency.name})` : `ID: ${id}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* ============ CURRENCIES ============ */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Валюты</h2>
            <Button size="sm" onClick={() => setEditingCurrency(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить валюту
            </Button>
          </div>

          {/* Add/Edit Currency Form */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-4">
              {editingCurrency ? "Редактировать валюту" : "Новая валюта"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Код</label>
                <Input
                  value={editingCurrency?.code || newCurrency.code}
                  onChange={(e) => {
                    if (editingCurrency) {
                      setEditingCurrency({ ...editingCurrency, code: e.target.value });
                    } else {
                      setNewCurrency({ ...newCurrency, code: e.target.value });
                    }
                  }}
                  placeholder="USDT_TRC20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={editingCurrency?.name || newCurrency.name}
                  onChange={(e) => {
                    if (editingCurrency) {
                      setEditingCurrency({ ...editingCurrency, name: e.target.value });
                    } else {
                      setNewCurrency({ ...newCurrency, name: e.target.value });
                    }
                  }}
                  placeholder="Tether (Tron)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип</label>
                <select
                  value={editingCurrency?.type || newCurrency.type}
                  onChange={(e) => {
                    if (editingCurrency) {
                      setEditingCurrency({ ...editingCurrency, type: e.target.value });
                    } else {
                      setNewCurrency({ ...newCurrency, type: e.target.value as "crypto" | "fiat" });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="crypto">Крипто</option>
                  <option value="fiat">Фиат</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Сеть</label>
                <Input
                  value={editingCurrency?.network || newCurrency.network || ""}
                  onChange={(e) => {
                    if (editingCurrency) {
                      setEditingCurrency({ ...editingCurrency, network: e.target.value });
                    } else {
                      setNewCurrency({ ...newCurrency, network: e.target.value });
                    }
                  }}
                  placeholder="TRC20, BEP20, ERC20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Символ</label>
                <Input
                  value={editingCurrency?.symbol || newCurrency.symbol || ""}
                  onChange={(e) => {
                    if (editingCurrency) {
                      setEditingCurrency({ ...editingCurrency, symbol: e.target.value });
                    } else {
                      setNewCurrency({ ...newCurrency, symbol: e.target.value });
                    }
                  }}
                  placeholder="₽, $"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCurrency?.isActive ?? newCurrency.isActive}
                    onChange={(e) => {
                      if (editingCurrency) {
                        setEditingCurrency({ ...editingCurrency, isActive: e.target.checked });
                      } else {
                        setNewCurrency({ ...newCurrency, isActive: e.target.checked });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Активна</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => {
                  if (editingCurrency) {
                    updateCurrencyMutation.mutate(editingCurrency);
                  } else {
                    createCurrencyMutation.mutate(newCurrency);
                  }
                }}
                disabled={
                  editingCurrency
                    ? updateCurrencyMutation.isPending
                    : createCurrencyMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCurrency ? "Сохранить" : "Добавить"}
              </Button>
              {editingCurrency && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingCurrency(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Отмена
                </Button>
              )}
            </div>
          </div>

          {/* Currencies List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Код</th>
                  <th className="text-left py-2 px-2">Название</th>
                  <th className="text-left py-2 px-2">Тип</th>
                  <th className="text-left py-2 px-2">Сеть</th>
                  <th className="text-left py-2 px-2">Статус</th>
                  <th className="text-right py-2 px-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency: any) => (
                  <tr key={currency.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-mono">{currency.code}</td>
                    <td className="py-2 px-2">{currency.name}</td>
                    <td className="py-2 px-2">
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                        {currency.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {currency.network || "-"}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          currency.isActive
                            ? "bg-green-500/20 text-green-700"
                            : "bg-red-500/20 text-red-700"
                        }`}
                      >
                        {currency.isActive ? "Активна" : "Неактивна"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCurrency(currency)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCurrencyMutation.mutate(currency.id)}
                          disabled={deleteCurrencyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ============ EXCHANGE RATES ============ */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Курсы обмена</h2>
            <Button size="sm" onClick={() => setEditingRate(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить курс
            </Button>
          </div>

          {/* Add/Edit Rate Form */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-4">
              {editingRate ? "Редактировать курс" : "Новый курс"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">От валюты</label>
                <select
                  value={editingRate?.fromCurrencyId || newRate.fromCurrencyId}
                  onChange={(e) => {
                    if (editingRate) {
                      setEditingRate({
                        ...editingRate,
                        fromCurrencyId: parseInt(e.target.value),
                      });
                    } else {
                      setNewRate({
                        ...newRate,
                        fromCurrencyId: parseInt(e.target.value),
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="0">Выберите валюту</option>
                  {currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">В валюту</label>
                <select
                  value={editingRate?.toCurrencyId || newRate.toCurrencyId}
                  onChange={(e) => {
                    if (editingRate) {
                      setEditingRate({
                        ...editingRate,
                        toCurrencyId: parseInt(e.target.value),
                      });
                    } else {
                      setNewRate({
                        ...newRate,
                        toCurrencyId: parseInt(e.target.value),
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="0">Выберите валюту</option>
                  {currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Базовый курс</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={editingRate?.rate || newRate.rate}
                  onChange={(e) => {
                    if (editingRate) {
                      setEditingRate({ ...editingRate, rate: e.target.value });
                    } else {
                      setNewRate({ ...newRate, rate: e.target.value });
                    }
                  }}
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  % надбавки/скидки
                  <span className="text-xs text-muted-foreground ml-2">
                    (+ продажа, - покупка)
                  </span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingRate?.markupPercent || newRate.markupPercent}
                  onChange={(e) => {
                    if (editingRate) {
                      setEditingRate({ ...editingRate, markupPercent: e.target.value });
                    } else {
                      setNewRate({ ...newRate, markupPercent: e.target.value });
                    }
                  }}
                  placeholder="2.5"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRate?.isActive ?? newRate.isActive}
                    onChange={(e) => {
                      if (editingRate) {
                        setEditingRate({ ...editingRate, isActive: e.target.checked });
                      } else {
                        setNewRate({ ...newRate, isActive: e.target.checked });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Активен</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => {
                  if (editingRate) {
                    updateRateMutation.mutate(editingRate);
                  } else {
                    createRateMutation.mutate(newRate);
                  }
                }}
                disabled={
                  editingRate ? updateRateMutation.isPending : createRateMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {editingRate ? "Сохранить" : "Добавить"}
              </Button>
              {editingRate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRate(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Отмена
                </Button>
              )}
            </div>
          </div>

          {/* Rates List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">От</th>
                  <th className="text-left py-2 px-2">В</th>
                  <th className="text-right py-2 px-2">Базовый курс</th>
                  <th className="text-right py-2 px-2">% надбавки</th>
                  <th className="text-right py-2 px-2">Эффективный курс</th>
                  <th className="text-left py-2 px-2">Статус</th>
                  <th className="text-right py-2 px-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate: any) => {
                  const effectiveRate =
                    parseFloat(rate.rate) * (1 + parseFloat(rate.markupPercent) / 100);
                  return (
                    <tr key={rate.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-mono text-xs">
                        {getCurrencyName(rate.fromCurrencyId)}
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">
                        {getCurrencyName(rate.toCurrencyId)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {parseFloat(rate.rate).toFixed(8)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={
                            parseFloat(rate.markupPercent) > 0
                              ? "text-green-600"
                              : parseFloat(rate.markupPercent) < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }
                        >
                          {parseFloat(rate.markupPercent) >= 0 ? "+" : ""}
                          {parseFloat(rate.markupPercent).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        {effectiveRate.toFixed(8)}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            rate.isActive
                              ? "bg-green-500/20 text-green-700"
                              : "bg-red-500/20 text-red-700"
                          }`}
                        >
                          {rate.isActive ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRate(rate)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRateMutation.mutate(rate.id)}
                            disabled={deleteRateMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
