import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, ShoppingCart, Package, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DashboardHome = () => {
  const { business, isSubscribed, loading: bizLoading } = useBusiness();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, todayOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!business || !isSubscribed) return;
    const fetchStats = async () => {
      const { count: orderCount } = await supabase
        .from("orders").select("*", { count: "exact", head: true })
        .eq("business_id", business.id);

      const { data: revenue } = await supabase
        .from("orders").select("total")
        .eq("business_id", business.id).eq("status", "completed");

      const { count: productCount } = await supabase
        .from("products").select("*", { count: "exact", head: true })
        .eq("business_id", business.id);

      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("orders").select("*", { count: "exact", head: true })
        .eq("business_id", business.id).gte("created_at", today);

      const totalRevenue = revenue?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      setStats({ orders: orderCount ?? 0, revenue: totalRevenue, products: productCount ?? 0, todayOrders: todayCount ?? 0 });

      const { data: recent } = await supabase
        .from("orders").select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }).limit(5);
      setRecentOrders(recent ?? []);
    };
    fetchStats();
  }, [business, isSubscribed]);

  if (bizLoading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!business) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h2 className="font-heading text-2xl font-bold mb-2">No Business Found</h2>
        <p className="text-muted-foreground font-body">Create a business to get started.</p>
      </div>
    </DashboardLayout>
  );

  // Show subscription prompt if not subscribed
  if (!isSubscribed) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">Activate Your Business</h2>
        <p className="text-muted-foreground font-body text-sm max-w-md mb-6">
          Welcome to Abancool! Subscribe to a plan to start using your POS system. Every business needs an active subscription.
        </p>
        <Button variant="hero" onClick={() => navigate("/dashboard/subscribe")} className="gap-2">
          <ShoppingCart size={16} /> Choose a Plan
        </Button>
      </div>
    </DashboardLayout>
  );

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: "text-primary" },
    { label: "Total Revenue", value: `KES ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Orders", value: stats.orders, icon: TrendingUp, color: "text-blue-400" },
    { label: "Products", value: stats.products, icon: Package, color: "text-amber-400" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}!</h1>
        <p className="text-muted-foreground font-body text-sm">{business.name} • {business.type} POS</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-body">{s.label}</span>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-body text-sm">
            No orders yet. Start selling from the POS!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-heading font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-heading font-semibold">KES {Number(order.total).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                    order.status === "completed" ? "bg-green-500/10 text-green-400" :
                    order.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
