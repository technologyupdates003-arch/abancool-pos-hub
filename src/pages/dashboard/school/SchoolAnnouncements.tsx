import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus } from "lucide-react";

const SchoolAnnouncements = () => {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  const load = async () => {
    if (!business) return;
    const { data } = await supabase.from("school_announcements").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const { error } = await supabase.from("school_announcements").insert({ ...form, business_id: business.id, created_by: user?.id ?? null });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ title: "", body: "", audience: "all" });
    toast({ title: "Announcement sent" });
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><Megaphone className="text-primary" />Announcements</h1>
      <form onSubmit={send} className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px]" />
        <div className="flex gap-3 items-center">
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Everyone</option>
            <option value="teachers">Teachers</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
          </select>
          <Button variant="hero" type="submit"><Plus size={16} /> Publish</Button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-8">No announcements yet.</p>
          : items.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-heading font-semibold">{a.title}</h3>
                <span className="text-xs text-muted-foreground capitalize">{a.audience}</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
      </div>
    </DashboardLayout>
  );
};
export default SchoolAnnouncements;
