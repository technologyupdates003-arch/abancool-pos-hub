import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, FileText, CalendarCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const StudentPortal = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("school_students").select("*, businesses(name), school_classes(name)").eq("user_id", user.id).maybeSingle();
      setStudent(s);
      if (s) {
        const [r, a, i] = await Promise.all([
          supabase.from("school_exam_results").select("*, school_exams(name,term), school_subjects(name)").eq("student_id", s.id).order("created_at", { ascending: false }),
          supabase.from("school_attendance").select("date,status").eq("student_id", s.id).order("date", { ascending: false }).limit(20),
          supabase.from("school_fee_invoices").select("*").eq("student_id", s.id).order("created_at", { ascending: false }),
        ]);
        setResults(r.data ?? []); setAttendance(a.data ?? []); setInvoices(i.data ?? []);
      }
    })();
  }, [user]);

  const out = async () => { await signOut(); navigate("/"); };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login" className="text-primary">Please sign in</Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-bold">Student Portal</h1>
          <p className="text-xs text-muted-foreground">{student?.businesses?.name ?? "—"} • {profile?.full_name}</p>
        </div>
        <Button size="sm" variant="outline" onClick={out}><LogOut size={14} /> Sign out</Button>
      </header>
      <div className="p-6 space-y-6">
        {!student ? (
          <p className="text-muted-foreground">Your account isn't linked to a student record yet. Ask your school.</p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold mb-1">{student.full_name}</h2>
              <p className="text-xs text-muted-foreground">Adm. {student.admission_no} • Class {student.school_classes?.name ?? "—"}</p>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="p-3 border-b border-border font-heading font-semibold flex items-center gap-2"><FileText size={16} className="text-primary" /> Results</div>
              <div className="divide-y divide-border">
                {results.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No results yet.</p>
                  : results.map((r) => (
                    <div key={r.id} className="p-3 flex justify-between text-sm">
                      <div>{r.school_exams?.name} • {r.school_subjects?.name}</div>
                      <div className="font-heading font-bold">{r.score} <span className="text-primary">{r.grade}</span></div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="p-3 border-b border-border font-heading font-semibold flex items-center gap-2"><CalendarCheck size={16} className="text-green-400" /> Attendance (last 20)</div>
              <div className="divide-y divide-border">
                {attendance.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No records.</p>
                  : attendance.map((a, i) => (
                    <div key={i} className="p-3 flex justify-between text-sm">
                      <div>{a.date}</div>
                      <div className={`capitalize ${a.status === "present" ? "text-green-400" : "text-red-400"}`}>{a.status}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="p-3 border-b border-border font-heading font-semibold flex items-center gap-2"><DollarSign size={16} className="text-amber-400" /> Fees</div>
              <div className="divide-y divide-border">
                {invoices.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No invoices.</p>
                  : invoices.map((i) => (
                    <div key={i.id} className="p-3 flex justify-between text-sm">
                      <div>{i.invoice_number} • {i.term}</div>
                      <div>Balance: KES {Number(i.balance).toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default StudentPortal;
