import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, Package, ShoppingCart, CreditCard, Ban, CheckCircle, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminBusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [biz, setBiz] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: bizData }, { data: members }, { count: prodCount }, { data: orders }] = await Promise.all([
        supabase.from("businesses").select("*").eq("id", id).single(),
        supabase.from("business_members").select("*, profiles:user_id(full_name)").eq("business_id", id),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("business_id", id),
        supabase.from("orders").select("total, status").eq("business_id", id),
      ]);

      setBiz(bizData);
      setStaff(members ?? []);
      const completedOrders = orders?.filter((o) => o.status === "completed") ?? [];
      setStats({
        products: prodCount ?? 0,
        orders: orders?.length ?? 0,
        revenue: completedOrders.reduce((s, o) => s + Number(o.total), 0),
      });
      setLoading(false);
    };
    load();
  }, [id]);

  const toggleBusiness = async () => {
    if (!biz) return;
    await supabase.from("businesses").update({ is_active: !biz.is_active }).eq("id", biz.id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: biz.is_active ? "business_suspended" : "business_activated",
      entity_type: "business", entity_id: biz.id,
    });
    setBiz({ ...biz, is_active: !biz.is_active });
    toast({ title: biz.is_active ? "Suspended" : "Activated" });
  };

  const changePlan = async (plan: string) => {
    if (!biz) return;
    await supabase.from("businesses").update({ subscription_plan: plan }).eq("id", biz.id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: "plan_changed", entity_type: "business", entity_id: biz.id,
      details: { from: biz.subscription_plan, to: plan },
    });
    setBiz({ ...biz, subscription_plan: plan });
    toast({ title: `Plan changed to ${plan}` });
  };

  const extendTrial = async (days: number) => {
    if (!biz) return;
    const newDate = new Date(biz.trial_ends_at ?? new Date());
    newDate.setDate(newDate.getDate() + days);
    await supabase.from("businesses").update({
      trial_ends_at: newDate.toISOString(), subscription_status: "trial",
    }).eq("id", biz.id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: "trial_extended", entity_type: "business", entity_id: biz.id,
      details: { days },
    });
    setBiz({ ...biz, trial_ends_at: newDate.toISOString(), subscription_status: "trial" });
    toast({ title: `Trial extended by ${days} days` });
  };

  const impersonate = () => {
    if (!biz) return;
    sessionStorage.setItem("admin_impersonate_business_id", biz.id);
    supabase.from("audit_logs").insert({
      user_id: user?.id, action: "business_impersonation", entity_type: "business", entity_id: biz.id,
    });
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!biz) {
    return <AdminLayout><p className="text-muted-foreground font-body py-20 text-center">Business not found</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/businesses")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{biz.name}</h1>
            <p className="text-muted-foreground font-body text-sm capitalize">{biz.type} • {biz.subscription_plan} plan</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Products", value: stats.products, icon: Package, color: "text-primary" },
            { label: "Total Orders", value: stats.orders, icon: ShoppingCart, color: "text-blue-400" },
            { label: "Revenue", value: `KES ${stats.revenue.toLocaleString()}`, icon: CreditCard, color: "text-green-400" },
            { label: "Staff", value: staff.length, icon: Users, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.color} />
                <span className="text-xs text-muted-foreground font-body">{s.label}</span>
              </div>
              <p className="text-xl font-heading font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Business details */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-heading font-semibold">Business Details</h3>
            <div className="space-y-3 text-sm font-body">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{biz.email ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{biz.phone ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{biz.address ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={biz.is_active ? "text-green-400" : "text-destructive"}>{biz.is_active ? "Active" : "Suspended"}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subscription</span>
                <span className="capitalize">{biz.subscription_status}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span>
                <span>{biz.trial_ends_at ? new Date(biz.trial_ends_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span>
                <span>{new Date(biz.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-heading font-semibold">Admin Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start gap-2" variant={biz.is_active ? "destructive" : "default"} onClick={toggleBusiness}>
                {biz.is_active ? <><Ban size={16} /> Suspend Business</> : <><CheckCircle size={16} /> Activate Business</>}
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" onClick={impersonate}>
                <LogIn size={16} /> Login as Business
              </Button>
              <div>
                <p className="text-sm font-body text-muted-foreground mb-2">Change Plan</p>
                <div className="flex gap-2">
                  {["starter", "pro", "enterprise"].map((p) => (
                    <Button key={p} size="sm" variant={biz.subscription_plan === p ? "default" : "outline"}
                      onClick={() => changePlan(p)} className="capitalize flex-1">{p}</Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-body text-muted-foreground mb-2">Extend Trial</p>
                <div className="flex gap-2">
                  {[7, 14, 30].map((d) => (
                    <Button key={d} size="sm" variant="outline" onClick={() => extendTrial(d)} className="flex-1">+{d} days</Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-semibold">Staff Members</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-body">{(s as any).profiles?.full_name ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-body capitalize">{s.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No staff members</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBusinessDetail;
