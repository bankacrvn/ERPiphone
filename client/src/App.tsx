import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

import Welcome from "./pages/Welcome";
import POS from "./pages/POS";
import ERPDashboard from "./pages/erp/Dashboard";
import Inventory from "./pages/erp/Inventory";
import HRM from "./pages/erp/HRM";
import Accounting from "./pages/erp/Accounting";
import Reports from "./pages/erp/Reports";
import AuditLog from "./pages/erp/AuditLog";
import Settings from "./pages/erp/Settings";
import CMS from "./pages/erp/CMS";
import Cashier from "./pages/Cashier";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Welcome} />
      <Route path={"/welcome"} component={Welcome} />
      <Route path={"/pos"} component={POS} />
      <Route path={"/cashier"} component={Cashier} />
      <Route path={"/erp"} component={ERPDashboard} />
      <Route path="/erp/inventory" component={Inventory} />
      <Route path="/erp/hrm" component={HRM} />
      <Route path="/erp/accounting" component={Accounting} />
      <Route path="/erp/reports" component={Reports} />
      <Route path="/erp/audit" component={AuditLog} />
      <Route path="/erp/cms" component={CMS} />
      <Route path="/erp/settings" component={Settings} />

      <Route path={"/home"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        storageKey="restaurant-theme"        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
