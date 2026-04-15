import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Building2, Users, CreditCard, BarChart3,
  Settings, LogOut, Shield, Bell, Activity, FileText, ChevronDown,
  Menu, X
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const adminNav = [
  { label: "Overview", icon: LayoutDashboard, to: "/admin" },
  { label: "Businesses", icon: Building2, to: "/admin/businesses" },
  { label: "Users", icon: Users, to: "/admin/users" },
  { label: "Subscriptions", icon: CreditCard, to: "/admin/subscriptions" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
  { label: "Audit Logs", icon: FileText, to: "/admin/audit-logs" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();

    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, () => {
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg hero-gradient-bg flex items-center justify-center">
              <Shield size={14} className="text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-sm">Super Admin</span>
          </Link>
          <p className="text-xs text-muted-foreground font-body pl-9">Abancool Technology</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition-colors ${
                (item.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.to))
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-border">
            <Link
              to="/admin/notifications"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition-colors ${
                location.pathname === "/admin/notifications"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Bell size={18} />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">{unreadCount}</Badge>
              )}
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Activity size={18} />
              My Dashboard
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full hero-gradient-bg flex items-center justify-center">
              <span className="text-xs font-heading font-bold text-primary-foreground">
                {profile?.full_name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="truncate">
              <p className="text-sm font-heading font-medium truncate">{profile?.full_name ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Shield size={16} className="text-primary" />
          <span className="font-heading font-bold text-sm">Admin</span>
        </div>
        <button onClick={handleSignOut} className="text-muted-foreground"><LogOut size={18} /></button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-card h-full border-r border-border pt-16 p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {adminNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body ${
                  location.pathname === item.to ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
