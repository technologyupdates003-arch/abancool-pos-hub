import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Staff = () => {
  const { business, memberRole } = useBusiness();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "cashier">("cashier");

  const isOwner = memberRole === "owner";

  const fetchMembers = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("business_members")
      .select("*, profiles:user_id(full_name)")
      .eq("business_id", business.id);
    setMembers(data ?? []);
  };

  useEffect(() => { fetchMembers(); }, [business]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Staff invitation", description: "The staff member needs to register first, then you can add them by their user ID. Email-based invite coming soon." });
    setShowAdd(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from("business_members").update({ is_active: false }).eq("id", id);
    toast({ title: "Staff member removed" });
    fetchMembers();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Staff</h1>
        {isOwner && (
          <Button variant="hero" size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Staff
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="font-heading font-semibold mb-4">Add Staff Member</h2>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-body">Email</label>
              <input placeholder="staff@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <Button variant="hero" type="submit" size="sm">Add</Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
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
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-body">No staff members</td></tr>
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
                    {m.role !== "owner" && (
                      <button onClick={() => handleRemove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default Staff;
