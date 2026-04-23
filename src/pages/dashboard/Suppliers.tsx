import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Truck, Phone, Mail } from "lucide-react";

const Suppliers = () => {
  const { business, memberRole } = useBusiness();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "", notes: "" });

  const canManage = memberRole === "owner" || memberRole === "manager";

  const fetchSuppliers = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setSuppliers(data ?? []);
  };

  useEffect(() => { fetchSuppliers(); }, [business]);

  const reset = () => {
    setForm({ name: "", contact_person: "", phone: "", email: "", address: "", notes: "" });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const payload = { ...form, business_id: business.id };

    const { error } = editId
      ? await supabase.from("suppliers").update(payload).eq("id", editId)
      : await supabase.from("suppliers").insert(payload);

    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: editId ? "Supplier updated" : "Supplier added" }); reset(); fetchSuppliers(); }
  };

  const startEdit = (s: any) => {
    setForm({
      name: s.name, contact_person: s.contact_person ?? "", phone: s.phone ?? "",
      email: s.email ?? "", address: s.address ?? "", notes: s.notes ?? "",
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await supabase.from("suppliers").delete().eq("id", id);
    toast({ title: "Supplier deleted" });
    fetchSuppliers();
  };

  return (
    <DashboardLayout>
      <SubscriptionGate feature="Suppliers">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Truck size={22} className="text-primary" /> Suppliers</h1>
            <p className="text-muted-foreground font-body text-sm">Manage your stock vendors</p>
          </div>
          {canManage && (
            <Button variant="hero" size="sm" onClick={() => { reset(); setShowForm(true); }}>
              <Plus size={16} /> Add Supplier
            </Button>
          )}
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-heading font-semibold mb-4">{editId ? "Edit" : "New"} Supplier</h2>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
              <Input placeholder="Supplier name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2" />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sm:col-span-2" />
              <div className="sm:col-span-2 flex gap-2">
                <Button variant="hero" size="sm" type="submit">Save</Button>
                <Button variant="ghost" size="sm" type="button" onClick={reset}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground font-body">
              No suppliers yet. {canManage && "Click 'Add Supplier' to create your first one."}
            </div>
          ) : suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(s)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              {s.contact_person && <p className="text-sm font-body text-muted-foreground mb-2">{s.contact_person}</p>}
              <div className="space-y-1 text-xs font-body text-muted-foreground">
                {s.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {s.phone}</p>}
                {s.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {s.email}</p>}
                {s.address && <p className="text-muted-foreground/70">{s.address}</p>}
              </div>
            </div>
          ))}
        </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
};

export default Suppliers;
