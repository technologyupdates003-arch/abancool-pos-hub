import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", price_monthly: 0, price_yearly: 0, features: "", max_products: "", max_staff: "" });

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("subscription_plans").select("*").order("price_monthly"),
        supabase.from("businesses").select("id, name, subscription_plan, subscription_status, trial_ends_at, is_active"),
      ]);
      setPlans(p ?? []);
      setBusinesses(b ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const openEdit = (plan?: any) => {
    if (plan) {
      setEditPlan(plan);
      setForm({
        name: plan.name, slug: plan.slug,
        price_monthly: plan.price_monthly, price_yearly: plan.price_yearly,
        features: (plan.features ?? []).join("\n"),
        max_products: plan.max_products?.toString() ?? "", max_staff: plan.max_staff?.toString() ?? "",
      });
    } else {
      setEditPlan({});
      setForm({ name: "", slug: "", price_monthly: 0, price_yearly: 0, features: "", max_products: "", max_staff: "" });
    }
  };

  const savePlan = async () => {
    const features = form.features.split("\n").filter(Boolean);
    const data = {
      name: form.name, slug: form.slug,
      price_monthly: Number(form.price_monthly), price_yearly: Number(form.price_yearly),
      features, max_products: form.max_products ? Number(form.max_products) : null,
      max_staff: form.max_staff ? Number(form.max_staff) : null,
    };

    if (editPlan?.id) {
      await supabase.from("subscription_plans").update(data).eq("id", editPlan.id);
    } else {
      await supabase.from("subscription_plans").insert(data);
    }
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: editPlan?.id ? "plan_updated" : "plan_created",
      entity_type: "subscription_plan", details: data,
    });

    const { data: refreshed } = await supabase.from("subscription_plans").select("*").order("price_monthly");
    setPlans(refreshed ?? []);
    setEditPlan(null);
    toast({ title: editPlan?.id ? "Plan updated" : "Plan created" });
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("subscription_plans").delete().eq("id", id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Plan deleted" });
  };

  const planCounts = (slug: string) => businesses.filter((b) => b.subscription_plan === slug).length;

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground font-body text-sm">Manage pricing and plans</p>
          </div>
          <Button onClick={() => openEdit()} className="gap-2"><Plus size={16} /> New Plan</Button>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg">{p.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit2 size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePlan(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                </div>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">KES {Number(p.price_monthly).toLocaleString()}<span className="text-sm text-muted-foreground font-body">/mo</span></p>
                <p className="text-xs text-muted-foreground font-body">KES {Number(p.price_yearly).toLocaleString()}/year</p>
              </div>
              <div className="text-xs text-muted-foreground font-body space-y-1">
                {(p.features ?? []).map((f: string, i: number) => (
                  <p key={i}>✓ {f}</p>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-body">{planCounts(p.slug)} businesses on this plan</p>
                {p.max_products && <p className="text-xs text-muted-foreground">Max {p.max_products} products</p>}
                {p.max_staff && <p className="text-xs text-muted-foreground">Max {p.max_staff} staff</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Business subscription overview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-semibold">Subscription Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Business</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Trial Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {businesses.slice(0, 20).map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-body">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize font-body">{b.subscription_plan}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                        b.subscription_status === "active" ? "bg-green-500/10 text-green-400" :
                        b.subscription_status === "trial" ? "bg-blue-500/10 text-blue-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{b.subscription_status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {b.trial_ends_at ? new Date(b.trial_ends_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!editPlan} onOpenChange={() => setEditPlan(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">{editPlan?.id ? "Edit Plan" : "New Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-body text-muted-foreground">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-body text-muted-foreground">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-body text-muted-foreground">Monthly (KES)</label>
                <Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-body text-muted-foreground">Yearly (KES)</label>
                <Input type="number" value={form.price_yearly} onChange={(e) => setForm({ ...form, price_yearly: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-body text-muted-foreground">Max Products (blank=unlimited)</label>
                <Input value={form.max_products} onChange={(e) => setForm({ ...form, max_products: e.target.value })} /></div>
              <div><label className="text-sm font-body text-muted-foreground">Max Staff (blank=unlimited)</label>
                <Input value={form.max_staff} onChange={(e) => setForm({ ...form, max_staff: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-body text-muted-foreground">Features (one per line)</label>
              <Textarea rows={5} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
            <Button onClick={savePlan} className="w-full">Save Plan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
