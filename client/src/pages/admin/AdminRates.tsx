import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Edit2, Save, X } from "lucide-react";
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

export default function AdminRates() {
  const { data: rates, isLoading, refetch } = trpc.adminRates.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ rate: string; markupPercent: string; markupPercentBuy: string }>({
    rate: "",
    markupPercent: "",
    markupPercentBuy: "",
  });

  const updateMutation = trpc.adminRates.update.useMutation({
    onSuccess: () => {
      toast.success("Курс обновлён");
      refetch();
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const getCurrencyByCode = (code: string) => {
    return currencies?.find(c => c.code === code);
  };

  const getRateForPair = (fromCode: string, toCode: string) => {
    const fromCurrency = getCurrencyByCode(fromCode);
    const toCurrency = getCurrencyByCode(toCode);
    
    if (!fromCurrency || !toCurrency) return null;
    
    return rates?.find(r => 
      r.fromCurrencyId === fromCurrency.id && r.toCurrencyId === toCurrency.id
    );
  };

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setEditValues({
      rate: rate.rate,
      markupPercent: rate.markupPercent,
      markupPercentBuy: rate.markupPercentBuy || "-" + rate.markupPercent,
    });
  };

  const handleSave = () => {
    if (editingId === null) return;
    
    updateMutation.mutate({
      id: editingId,
      rate: editValues.rate,
      markupPercent: editValues.markupPercent,
    });
  };

  const rubCurrency = currencies?.find(c => c.code === 'RUB');

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Курсы обмена</h1>
            <p className="text-sm text-muted-foreground">Управление курсами валютных пар</p>
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

              // Get rates: Crypto to RUB and RUB to Crypto
              const cryptoToRub = getRateForPair(crypto.code, 'RUB');
              const rubToCrypto = getRateForPair('RUB', crypto.code);

              const isEditing = editingId === cryptoToRub?.id;

              return (
                <Card key={crypto.code} className="p-4 bg-card border-border/50">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{crypto.name}</h3>
                        <p className="text-xs text-muted-foreground">{crypto.code}</p>
                      </div>
                    </div>

                    {/* Crypto to RUB (SELL) */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Продажа (1 {crypto.code} = ? RUB)</p>
                          {!isEditing && cryptoToRub ? (
                            <div className="flex items-center gap-4 text-sm">
                              <span>Курс: <span className="font-mono font-semibold text-foreground">{parseFloat(cryptoToRub.rate).toFixed(2)}</span> ₽</span>
                              <span>Наценка: <span className="font-mono font-semibold text-green-600">+{parseFloat(cryptoToRub.markupPercent).toFixed(2)}%</span></span>
                              <span>Продаю за: <span className="font-mono font-semibold text-primary">{(parseFloat(cryptoToRub.rate) * (1 + parseFloat(cryptoToRub.markupPercent) / 100)).toFixed(2)}</span> ₽</span>
                            </div>
                          ) : isEditing && cryptoToRub ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                step="0.01" 
                                value={editValues.rate} 
                                onChange={(e) => setEditValues({ ...editValues, rate: e.target.value })}
                                placeholder="Курс"
                                className="w-24 h-8 bg-background text-sm"
                              />
                              <span className="text-sm">₽</span>
                              <span className="text-sm text-muted-foreground">Наценка:</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                value={editValues.markupPercent} 
                                onChange={(e) => setEditValues({ ...editValues, markupPercent: e.target.value })}
                                placeholder="%"
                                className="w-20 h-8 bg-background text-sm"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Нет данных</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {cryptoToRub && !isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(cryptoToRub)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {isEditing && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingId(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RUB to Crypto (BUY) */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Покупка (1 RUB = ? {crypto.code})</p>
                          {rubToCrypto ? (
                            <div className="flex items-center gap-4 text-sm">
                              <span>Курс: <span className="font-mono font-semibold text-foreground">{parseFloat(rubToCrypto.rate).toFixed(8)}</span></span>
                              <span>Скидка: <span className="font-mono font-semibold text-red-600">{parseFloat(rubToCrypto.markupPercent).toFixed(2)}%</span></span>
                              <span>Покупаю за: <span className="font-mono font-semibold text-primary">{(parseFloat(rubToCrypto.rate) * (1 + parseFloat(rubToCrypto.markupPercent) / 100)).toFixed(8)}</span></span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Нет данных</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
