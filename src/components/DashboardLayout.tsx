import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, LogOut, Store, ChevronDown, Monitor, CreditCard, Truck, Boxes } from "lucide-react";
import { ReactNode, useState } from "react";

const ALL_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "POS", icon: Monitor, to: "/dashboard/pos" },
  { label: "Products", icon: Package, to: "/dashboard/products" },
  { label: "Stock", icon: Boxes, to: "/dashboard/stock" },
  { label: "Suppliers", icon: Truck, to: "/dashboard/suppliers" },
  { label: "Orders", icon: ShoppingCart, to: "/dashboard/orders" },
  { label: "Staff", icon: Users, to: "/dashboard/staff" },
  { label: "Reports", icon: BarChart3, to: "/dashboard/reports" },
  { label: "Subscription", icon: CreditCard, to: "/dashboard/subscribe" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

// Cashiers see only the POS terminal
const CASHIER_NAV_ITEMS = ALL_NAV_ITEMS.filter((i) => i.to === "/dashboard/pos");

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, isAdmin } = useAuth();
  const { business, businesses, selectBusiness, memberRole } = useBusiness();
  const location = useLocation();
  const navigate = useNavigate();
  const [bizOpen, setBizOpen] = useState(false);

  const isCashier = memberRole === "cashier";
  const navItems = isCashier ? CASHIER_NAV_ITEMS : ALL_NAV_ITEMS;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg hero-gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">A</span>
            </div>
            <span className="font-heading font-bold text-sm">Abancool</span>
          </Link>

          {/* Business selector */}
          {business && (
            <div className="relative">
              <button
                onClick={() => setBizOpen(!bizOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-body"
              >
                <div className="flex items-center gap-2 truncate">
                  <Store size={14} className="text-primary shrink-0" />
                  <span className="truncate">{business.name}</span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {bizOpen && businesses.length > 1 && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { selectBusiness(b.id); setBizOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm font-body hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition-colors ${
                location.pathname === item.to
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition-colors ${
                location.pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Settings size={18} />
              Super Admin
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-heading font-bold text-primary">
                {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="truncate">
              <p className="text-sm font-heading font-medium truncate">{profile?.full_name ?? "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{business?.type ?? ""}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg hero-gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">A</span>
            </div>
            <span className="font-heading font-bold text-sm">{business?.name ?? "Abancool"}</span>
          </div>
          <button onClick={handleSignOut} className="text-muted-foreground">
            <LogOut size={18} />
          </button>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto border-b border-border px-2 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-body shrink-0 ${
                location.pathname === item.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
