import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Staff = () => {
  const { business, memberRole, isSubscribed } = useBusiness();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "cashier" as "manager" | "cashier" });

  const isOwner = memberRole === "owner";

  const fetchMembers = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("business_members")
      .select("*, profiles:user_id(full_name)")
      .eq("business_id", business.id);
    setMembers(data ?? []);
  };

  useEffect(() => { if (isSubscribed) fetchMembers(); }, [business, isSubscribed]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("create-staff", {
      body: {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
        business_id: business.id,
      },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Failed to create staff", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Staff created", description: `${form.email} can now sign in with the password you set.` });
    setForm({ full_name: "", email: "", password: "", role: "cashier" });
    setShowAdd(false);
    fetchMembers();
  };

  const handleRemove = async (id: string) => {
    await supabase.from("business_members").update({ is_active: false }).eq("id", id);
    toast({ title: "Staff member removed" });
    fetchMembers();
  };

  return (
    <DashboardLayout>
      <SubscriptionGate feature="Staff Management">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Staff</h1>
            <p className="text-sm text-muted-foreground font-body">Create staff accounts with login credentials they can use immediately.</p>
          </div>
          {isOwner && (
            <Button variant="hero" size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Staff
            </Button>
          )}
        </div>

        {showAdd && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-heading font-semibold mb-4">Create Staff Account</h2>
            <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body">Full name</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body">Password (min 6 chars)</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-9 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-2.5 text-muted-foreground">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="cashier">Cashier (POS only)</option>
                  <option value="manager">Manager (full dashboard)</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button variant="hero" size="sm" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                {isOwner && <th className="text-right px-4 py-3 font-heading font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-body">No staff members yet</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-body">{(m.profiles as any)?.full_name ?? "Unknown"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-body bg-primary/10 text-primary capitalize">{m.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-body ${m.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      {m.role !== "owner" && m.is_active && (
                        <button onClick={() => handleRemove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
};

export default Staff;
