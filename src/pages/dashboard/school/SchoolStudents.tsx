import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GraduationCap } from "lucide-react";

const SchoolStudents = () => {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ admission_no: "", full_name: "", date_of_birth: "", gender: "male", class_id: "", parent_name: "", parent_phone: "", parent_email: "", address: "" });

  const load = async () => {
    if (!business) return;
    const [s, c] = await Promise.all([
      supabase.from("school_students").select("*, school_classes(name)").eq("business_id", business.id).order("full_name"),
      supabase.from("school_classes").select("id,name").eq("business_id", business.id),
    ]);
    setStudents(s.data ?? []);
    setClasses(c.data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const payload: any = { ...form, business_id: business.id };
    if (!payload.date_of_birth) delete payload.date_of_birth;
    if (!payload.class_id) delete payload.class_id;
    const { error } = await supabase.from("school_students").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ admission_no: "", full_name: "", date_of_birth: "", gender: "male", class_id: "", parent_name: "", parent_phone: "", parent_email: "", address: "" });
    toast({ title: "Student admitted" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("school_students").delete().eq("id", id);
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><GraduationCap className="text-primary" />Students</h1>
      <form onSubmit={add} className="rounded-xl border border-border bg-card p-4 mb-6 grid md:grid-cols-3 gap-3">
        <Input placeholder="Admission no." value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} required />
        <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input type="date" placeholder="DOB" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">— Select class —</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input placeholder="Parent / Guardian name" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
        <Input placeholder="Parent phone" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
        <Input placeholder="Parent email" type="email" value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} />
        <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div className="md:col-span-3"><Button variant="hero" type="submit"><Plus size={16} /> Admit Student</Button></div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left">
            <tr><th className="p-3">Adm. No</th><th className="p-3">Name</th><th className="p-3">Class</th><th className="p-3">Parent</th><th className="p-3">Phone</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No students yet.</td></tr>
            ) : students.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-mono">{s.admission_no}</td>
                <td className="p-3">{s.full_name}</td>
                <td className="p-3">{s.school_classes?.name ?? "—"}</td>
                <td className="p-3">{s.parent_name ?? "—"}</td>
                <td className="p-3">{s.parent_phone ?? "—"}</td>
                <td className="p-3"><button onClick={() => remove(s.id)} className="text-destructive"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
export default SchoolStudents;
