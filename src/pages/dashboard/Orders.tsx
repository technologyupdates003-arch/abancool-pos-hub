import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";

const Orders = () => {
  const { business } = useBusiness();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!business) return;
    supabase.from("orders").select("*").eq("business_id", business.id)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setOrders(data ?? []));
  }, [business]);

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6">Orders</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-heading font-semibold">Order #</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Payment</th>
                <th className="text-right px-4 py-3 font-heading font-semibold">Total</th>
                <th className="text-right px-4 py-3 font-heading font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-body">No orders yet</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-heading font-medium">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                      o.status === "completed" ? "bg-green-500/10 text-green-400" :
                      o.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                      o.status === "preparing" ? "bg-blue-500/10 text-blue-400" :
                      "bg-primary/10 text-primary"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-body capitalize">{o.payment_method}</td>
                  <td className="px-4 py-3 text-right font-heading font-medium">KES {Number(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-body text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
