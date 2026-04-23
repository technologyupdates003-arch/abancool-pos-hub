import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Package } from "lucide-react";

const Reports = () => {
  const { business } = useBusiness();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCogs: 0,
    grossProfit: 0,
    margin: 0,
    totalOrders: 0,
    avgOrder: 0,
    topProducts: [] as { name: string; qty: number; revenue: number }[],
    dailyBreakdown: [] as { date: string; revenue: number; cogs: number; profit: number; orders: number }[],
  });

  useEffect(() => {
    if (!business) return;
    const fetchReports = async () => {
      const now = new Date();
      let from: Date;
      if (period === "today") {
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        from = new Date(now);
        from.setDate(from.getDate() - 7);
      } else {
        from = new Date(now);
        from.setMonth(from.getMonth() - 1);
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, created_at, order_items(quantity, unit_price, total_price, product_id, products(name, cost_price))")
        .eq("business_id", business.id)
        .eq("status", "completed")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: false });

      let totalRevenue = 0;
      let totalCogs = 0;
      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      const dayMap: Record<string, { revenue: number; cogs: number; orders: number }> = {};

      orders?.forEach((o) => {
        const dateKey = new Date(o.created_at).toISOString().split("T")[0];
        if (!dayMap[dateKey]) dayMap[dateKey] = { revenue: 0, cogs: 0, orders: 0 };
        dayMap[dateKey].revenue += Number(o.total);
        dayMap[dateKey].orders += 1;
        totalRevenue += Number(o.total);

        (o.order_items as any[])?.forEach((item) => {
          const product = item.products as any;
          const cost = Number(product?.cost_price ?? 0) * item.quantity;
          totalCogs += cost;
          dayMap[dateKey].cogs += cost;

          const name = product?.name ?? "Unknown";
          if (!productMap[item.product_id]) productMap[item.product_id] = { name, qty: 0, revenue: 0 };
          productMap[item.product_id].qty += item.quantity;
          productMap[item.product_id].revenue += Number(item.total_price);
        });
      });

      const totalOrders = orders?.length ?? 0;
      const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const grossProfit = totalRevenue - totalCogs;
      const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      const dailyBreakdown = Object.entries(dayMap)
        .map(([date, v]) => ({ date, revenue: v.revenue, cogs: v.cogs, profit: v.revenue - v.cogs, orders: v.orders }))
        .sort((a, b) => b.date.localeCompare(a.date));

      setStats({ totalRevenue, totalCogs, grossProfit, margin, totalOrders, avgOrder, topProducts, dailyBreakdown });
    };
    fetchReports();
  }, [business, period]);

  return (
    <DashboardLayout>
      <SubscriptionGate feature="Reports">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Reports & P&amp;L</h1>
            <p className="text-muted-foreground font-body text-sm">Profit and loss, sales trends, and top sellers</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["today", "week", "month"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-body capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* P&L summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-body">Revenue</p>
              <DollarSign size={14} className="text-primary" />
            </div>
            <p className="text-2xl font-heading font-bold">KES {stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-body">Cost of Goods</p>
              <TrendingDown size={14} className="text-red-400" />
            </div>
            <p className="text-2xl font-heading font-bold text-red-400">KES {stats.totalCogs.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl border p-5 ${stats.grossProfit >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-body">Gross Profit</p>
              <TrendingUp size={14} className={stats.grossProfit >= 0 ? "text-green-400" : "text-red-400"} />
            </div>
            <p className={`text-2xl font-heading font-bold ${stats.grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              KES {stats.grossProfit.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats.margin.toFixed(1)}% margin</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-body">Orders</p>
              <Receipt size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-heading font-bold">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg KES {Math.round(stats.avgOrder).toLocaleString()}</p>
          </div>
        </div>

        {/* Daily P&L breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold">Daily Profit & Loss</h2>
          </div>
          {stats.dailyBreakdown.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-body text-sm">No sales in this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-heading font-semibold">Date</th>
                    <th className="text-right px-4 py-3 font-heading font-semibold">Orders</th>
                    <th className="text-right px-4 py-3 font-heading font-semibold">Revenue</th>
                    <th className="text-right px-4 py-3 font-heading font-semibold">COGS</th>
                    <th className="text-right px-4 py-3 font-heading font-semibold">Profit</th>
                    <th className="text-right px-4 py-3 font-heading font-semibold">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.dailyBreakdown.map((d) => {
                    const margin = d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0;
                    return (
                      <tr key={d.date} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-body">{new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{d.orders}</td>
                        <td className="px-4 py-3 text-right font-medium">KES {d.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">KES {d.cogs.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-heading font-bold ${d.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          KES {d.profit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top sellers */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold flex items-center gap-2"><Package size={16} /> Top Selling Products</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-body text-sm">No data for this period</div>
          ) : (
            <div className="divide-y divide-border">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-heading font-bold">{i + 1}</span>
                    <div>
                      <p className="font-body text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.qty} units sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-heading font-semibold">KES {p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
};

export default Reports;
