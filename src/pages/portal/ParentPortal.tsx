import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ParentPortal = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("school_parents").select("*, businesses(name)").eq("user_id", user.id).maybeSingle();
      setParent(p);
      if (p) {
        const { data: links } = await supabase.from("school_parent_students").select("student_id, school_students(*, school_classes(name))").eq("parent_id", p.id);
        setChildren((links ?? []).map((l: any) => l.school_students).filter(Boolean));
      }
    })();
  }, [user]);

  const out = async () => { await signOut(); navigate("/"); };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login" className="text-primary">Please sign in</Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-bold">Parent Portal</h1>
          <p className="text-xs text-muted-foreground">{parent?.businesses?.name ?? "—"} • {profile?.full_name}</p>
        </div>
        <Button size="sm" variant="outline" onClick={out}><LogOut size={14} /> Sign out</Button>
      </header>
      <div className="p-6">
        {!parent ? (
          <p className="text-muted-foreground">Your account isn't linked to a parent profile yet. Ask the school admin.</p>
        ) : children.length === 0 ? (
          <p className="text-muted-foreground">No children linked yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {children.map((c) => <ChildCard key={c.id} child={c} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const ChildCard = ({ child }: { child: any }) => {
  const [results, setResults] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [todayAtt, setTodayAtt] = useState<string>("—");

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [r, i, a] = await Promise.all([
        supabase.from("school_exam_results").select("score,grade, school_subjects(name)").eq("student_id", child.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("school_fee_invoices").select("*").eq("student_id", child.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("school_attendance").select("status").eq("student_id", child.id).eq("date", today).maybeSingle(),
      ]);
      setResults(r.data ?? []); setInvoices(i.data ?? []); setTodayAtt(a.data?.status ?? "—");
    })();
  }, [child.id]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><GraduationCap className="text-primary" size={18} /></div>
        <div>
          <p className="font-heading font-semibold">{child.full_name}</p>
          <p className="text-xs text-muted-foreground">Adm. {child.admission_no} • {child.school_classes?.name ?? "No class"}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Today: <span className="text-foreground capitalize">{todayAtt}</span></p>

      <div className="mt-4">
        <p className="text-xs font-heading font-semibold mb-1">Recent results</p>
        {results.length === 0 ? <p className="text-xs text-muted-foreground">No results yet.</p> : (
          <ul className="text-xs space-y-1">
            {results.map((r, idx) => <li key={idx} className="flex justify-between"><span>{r.school_subjects?.name}</span><span>{r.score} <span className="text-primary">{r.grade}</span></span></li>)}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-heading font-semibold mb-1">Outstanding fees</p>
        {invoices.length === 0 ? <p className="text-xs text-muted-foreground">No invoices.</p> : (
          <ul className="text-xs space-y-1">
            {invoices.map((i) => <li key={i.id} className="flex justify-between"><span>{i.invoice_number}</span><span>KES {Number(i.balance).toLocaleString()}</span></li>)}
          </ul>
        )}
      </div>
    </div>
  );
};
export default ParentPortal;
