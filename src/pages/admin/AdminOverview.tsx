import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Building2, Users, CreditCard, BarChart3, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  totalTransactions: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalBusinesses: 0, activeBusinesses: 0, suspendedBusinesses: 0,
    totalUsers: 0, activeSubscriptions: 0, monthlyRevenue: 0,
    lifetimeRevenue: 0, totalTransactions: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [signupData, setSignupData] = useState<any[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch all stats in parallel
      const [
        { count: bizCount },
        { count: activeCount },
        { count: suspCount },
        { count: userCount },
        { count: activeSubCount },
        { data: allOrders },
        { data: recentBiz },
      ] = await Promise.all([
        supabase.from("businesses").select("*", { count: "exact", head: true }),
        supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("businesses").select("*", { count: "exact", head: true }).in("subscription_status", ["active", "trial"]),
        supabase.from("orders").select("total, created_at, status").eq("status", "completed"),
        supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyRev = allOrders?.filter((o) => o.created_at >= monthStart).reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const lifetimeRev = allOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

      setStats({
        totalBusinesses: bizCount ?? 0,
        activeBusinesses: activeCount ?? 0,
        suspendedBusinesses: suspCount ?? 0,
        totalUsers: userCount ?? 0,
        activeSubscriptions: activeSubCount ?? 0,
        monthlyRevenue: monthlyRev,
        lifetimeRevenue: lifetimeRev,
        totalTransactions: allOrders?.length ?? 0,
      });

      setRecentBusinesses(recentBiz ?? []);

      // Build revenue chart data (last 7 days)
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
        const dayRev = allOrders?.filter((o) => o.created_at.startsWith(dayStr)).reduce((s, o) => s + Number(o.total), 0) ?? 0;
        const dayTx = allOrders?.filter((o) => o.created_at.startsWith(dayStr)).length ?? 0;
        days.push({ name: dayLabel, revenue: dayRev, transactions: dayTx });
      }
      setRevenueData(days);

      // Signups per day (from businesses created_at)
      const { data: allBiz } = await supabase.from("businesses").select("created_at");
      const signups = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
        const count = allBiz?.filter((b) => b.created_at.startsWith(dayStr)).length ?? 0;
        signups.push({ name: dayLabel, signups: count });
      }
      setSignupData(signups);

      setLoading(false);
    };
    load();
  }, []);

  const kpis = [
    { label: "Total Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-primary" },
    { label: "Active Businesses", value: stats.activeBusinesses, icon: TrendingUp, color: "text-green-400" },
    { label: "Suspended", value: stats.suspendedBusinesses, icon: TrendingDown, color: "text-destructive" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-purple-400" },
    { label: "Monthly Revenue", value: `KES ${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
    { label: "Lifetime Revenue", value: `KES ${stats.lifetimeRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
    { label: "Total Transactions", value: stats.totalTransactions, icon: Activity, color: "text-cyan-400" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">System Overview</h1>
          <p className="text-muted-foreground font-body text-sm">Real-time platform metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={16} className={kpi.color} />
                <span className="text-xs text-muted-foreground font-body">{kpi.label}</span>
              </div>
              <p className="text-xl font-heading font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 16%)" />
                <XAxis dataKey="name" stroke="hsl(240 8% 55%)" fontSize={12} />
                <YAxis stroke="hsl(240 8% 55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(239 84% 67%)" fill="hsl(239 84% 67% / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4">New Signups (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={signupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 16%)" />
                <XAxis dataKey="name" stroke="hsl(240 8% 55%)" fontSize={12} />
                <YAxis stroke="hsl(240 8% 55%)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="signups" fill="hsl(260 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction volume */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Transaction Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 16%)" />
              <XAxis dataKey="name" stroke="hsl(240 8% 55%)" fontSize={12} />
              <YAxis stroke="hsl(240 8% 55%)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="transactions" fill="hsl(170 70% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent businesses */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-semibold">Recent Businesses</h3>
            <a href="/admin/businesses" className="text-xs text-primary font-body hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-body font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize">{b.type}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize">{b.subscription_plan}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${b.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {b.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-body text-xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
