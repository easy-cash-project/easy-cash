export type OrderStatus = "pending" | "payment_received" | "processing" | "completed" | "cancelled";

export interface CurrencyInfo {
  id: number;
  code: string;
  name: string;
  type: "crypto" | "fiat";
  network: string | null;
  symbol: string | null;
  icon: string | null;
  category: string | null;
}

export interface RateInfo {
  id: number;
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: string;
  markupPercent: string;
  minAmount: string | null;
  maxAmount: string | null;
}

export interface OrderInfo {
  orderId: string;
  giveCurrencyId: number;
  giveAmount: string;
  receiveCurrencyId: number;
  receiveAmount: string;
  exchangeRate: string;
  payoutDetails: string;
  depositAddress: string;
  telegramHandle: string;
  status: OrderStatus;
  createdAt: Date;
}
