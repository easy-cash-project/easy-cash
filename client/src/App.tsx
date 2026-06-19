import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Acquiring from "./pages/Acquiring";
import OrderStatus from "./pages/OrderStatus";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminLogin from "./pages/AdminLogin";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminRates from "./pages/admin/AdminRates";
import AdminAddresses from "./pages/admin/AdminAddresses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCurrencies from "./pages/AdminCurrencies";
import AdminRubCommissions from "./pages/admin/AdminRubCommissions";
import AdminTelegram from "./pages/admin/AdminTelegram";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/acquiring"} component={Acquiring} />
      <Route path={"/order/:orderId"} component={OrderConfirmation} />
      <Route path={"/status"} component={OrderStatus} />
      <Route path={"/status/:orderId"} component={OrderStatus} />
      <Route path={"/moneymaker777/login"} component={AdminLogin} />
      <Route path={"/moneymaker777"} component={AdminOrders} />
      <Route path={"/moneymaker777/orders"} component={AdminOrders} />
      <Route path={"/moneymaker777/rates"} component={AdminRates} />
      <Route path={"/moneymaker777/rub-commissions"} component={AdminRubCommissions} />
      <Route path={"/moneymaker777/addresses"} component={AdminAddresses} />
      <Route path={"/moneymaker777/currencies"} component={AdminCurrencies} />
      <Route path={"/moneymaker777/users"} component={AdminUsers} />
      <Route path={"/moneymaker777/telegram"} component={AdminTelegram} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
