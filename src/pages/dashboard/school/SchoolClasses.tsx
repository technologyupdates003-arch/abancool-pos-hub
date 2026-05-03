import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, BookOpen } from "lucide-react";

const SchoolClasses = () => {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", grade_level: "", stream: "", academic_year: new Date().getFullYear().toString() });

  const load = async () => {
    if (!business) return;
    const { data } = await supabase.from("school_classes").select("*").eq("business_id", business.id).order("name");
    setClasses(data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const { error } = await supabase.from("school_classes").insert({ ...form, business_id: business.id });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ name: "", grade_level: "", stream: "", academic_year: new Date().getFullYear().toString() });
    toast({ title: "Class added" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("school_classes").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-primary" />Classes</h1>
      <form onSubmit={add} className="rounded-xl border border-border bg-card p-4 mb-6 grid md:grid-cols-5 gap-3">
        <Input placeholder="Class name (e.g. Grade 5)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Grade level" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} />
        <Input placeholder="Stream (e.g. A)" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} />
        <Input placeholder="Academic year" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} required />
        <Button variant="hero" type="submit"><Plus size={16} /> Add</Button>
      </form>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {classes.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground font-body text-sm">No classes yet.</p>
        ) : classes.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-heading font-medium">{c.name} {c.stream && `• ${c.stream}`}</p>
              <p className="text-xs text-muted-foreground">{c.grade_level} • {c.academic_year}</p>
            </div>
            <button onClick={() => remove(c.id)} className="text-destructive hover:opacity-70"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};
export default SchoolClasses;
