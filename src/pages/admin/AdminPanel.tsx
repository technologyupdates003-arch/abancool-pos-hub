import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Users, BarChart3, LogOut, Settings } from "lucide-react";

const AdminPanel = () => {
  const { isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBusinesses: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    if (!isAdmin) { navigate("/dashboard"); return; }

    const fetch = async () => {
      const { data: biz } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      setBusinesses(biz ?? []);

      const { count: bizCount } = await supabase.from("businesses").select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { data: orders } = await supabase.from("orders").select("total").eq("status", "completed");
      const rev = orders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

      setStats({ totalBusinesses: bizCount ?? 0, totalUsers: userCount ?? 0, totalOrders: orders?.length ?? 0, totalRevenue: rev });
    };
    fetch();
  }, [isAdmin]);

  const toggleBusiness = async (id: string, active: boolean) => {
    await supabase.from("businesses").update({ is_active: !active }).eq("id", id);
    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !active } : b));
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg hero-gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">A</span>
            </div>
            <span className="font-heading font-bold text-sm">Super Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body bg-primary/10 text-primary font-medium">
            <LayoutDashboard size={18} /> Overview
          </div>
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted">
            <Settings size={18} /> My Dashboard
          </Link>
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 py-1 text-xs text-muted-foreground font-body">{profile?.full_name}</p>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <h1 className="font-heading text-2xl font-bold mb-6">System Overview</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><Building2 size={16} className="text-primary" /><span className="text-xs text-muted-foreground font-body">Businesses</span></div>
            <p className="text-2xl font-heading font-bold">{stats.totalBusinesses}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-blue-400" /><span className="text-xs text-muted-foreground font-body">Users</span></div>
            <p className="text-2xl font-heading font-bold">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-green-400" /><span className="text-xs text-muted-foreground font-body">Orders</span></div>
            <p className="text-2xl font-heading font-bold">{stats.totalOrders}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-amber-400" /><span className="text-xs text-muted-foreground font-body">Revenue</span></div>
            <p className="text-2xl font-heading font-bold">KES {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold">All Businesses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-body font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize">{b.type}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize">{b.subscription_plan}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${b.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {b.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleBusiness(b.id, b.is_active)}>
                        {b.is_active ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
