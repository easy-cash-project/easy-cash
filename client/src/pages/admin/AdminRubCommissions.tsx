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

export default function AdminRubCommissions() {
  const { data: rates, isLoading: ratesLoading, refetch: refetchRates } = trpc.adminRates.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editSellMarkup, setEditSellMarkup] = useState<string>("");
  const [editBuyMarkup, setEditBuyMarkup] = useState<string>("");
  const [editSellMinAmount, setEditSellMinAmount] = useState<string>("");
  const [editSellMaxAmount, setEditSellMaxAmount] = useState<string>("");
  const [editBuyMinAmount, setEditBuyMinAmount] = useState<string>("");
  const [editBuyMaxAmount, setEditBuyMaxAmount] = useState<string>("");

  const updateMutation = trpc.adminRates.update.useMutation({
    onSuccess: () => {
      toast.success("Комиссия обновлена");
      refetchRates();
      setEditingCode(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const getCurrencyByCode = (code: string) => {
    return currencies?.find(c => c.code === code);
  };

  const getDbRate = (fromCode: string, toCode: string) => {
    const fromCurrency = getCurrencyByCode(fromCode);
    const toCurrency = getCurrencyByCode(toCode);
    
    if (!fromCurrency || !toCurrency) return null;
    
    return rates?.find(r => 
      r.fromCurrencyId === fromCurrency.id && r.toCurrencyId === toCurrency.id
    );
  };

  const handleEdit = (cryptoCode: string) => {
    const sellRate = getDbRate(cryptoCode, 'RUB');
    const buyRate = getDbRate('RUB', cryptoCode);
    
    if (sellRate && buyRate) {
      setEditingCode(cryptoCode);
      setEditSellMarkup(sellRate.markupPercent.toString());
      setEditBuyMarkup(buyRate.markupPercent.toString());
      setEditSellMinAmount(sellRate.minAmount?.toString() || "");
      setEditSellMaxAmount(sellRate.maxAmount?.toString() || "");
      setEditBuyMinAmount(buyRate.minAmount?.toString() || "");
      setEditBuyMaxAmount(buyRate.maxAmount?.toString() || "");
    }
  };

  const handleSaveSell = (sellRateId: number) => {
    updateMutation.mutate({
      id: sellRateId,
      markupPercent: editSellMarkup,
      minAmount: editSellMinAmount || null,
      maxAmount: editSellMaxAmount || null,
    });
  };

  const handleSaveBuy = (buyRateId: number) => {
    updateMutation.mutate({
      id: buyRateId,
      markupPercent: editBuyMarkup,
      minAmount: editBuyMinAmount || null,
      maxAmount: editBuyMaxAmount || null,
    });
  };

  const isLoading = ratesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Покупка/Продажа РУБ</h1>
            <p className="text-sm text-muted-foreground">Управление комиссиями на обмен криптовалют на рубли</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchRates()}>
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

              const sellRate = getDbRate(crypto.code, 'RUB');
              const buyRate = getDbRate('RUB', crypto.code);
              const isEditing = editingCode === crypto.code;

              if (!sellRate || !buyRate) return null;

              return (
                <Card key={crypto.code} className="p-4 bg-card border-border/50">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{crypto.name}</h3>
                        <p className="text-xs text-muted-foreground">{crypto.code}</p>
                      </div>
                    </div>

                    {/* Sell Commission */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-2">Продажа (1 {crypto.code} = ? RUB)</p>
                          {!isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span>Комиссия:</span>
                                <span className="font-mono font-semibold text-green-600">
                                  {parseFloat(sellRate.markupPercent.toString()).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Лимиты:</span>
                                <span className="font-mono">
                                  {sellRate.minAmount ? parseFloat(sellRate.minAmount.toString()).toFixed(0) : '—'} - {sellRate.maxAmount ? parseFloat(sellRate.maxAmount.toString()).toFixed(0) : '—'} RUB
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Комиссия:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editSellMarkup} 
                                  onChange={(e) => setEditSellMarkup(e.target.value)}
                                  placeholder="%"
                                  className="w-20 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Мин:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editSellMinAmount} 
                                  onChange={(e) => setEditSellMinAmount(e.target.value)}
                                  placeholder="0"
                                  className="w-24 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">Макс:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editSellMaxAmount} 
                                  onChange={(e) => setEditSellMaxAmount(e.target.value)}
                                  placeholder="0"
                                  className="w-24 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">RUB</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(crypto.code)}
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
                                onClick={() => handleSaveSell(sellRate.id)}
                                disabled={updateMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingCode(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Buy Commission */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-2">Покупка (1 RUB = ? {crypto.code})</p>
                          {!isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span>Комиссия:</span>
                                <span className="font-mono font-semibold text-red-600">
                                  {parseFloat(buyRate.markupPercent.toString()).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Лимиты:</span>
                                <span className="font-mono">
                                  {buyRate.minAmount ? parseFloat(buyRate.minAmount.toString()).toFixed(0) : '—'} - {buyRate.maxAmount ? parseFloat(buyRate.maxAmount.toString()).toFixed(0) : '—'} RUB
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Комиссия:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editBuyMarkup} 
                                  onChange={(e) => setEditBuyMarkup(e.target.value)}
                                  placeholder="%"
                                  className="w-20 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Мин:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editBuyMinAmount} 
                                  onChange={(e) => setEditBuyMinAmount(e.target.value)}
                                  placeholder="0"
                                  className="w-24 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">Макс:</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={editBuyMaxAmount} 
                                  onChange={(e) => setEditBuyMaxAmount(e.target.value)}
                                  placeholder="0"
                                  className="w-24 h-8 bg-background text-sm"
                                />
                                <span className="text-sm">RUB</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(crypto.code)}
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
                                onClick={() => handleSaveBuy(buyRate.id)}
                                disabled={updateMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingCode(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
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
