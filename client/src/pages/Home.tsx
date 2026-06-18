import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowDownUp, Clock, Send, Loader2, AlertCircle, ChevronDown, Copy, Check } from "lucide-react";
import { toast } from "sonner";

function CurrencySelector({
  currencies,
  selectedId,
  onSelect,
  label,
}: {
  currencies: Array<{ id: number; code: string; name: string; type: string; network: string | null; symbol: string | null }>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = currencies.find(c => c.id === selectedId);
  const cryptoCurrencies = currencies.filter(c => c.type === "crypto");
  const fiatCurrencies = currencies.filter(c => c.type === "fiat");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 p-3.5 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{selected?.symbol || "?"}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{selected?.name || label}</p>
            {selected?.network && (
              <p className="text-[10px] text-muted-foreground">{selected.network}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-card border border-border/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
          <div className="max-h-[320px] overflow-y-auto p-2">
            {cryptoCurrencies.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5 font-semibold">Криптовалюты</p>
                {cryptoCurrencies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left text-sm transition-all duration-150 ${
                      selectedId === c.id
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <span className="text-base">{c.symbol}</span>
                    <span className="font-medium">{c.name}</span>
                    {c.network && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">{c.network}</span>}
                  </button>
                ))}
              </div>
            )}
            {fiatCurrencies.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5 font-semibold">Фиат / Карты</p>
                {fiatCurrencies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left text-sm transition-all duration-150 ${
                      selectedId === c.id
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <span className="text-base">{c.symbol}</span>
                    <span className="font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { data: currencies, isLoading: currenciesLoading } = trpc.currencies.list.useQuery();
  const { data: ratesMatrix } = trpc.rates.matrix.useQuery();
  const { data: addresses } = trpc.addresses.list.useQuery();
  
  // Extract rates array from matrix
  const rates = ratesMatrix?.rates || [];

  const [giveCurrencyId, setGiveCurrencyId] = useState<number | null>(null);
  const [receiveCurrencyId, setReceiveCurrencyId] = useState<number | null>(null);
  const [giveAmount, setGiveAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [lastEditedField, setLastEditedField] = useState<"give" | "receive">("give");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Set defaults when currencies load
  useEffect(() => {
    if (currencies && currencies.length > 0 && !giveCurrencyId) {
      const btc = currencies.find(c => c.code === "BTC");
      const rub = currencies.find(c => c.code === "RUB");
      if (btc) setGiveCurrencyId(btc.id);
      if (rub) setReceiveCurrencyId(rub.id);
    }
  }, [currencies, giveCurrencyId]);

  // Fetch rate for selected pair
  const rateQuery = trpc.rates.getForPair.useQuery(
    { fromCurrencyId: giveCurrencyId!, toCurrencyId: receiveCurrencyId! },
    { enabled: !!giveCurrencyId && !!receiveCurrencyId, refetchInterval: 60000 }
  );

  // Countdown timer for rate refresh
  useEffect(() => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          rateQuery.refetch();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [giveCurrencyId, receiveCurrencyId]);

  // Calculate amounts when rate changes
  useEffect(() => {
    if (!rateQuery.data) return;
    const rate = parseFloat(rateQuery.data.effectiveRate);
    if (lastEditedField === "give" && giveAmount) {
      const amount = parseFloat(giveAmount);
      if (!isNaN(amount)) {
        setReceiveAmount((amount * rate).toFixed(2));
      }
    } else if (lastEditedField === "receive" && receiveAmount) {
      const amount = parseFloat(receiveAmount);
      if (!isNaN(amount) && rate > 0) {
        setGiveAmount((amount / rate).toFixed(8));
      }
    }
  }, [rateQuery.data]);

  const handleGiveAmountChange = (val: string) => {
    setGiveAmount(val);
    setLastEditedField("give");
    if (rateQuery.data && val) {
      const amount = parseFloat(val);
      const rate = parseFloat(rateQuery.data.effectiveRate);
      if (!isNaN(amount)) {
        setReceiveAmount((amount * rate).toFixed(2));
      }
    } else {
      setReceiveAmount("");
    }
  };

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      navigate(`/order/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!giveCurrencyId || !receiveCurrencyId || !giveAmount || !receiveAmount || !payoutDetails || !telegramHandle) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    if (!rateQuery.data) {
      toast.error("Курс обмена недоступен для этой пары");
      return;
    }
    createOrderMutation.mutate({
      giveCurrencyId,
      giveAmount,
      receiveCurrencyId,
      receiveAmount,
      exchangeRate: rateQuery.data.effectiveRate,
      payoutDetails,
      telegramHandle,
    });
  };

  const giveCurrency = currencies?.find(c => c.id === giveCurrencyId);
  const receiveCurrency = currencies?.find(c => c.id === receiveCurrencyId);

  const allCurrencies = useMemo(() => currencies || [], [currencies]);

  // Get available currencies for "give" (from) field
  const availableGiveCurrencies = useMemo(() => {
    if (!currencies || !rates || rates.length === 0) return [];
    const currencyCodes = new Set<string>();
    
    rates.forEach((rate: any) => {
      // Rates matrix uses 'from' field with currency code
      if (rate.from) {
        currencyCodes.add(rate.from);
      }
    });
    
    console.log("Available give currency codes:", Array.from(currencyCodes));
    return currencies.filter(c => currencyCodes.has(c.code));
  }, [currencies, rates]);

  // Get available currencies for "receive" (to) field based on selected "give" currency
  const availableReceiveCurrencies = useMemo(() => {
    if (!currencies || !rates || !giveCurrencyId || rates.length === 0) return [];
    
    const giveCurrency = currencies.find(c => c.id === giveCurrencyId);
    if (!giveCurrency) return [];
    
    const currencyCodes = new Set<string>();
    rates.forEach((rate: any) => {
      // Rates matrix uses 'from' and 'to' fields with currency codes
      if (rate.from === giveCurrency.code && rate.to) {
        currencyCodes.add(rate.to);
      }
    });
    
    console.log(`Available receive currency codes for ${giveCurrency.code}:`, Array.from(currencyCodes));
    return currencies.filter(c => currencyCodes.has(c.code));
  }, [currencies, rates, giveCurrencyId]);

  const rateAvailable = !!rateQuery.data;
  const rateLoading = rateQuery.isLoading && !!giveCurrencyId && !!receiveCurrencyId;

  if (currenciesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-lg">
          {/* Hero */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Быстрый и безопасный <span className="text-primary">обмен криптовалют</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Обменивайте криптовалюту на рубли и обратно по лучшим курсам.
            </p>
          </div>

          {/* Exchange Form */}
          <Card className="p-6 md:p-8 bg-card border-border/50 shadow-2xl shadow-primary/5 animate-fade-in-up stagger-2">

            {/* 1. Отдаёте — выбор валюты */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Отдаёте</label>
              <CurrencySelector
                currencies={availableGiveCurrencies}
                selectedId={giveCurrencyId}
                onSelect={setGiveCurrencyId}
                label="Выберите валюту"
              />
            </div>

            {/* 2. Сумма */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Сумма</label>
              <Input
                type="number"
                placeholder="0.00"
                value={giveAmount}
                onChange={(e) => handleGiveAmountChange(e.target.value)}
                className="text-xl h-14 bg-secondary/50 border-border/50 font-mono"
              />
            </div>

            {/* Swap button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => {
                  const tmpId = giveCurrencyId;
                  setGiveCurrencyId(receiveCurrencyId);
                  setReceiveCurrencyId(tmpId);
                  setGiveAmount(receiveAmount);
                  setReceiveAmount(giveAmount);
                }}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors duration-200 active:scale-95"
              >
                <ArrowDownUp className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* 3. Получаете — выбор валюты */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Получаете</label>
              <CurrencySelector
                currencies={availableReceiveCurrencies}
                selectedId={receiveCurrencyId}
                onSelect={setReceiveCurrencyId}
                label="Выберите валюту"
              />
            </div>

            {/* 4. К выплате */}
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">К выплате:</span>
                <div className="text-right">
                  {rateLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : rateAvailable && receiveAmount ? (
                    <span className="text-2xl font-bold text-primary font-mono">
                      {receiveAmount} <span className="text-base text-muted-foreground">{receiveCurrency?.code}{receiveCurrency?.network ? ` (${receiveCurrency.network})` : ""}</span>
                    </span>
                  ) : (
                    <span className="text-lg text-muted-foreground font-mono">—</span>
                  )}
                </div>
              </div>
              {rateAvailable && giveCurrency && receiveCurrency && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                  <span className="text-xs text-muted-foreground">
                    Курс: 1 {giveCurrency.code}{giveCurrency.network ? ` (${giveCurrency.network})` : ""} = {parseFloat(rateQuery.data!.effectiveRate).toFixed(4)} {receiveCurrency.code}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}</span>
                  </div>
                </div>
              )}
            </div>

            {!rateLoading && !rateAvailable && giveCurrencyId && receiveCurrencyId && (
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">Курс обмена недоступен для этой пары</span>
              </div>
            )}

            {/* Telegram */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Telegram для связи</label>
              <Input
                type="text"
                placeholder="@username"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>

            {/* Payout Address */}
            <div className="space-y-3 mb-8">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Адрес кошелька для получения</label>
              <Input
                type="text"
                placeholder="Адрес кошелька"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
              {receiveCurrency && (
                <p className="text-xs text-muted-foreground">
                  Укажите адрес кошелька {receiveCurrency.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending || !rateAvailable}
              className="w-full h-12 text-base font-semibold"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание заявки...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Создать заявку
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Нажимая "Создать заявку", вы соглашаетесь с правилами обмена
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
