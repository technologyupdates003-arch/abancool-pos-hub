import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(239 84% 67%)", "hsl(260 70% 55%)", "hsl(170 70% 50%)", "hsl(40 90% 60%)"];

const AdminAnalytics = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);
  const [dailyTx, setDailyTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: orders }, { data: businesses }] = await Promise.all([
        supabase.from("orders").select("total, business_id, created_at, status").eq("status", "completed"),
        supabase.from("businesses").select("id, name, type"),
      ]);

      // Revenue trend (last 30 days)
      const revByDay: any[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
        const rev = orders?.filter((o) => o.created_at.startsWith(dayStr)).reduce((s, o) => s + Number(o.total), 0) ?? 0;
        const tx = orders?.filter((o) => o.created_at.startsWith(dayStr)).length ?? 0;
        revByDay.push({ name: label, revenue: rev, transactions: tx });
      }
      setRevenueData(revByDay);
      setDailyTx(revByDay);

      // POS type distribution
      const typeCounts: Record<string, number> = {};
      businesses?.forEach((b) => { typeCounts[b.type] = (typeCounts[b.type] ?? 0) + 1; });
      setTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

      // Top earning businesses
      const bizRevenue: Record<string, number> = {};
      orders?.forEach((o) => { bizRevenue[o.business_id] = (bizRevenue[o.business_id] ?? 0) + Number(o.total); });
      const sorted = Object.entries(bizRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, revenue]) => ({
          name: businesses?.find((b) => b.id === id)?.name ?? "Unknown",
          revenue,
        }));
      setTopBusinesses(sorted);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground font-body text-sm">Deep insights across all businesses</p>
        </div>

        {/* Revenue trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Revenue Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 16%)" />
              <XAxis dataKey="name" stroke="hsl(240 8% 55%)" fontSize={11} interval={4} />
              <YAxis stroke="hsl(240 8% 55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(239 84% 67%)" fill="hsl(239 84% 67% / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* POS type distribution */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4">POS Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={12}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily transactions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4">Daily Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyTx.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 16%)" />
                <XAxis dataKey="name" stroke="hsl(240 8% 55%)" fontSize={11} />
                <YAxis stroke="hsl(240 8% 55%)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(240 18% 7%)", border: "1px solid hsl(240 12% 16%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="transactions" fill="hsl(170 70% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top businesses */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Top Earning Businesses</h3>
          {topBusinesses.length === 0 ? (
            <p className="text-muted-foreground text-sm font-body text-center py-8">No completed orders yet</p>
          ) : (
            <div className="space-y-3">
              {topBusinesses.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-body w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-body">{b.name}</span>
                      <span className="text-sm font-heading font-bold">KES {b.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full hero-gradient-bg rounded-full" style={{ width: `${(b.revenue / topBusinesses[0].revenue) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
