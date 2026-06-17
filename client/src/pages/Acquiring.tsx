import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Clock,
  Code2,
  UserCheck,
  Cog,
  Rocket,
  Send,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Globe,
  Layers,
} from "lucide-react";

export default function Acquiring() {
  const [telegram, setTelegram] = useState("");

  const handleSubmit = () => {
    if (!telegram.trim()) {
      toast.error("Укажите ваш Telegram для связи");
      return;
    }
    toast.success("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
    setTelegram("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-5xl">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                P2P Эквайринг
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                P2P платежная система<br />
                <span className="text-primary">высокой конверсии</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Стабильность и масштабируемость для устойчивого роста вашего бизнеса.
                Принимайте платежи без посредников с конверсией свыше 95%.
              </p>

              {/* CTA Form */}
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Send className="w-4 h-4" />
                  </span>
                  <Input
                    placeholder="@ваш_telegram"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="pl-10 h-12 bg-secondary/50 border-border/50"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto active:scale-[0.97] transition-all"
                >
                  Начать сейчас
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-5xl">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl font-bold mb-4">
                Easy<span className="text-primary">Cash</span> = P2P Эквайринг
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Моментальное подтверждение платежей и высокая конверсия для вашего бизнеса
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
              <Card className="p-6 bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Моментальные платежи</h3>
                <p className="text-sm text-muted-foreground">
                  P2P эквайринг подтверждает платежи на приём мгновенно. Среднее время — 1-2 минуты.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Без Hold & Chargeback</h3>
                <p className="text-sm text-muted-foreground">
                  P2P-решение полностью исключает холды, роллинги и чарджбэки. Ваши средства в безопасности.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Конверсия 95%+</h3>
                <p className="text-sm text-muted-foreground">
                  Высокая конверсия из заявки в оплату благодаря популярному направлению P2P.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Возможности</h2>
              <p className="text-muted-foreground">Всё что нужно для приёма платежей в вашем проекте</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <Clock className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Моментальный вывод</h4>
                <p className="text-xs text-muted-foreground">Вывод в USDT, фиате или любой криптовалюте на кошельки или банковские карты</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <Code2 className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Простое API</h4>
                <p className="text-xs text-muted-foreground">Гибкая API библиотека с продуманной документацией. Интеграция за 2 дня.</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <UserCheck className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Без верификации</h4>
                <p className="text-xs text-muted-foreground">Не запрашиваем документов. Сервис доступен каждому, работаем со всеми категориями бизнеса.</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <Cog className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Автоматизация</h4>
                <p className="text-xs text-muted-foreground">Грамотное распределение платежей гарантирует стабильную работу при большом потоке заявок.</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <Rocket className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Высокая скорость</h4>
                <p className="text-xs text-muted-foreground">Автоматическое подтверждение платежей увеличивает скорость обработки транзакций.</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/20 transition-all duration-300">
                <Layers className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1.5 text-sm">Без посредников</h4>
                <p className="text-xs text-muted-foreground">Собственная разработка — выгодные условия, качественная техническая часть и моментальная поддержка.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Commission */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Комиссия</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card className="p-8 bg-card border-border/50 text-center">
                <div className="text-4xl font-bold text-primary mb-2">6-9%</div>
                <h3 className="font-semibold text-lg mb-2">Приём платежей</h3>
                <p className="text-sm text-muted-foreground mb-4">Комиссия за приём платежей от ваших клиентов</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Мин. сумма: <span className="text-foreground font-medium">100 ₽</span></p>
                  <p>Макс. сумма: <span className="text-foreground font-medium">300 000 ₽</span></p>
                </div>
              </Card>

              <Card className="p-8 bg-card border-border/50 text-center">
                <div className="text-4xl font-bold text-primary mb-2">0-3%</div>
                <h3 className="font-semibold text-lg mb-2">Вывод баланса</h3>
                <p className="text-sm text-muted-foreground mb-4">В зависимости от выбранного способа вывода</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Мин. сумма: <span className="text-foreground font-medium">500 ₽</span></p>
                  <p>Макс. сумма: <span className="text-foreground font-medium">1 000 000 ₽</span></p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Capabilities Table */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Условия работы</h2>
            </div>

            <Card className="overflow-hidden border-border/50">
              <div className="divide-y divide-border/30">
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Валюта
                  </span>
                  <span className="text-sm font-medium">Российский рубль</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" /> GEO
                  </span>
                  <span className="text-sm font-medium">Россия, СНГ</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Метод обработки
                  </span>
                  <span className="text-sm font-medium">P2P, SBP</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Карты
                  </span>
                  <span className="text-sm font-medium">Visa, MasterCard, МИР</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Settlement
                  </span>
                  <span className="text-sm font-medium">RUB, USDT</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Settlement period
                  </span>
                  <span className="text-sm font-medium text-primary">T+0</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground">Rolling Reserve</span>
                  <span className="text-sm font-medium text-primary">Нет</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground">Charge Back</span>
                  <span className="text-sm font-medium text-primary">Нет</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground">Тип трафика</span>
                  <span className="text-sm font-medium">Любой</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Интеграция
                  </span>
                  <span className="text-sm font-medium">API</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 4 Steps */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">4 шага для подключения</h2>
              <p className="text-muted-foreground">Начните принимать платежи с EasyCash</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: 1, title: "Заявка", desc: "Вы делаете запрос на подключение через Telegram" },
                { step: 2, title: "Обсуждение", desc: "Наши специалисты проверяют ресурсы и обсуждают детали" },
                { step: 3, title: "Интеграция", desc: "Помогаем подключиться к процессингу через API" },
                { step: 4, title: "Запуск", desc: "Начинаем принимать и выплачивать платежи" },
              ].map((item) => (
                <div key={item.step} className="relative p-5 rounded-xl bg-secondary/30 border border-border/30 text-center group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold">{item.step}</span>
                  </div>
                  <h4 className="font-semibold mb-1.5">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  {item.step < 4 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Гарантии</h2>
              <p className="text-muted-foreground">Мы уверены в своём продукте</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border-border/50 text-center hover:border-primary/30 transition-all duration-300">
                <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Гибкость</h3>
                <p className="text-sm text-muted-foreground">Внесение необходимых доработок и правок для вашего комфорта</p>
              </Card>

              <Card className="p-6 bg-card border-border/50 text-center hover:border-primary/30 transition-all duration-300">
                <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Безопасность</h3>
                <p className="text-sm text-muted-foreground">Безопасность транзакций и быстрая обработка платежей</p>
              </Card>

              <Card className="p-6 bg-card border-border/50 text-center hover:border-primary/30 transition-all duration-300">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Поддержка 24/7</h3>
                <p className="text-sm text-muted-foreground">Решение проблемной заявки — не более 15 минут</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Who We Work With */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">С кем работаем</h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Криптобиржи и обменники",
                "Онлайн-магазины",
                "Ставки на спорт",
                "Гемблинг",
                "Знакомства",
                "Инвестиционные проекты",
                "Кошельки",
                "SaaS-сервисы",
              ].map((item) => (
                <div
                  key={item}
                  className="px-4 py-2.5 rounded-full bg-secondary/50 border border-border/30 text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Готовы начать?</h2>
            <p className="text-muted-foreground mb-6">
              Оставьте контакт для связи и мы свяжемся с вами в ближайшее время
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Send className="w-4 h-4" />
                </span>
                <Input
                  placeholder="@ваш_telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50 border-border/50"
                />
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto active:scale-[0.97] transition-all"
              >
                Связаться
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} EasyCash. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
