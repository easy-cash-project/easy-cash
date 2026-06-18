import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowDownUp, Clock, Send, Loader2, AlertCircle, ChevronDown, Copy, Check, Shield, Zap, TrendingUp, HelpCircle } from "lucide-react";
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
        onClick={() => {
          console.log('Dropdown clicked, open:', open, 'currencies:', currencies.length);
          setOpen(!open);
        }}
        className="w-full flex items-center justify-between gap-2 p-3.5 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{selected?.symbol || "?"}</span>
          <div>
            <div className="font-semibold text-sm">{selected?.code || label}</div>
            <div className="text-xs text-muted-foreground">{selected?.name || ""}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {cryptoCurrencies.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase sticky top-0 bg-secondary/50">
                Криптовалюты
              </div>
              {cryptoCurrencies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">{c.symbol}</span>
                  <div>
                    <div className="font-semibold text-sm">{c.code}</div>
                    <div className="text-xs text-muted-foreground">{c.name}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {fiatCurrencies.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase sticky top-0 bg-secondary/50">
                Фиатные валюты
              </div>
              {fiatCurrencies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">{c.symbol}</span>
                  <div>
                    <div className="font-semibold text-sm">{c.code}</div>
                    <div className="text-xs text-muted-foreground">{c.name}</div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [giveCurrencyId, setGiveCurrencyId] = useState<number | null>(null);
  const [receiveCurrencyId, setReceiveCurrencyId] = useState<number | null>(null);
  const [giveAmount, setGiveAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [lastEditedField, setLastEditedField] = useState<"give" | "receive">("give");
  const [countdown, setCountdown] = useState(60);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { data: currencies } = trpc.currencies.list.useQuery();
  const { data: rates } = trpc.rates.listAll.useQuery();
  
  // Declare these BEFORE using them in rateQuery
  const giveCurrency = currencies?.find(c => c.id === giveCurrencyId);
  const receiveCurrency = currencies?.find(c => c.id === receiveCurrencyId);
  
  const rateQuery = trpc.rates.getRate.useQuery(
    {
      from: giveCurrency?.code || "",
      to: receiveCurrency?.code || "",
    },
    { enabled: !!giveCurrency && !!receiveCurrency }
  );

  const rateLoading = rateQuery.isLoading;

  useEffect(() => {
    if (!currencies || currencies.length === 0) return;
    
    // Set default currencies if not set
    if (!giveCurrencyId) {
      const btc = currencies.find(c => c.code === 'BTC');
      if (btc) setGiveCurrencyId(btc.id);
    }
    if (!receiveCurrencyId) {
      const rub = currencies.find(c => c.code === 'RUB');
      if (rub) setReceiveCurrencyId(rub.id);
    }
  }, [currencies]);

  useEffect(() => {
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
    const rate = parseFloat(rateQuery.data.rate || rateQuery.data.ask_price || "0");
    if (rate <= 0) return;
    if (lastEditedField === "give" && giveAmount) {
      const amount = parseFloat(giveAmount);
      if (!isNaN(amount)) {
        setReceiveAmount((amount * rate).toFixed(2));
      }
    } else if (lastEditedField === "receive" && receiveAmount) {
      const amount = parseFloat(receiveAmount);
      if (!isNaN(amount)) {
        setGiveAmount((amount / rate).toFixed(8));
      }
    }
  }, [rateQuery.data]);

  const handleGiveAmountChange = (val: string) => {
    setGiveAmount(val);
    setLastEditedField("give");
    if (rateQuery.data && val) {
      const amount = parseFloat(val);
      const rate = parseFloat(rateQuery.data.rate || rateQuery.data.ask_price || "0");
      if (!isNaN(amount) && rate > 0) {
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
      exchangeRate: rateQuery.data.rate || rateQuery.data.ask_price,
      payoutDetails,
      telegramHandle,
    });
  };

  const allCurrencies = useMemo(() => currencies || [], [currencies]);

  // Get available currencies for "give" (from) field
  const availableGiveCurrencies = useMemo(() => {
    if (!currencies || !rates || rates.length === 0) return currencies || [];
    const currencyIds = new Set<number>();
    
    rates.forEach((rate: any) => {
      if (rate.fromCurrencyId) {
        currencyIds.add(rate.fromCurrencyId);
      }
    });
    
    console.log("Available give currency IDs:", Array.from(currencyIds));
    return currencies.filter(c => currencyIds.has(c.id));
  }, [currencies, rates]);

  // Get available currencies for "receive" (to) field based on selected "give" currency
  const availableReceiveCurrencies = useMemo(() => {
    if (!currencies || !rates || !giveCurrencyId || rates.length === 0) return [];
    
    const currencyIds = new Set<number>();
    rates.forEach((rate: any) => {
      if (rate.fromCurrencyId === giveCurrencyId && rate.toCurrencyId) {
        currencyIds.add(rate.toCurrencyId);
      }
    });
    
    console.log("Available receive currency IDs:", Array.from(currencyIds));
    return currencies.filter(c => currencyIds.has(c.id));
  }, [currencies, rates, giveCurrencyId]);

  if (createOrderMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Создание заявки...</p>
        </div>
      </div>
    );
  }

  const faqItems = [
    {
      question: "Как долго обрабатывается заявка?",
      answer: "Обычно заявки обрабатываются в течение 5-30 минут в рабочее время. Время может варьироваться в зависимости от загруженности сети и типа валюты."
    },
    {
      question: "Какие комиссии вы берёте?",
      answer: "Мы берём минимальную комиссию, которая уже включена в курс обмена. Никаких скрытых платежей. Вы видите точную сумму перед подтверждением заявки."
    },
    {
      question: "Как обеспечивается безопасность?",
      answer: "Мы используем многоуровневую защиту: шифрование данных, двухфакторная аутентификация, холодные кошельки для хранения криптовалют и регулярные аудиты безопасности."
    },
    {
      question: "Какие валюты вы поддерживаете?",
      answer: "Мы поддерживаем основные криптовалюты: Bitcoin, Ethereum, USDT (на разных сетях), Litecoin, Toncoin, Monero и российский рубль."
    },
    {
      question: "Нужно ли верифицироваться?",
      answer: "Для небольших сумм верификация не требуется. Для крупных транзакций может потребоваться базовая верификация для соответствия требованиям законодательства."
    },
    {
      question: "Что делать, если что-то пошло не так?",
      answer: "Свяжитесь с нами через Telegram. Наша служба поддержки работает 24/7 и поможет решить любые проблемы в течение нескольких часов."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="container max-w-4xl">
            <div className="text-center mb-12 animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Быстрый и безопасный <span className="text-primary">обмен криптовалют</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Обменивайте криптовалюту на рубли и обратно по лучшим курсам. Без комиссий, без задержек, без проблем.
              </p>
            </div>

            {/* Exchange Calculator */}
            <Card className="p-6 md:p-8 bg-card border-border/50 shadow-2xl shadow-primary/5 mb-12">
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
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-primary">{receiveAmount || "—"}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            Курс: 1 {giveCurrency?.code} ({giveCurrency?.name}) = {rateQuery.data?.rate || rateQuery.data?.ask_price || "—"} {receiveCurrency?.code}
                          </div>
                          <div className="text-green-400">
                            Комиссия: 0.2%
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Rate update timer */}
              <div className="flex items-center justify-center gap-2 mb-6 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Курс обновится через {countdown}с</span>
              </div>

              {/* Telegram для связи */}
              <div className="space-y-3 mb-6">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Telegram для связи</label>
                <Input
                  type="text"
                  placeholder="@username"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50"
                />
              </div>

              {/* Адрес кошелька для получения */}
              <div className="space-y-3 mb-6">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Адрес кошелька для получения
                </label>
                <Input
                  type="text"
                  placeholder={`Укажите адрес ${receiveCurrency?.name || "кошелька"}`}
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50"
                />
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
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
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Почему выбирают EasyCash?</h2>
              <p className="text-muted-foreground text-lg">Надёжный сервис с лучшими условиями обмена</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Быстро</h3>
                <p className="text-muted-foreground text-sm">
                  Обработка заявок в течение 5-30 минут. Мгновенное обновление курсов каждую минуту.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Безопасно</h3>
                <p className="text-muted-foreground text-sm">
                  Шифрование данных, холодные кошельки, регулярные аудиты безопасности и защита от мошенничества.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Выгодно</h3>
                <p className="text-muted-foreground text-sm">
                  Лучшие курсы на рынке, минимальные комиссии, без скрытых платежей и сборов.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Часто задаваемые вопросы</h2>
              <p className="text-muted-foreground text-lg">Ответы на популярные вопросы о нашем сервисе</p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <Card
                  key={index}
                  className="p-4 md:p-6 border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <h3 className="font-semibold text-base">{item.question}</h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                        expandedFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {expandedFaq === index && (
                    <p className="text-muted-foreground text-sm mt-4 ml-8">{item.answer}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы начать обмен?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Создайте заявку прямо сейчас и получите лучший курс на рынке
            </p>
            <Button size="lg" className="text-base font-semibold">
              Перейти к калькулятору
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-auto">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-3">EasyCash</h4>
              <p className="text-sm text-muted-foreground">
                Быстрый и безопасный обмен криптовалют на рубли
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Контакты</h4>
              <p className="text-sm text-muted-foreground">
                Telegram: @easycash_support<br />
                Email: support@easycash.club
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Информация</h4>
              <p className="text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Правила обмена</a><br />
                <a href="#" className="hover:text-primary transition-colors">Политика конфиденциальности</a>
              </p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 EasyCash. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
