import { useState, useMemo } from "react";
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
  const { data: rates, isLoading: ratesLoading, refetch: refetchRates } = trpc.adminRates.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();
  const { data: ratesMatrix, isLoading: matrixLoading } = trpc.rates.matrix.useQuery();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMarkup, setEditMarkup] = useState<string>("");

  const updateMutation = trpc.adminRates.update.useMutation({
    onSuccess: () => {
      toast.success("Наценка обновлена");
      refetchRates();
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const getCurrencyByCode = (code: string) => {
    return currencies?.find(c => c.code === code);
  };

  const getRapiraRate = (fromCode: string, toCode: string) => {
    if (!ratesMatrix) return null;
    return ratesMatrix.rates?.find(r => r.from === fromCode && r.to === toCode);
  };

  const getDbRate = (fromCode: string, toCode: string) => {
    const fromCurrency = getCurrencyByCode(fromCode);
    const toCurrency = getCurrencyByCode(toCode);
    
    if (!fromCurrency || !toCurrency) return null;
    
    return rates?.find(r => 
      r.fromCurrencyId === fromCurrency.id && r.toCurrencyId === toCurrency.id
    );
  };

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setEditMarkup(rate.markupPercent.toString());
  };

  const handleSave = () => {
    if (editingId === null) return;
    
    updateMutation.mutate({
      id: editingId,
      markupPercent: editMarkup,
    });
  };

  const isLoading = ratesLoading || matrixLoading;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Курсы обмена</h1>
            <p className="text-sm text-muted-foreground">Управление курсами валютных пар</p>
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

              // Get rates: Crypto to RUB and RUB to Crypto
              const rapiraCryptoToRub = getRapiraRate(crypto.code, 'RUB');
              const rapiraRubToCrypto = getRapiraRate('RUB', crypto.code);
              const dbCryptoToRub = getDbRate(crypto.code, 'RUB');
              const dbRubToCrypto = getDbRate('RUB', crypto.code);

              const isEditingCryptoToRub = editingId === dbCryptoToRub?.id;
              const isEditingRubToCrypto = editingId === dbRubToCrypto?.id;

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
                    {rapiraCryptoToRub && (
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-2">Продажа (1 {crypto.code} = ? RUB)</p>
                            <div className="space-y-2">
                              {/* Rapira Rate */}
                              <div className="flex items-center gap-4 text-sm">
                                <span>Курс Rapira:</span>
                                <span className="font-mono font-semibold text-foreground">{parseFloat(rapiraCryptoToRub.rate.toString()).toFixed(2)}</span>
                                <span className="text-muted-foreground">₽</span>
                              </div>

                              {/* Markup Edit */}
                              {!isEditingCryptoToRub && dbCryptoToRub ? (
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Наценка:</span>
                                  <span className="font-mono font-semibold text-green-600">+{parseFloat(dbCryptoToRub.markupPercent.toString()).toFixed(2)}%</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span>Итоговый курс:</span>
                                  <span className="font-mono font-semibold text-primary">
                                    {(parseFloat(rapiraCryptoToRub.rate.toString()) * (1 + parseFloat(dbCryptoToRub.markupPercent.toString()) / 100)).toFixed(2)}
                                  </span>
                                  <span className="text-muted-foreground">₽</span>
                                </div>
                              ) : isEditingCryptoToRub && dbCryptoToRub ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Наценка:</span>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={editMarkup} 
                                    onChange={(e) => setEditMarkup(e.target.value)}
                                    placeholder="%"
                                    className="w-20 h-8 bg-background text-sm"
                                  />
                                  <span className="text-sm">%</span>
                                  <span className="text-sm text-muted-foreground">|</span>
                                  <span className="text-sm">Итоговый:</span>
                                  <span className="font-mono font-semibold text-primary text-sm">
                                    {(parseFloat(rapiraCryptoToRub.rate.toString()) * (1 + parseFloat(editMarkup || "0") / 100)).toFixed(2)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">₽</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {dbCryptoToRub && !isEditingCryptoToRub && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(dbCryptoToRub)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            {isEditingCryptoToRub && (
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
                    )}

                    {/* RUB to Crypto (BUY) */}
                    {rapiraRubToCrypto && (
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-2">Покупка (1 RUB = ? {crypto.code})</p>
                            <div className="space-y-2">
                              {/* Rapira Rate */}
                              <div className="flex items-center gap-4 text-sm">
                                <span>Курс Rapira:</span>
                                <span className="font-mono font-semibold text-foreground">{parseFloat(rapiraRubToCrypto.rate.toString()).toFixed(8)}</span>
                              </div>

                              {/* Markup Display */}
                              {dbRubToCrypto ? (
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Наценка:</span>
                                  <span className="font-mono font-semibold text-red-600">{parseFloat(dbRubToCrypto.markupPercent.toString()).toFixed(2)}%</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span>Итоговый курс:</span>
                                  <span className="font-mono font-semibold text-primary">
                                    {(parseFloat(rapiraRubToCrypto.rate.toString()) * (1 + parseFloat(dbRubToCrypto.markupPercent.toString()) / 100)).toFixed(8)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
