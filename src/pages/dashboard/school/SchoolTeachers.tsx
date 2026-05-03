import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users } from "lucide-react";

const SchoolTeachers = () => {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", qualification: "", subjects: "" });

  const load = async () => {
    if (!business) return;
    const { data } = await supabase.from("school_teachers").select("*").eq("business_id", business.id);
    setTeachers(data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const subjects = form.subjects.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("school_teachers").insert({
      business_id: business.id,
      full_name: form.full_name, email: form.email || null, phone: form.phone || null,
      qualification: form.qualification || null, subjects,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ full_name: "", email: "", phone: "", qualification: "", subjects: "" });
    toast({ title: "Teacher added", description: "Use the Staff page to give them a login account." });
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><Users className="text-primary" />Teachers</h1>
      <form onSubmit={add} className="rounded-xl border border-border bg-card p-4 mb-6 grid md:grid-cols-3 gap-3">
        <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
        <Input placeholder="Subjects (comma separated)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="md:col-span-2" />
        <div className="md:col-span-3"><Button variant="hero" type="submit"><Plus size={16} /> Add Teacher</Button></div>
      </form>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {teachers.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No teachers yet.</p>
        ) : teachers.map((t) => (
          <div key={t.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-heading font-medium">{t.full_name}</p>
              <p className="text-xs text-muted-foreground">{(t.subjects ?? []).join(", ") || "No subjects"} • {t.email ?? "—"} • {t.phone ?? "—"}</p>
            </div>
            <button onClick={async () => { await supabase.from("school_teachers").delete().eq("id", t.id); load(); }} className="text-destructive"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};
export default SchoolTeachers;
