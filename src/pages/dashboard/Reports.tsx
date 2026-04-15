import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";

const Reports = () => {
  const { business } = useBusiness();
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0, topProducts: [] as any[] });
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  useEffect(() => {
    if (!business) return;
    const fetchReports = async () => {
      const now = new Date();
      let from: string;
      if (period === "today") from = now.toISOString().split("T")[0];
      else if (period === "week") { now.setDate(now.getDate() - 7); from = now.toISOString(); }
      else { now.setMonth(now.getMonth() - 1); from = now.toISOString(); }

      const { data: orders } = await supabase
        .from("orders").select("total, order_items(quantity, product_id, products(name))")
        .eq("business_id", business.id).eq("status", "completed").gte("created_at", from);

      const totalRevenue = orders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const totalOrders = orders?.length ?? 0;
      const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top products
      const productMap: Record<string, { name: string; qty: number }> = {};
      orders?.forEach((o) => {
        (o.order_items as any[])?.forEach((item) => {
          const name = (item.products as any)?.name ?? "Unknown";
          if (!productMap[item.product_id]) productMap[item.product_id] = { name, qty: 0 };
          productMap[item.product_id].qty += item.quantity;
        });
      });
      const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

      setStats({ totalRevenue, totalOrders, avgOrder, topProducts });
    };
    fetchReports();
  }, [business, period]);

  return (
    <DashboardLayout>
      <SubscriptionGate feature="Reports">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["today", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-body capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-body mb-1">Total Revenue</p>
          <p className="text-2xl font-heading font-bold">KES {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-body mb-1">Total Orders</p>
          <p className="text-2xl font-heading font-bold">{stats.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-body mb-1">Avg Order Value</p>
          <p className="text-2xl font-heading font-bold">KES {Math.round(stats.avgOrder).toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">Top Products</h2>
        </div>
        {stats.topProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-body text-sm">No data for this period</div>
        ) : (
          <div className="divide-y divide-border">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-heading font-bold">{i + 1}</span>
                  <span className="font-body text-sm">{p.name}</span>
                </div>
                <span className="text-sm font-heading font-semibold">{p.qty} sold</span>
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
