import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck } from "lucide-react";

const STATUSES = ["present", "absent", "late", "excused"] as const;

const SchoolAttendance = () => {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!business) return;
    supabase.from("school_classes").select("id,name").eq("business_id", business.id).then(({ data }) => setClasses(data ?? []));
  }, [business]);

  useEffect(() => {
    if (!business || !classId) { setStudents([]); return; }
    (async () => {
      const { data: studs } = await supabase.from("school_students").select("id,full_name,admission_no").eq("business_id", business.id).eq("class_id", classId).eq("is_active", true).order("full_name");
      setStudents(studs ?? []);
      const { data: existing } = await supabase.from("school_attendance").select("student_id,status").eq("business_id", business.id).eq("class_id", classId).eq("date", date);
      const m: Record<string, string> = {};
      (existing ?? []).forEach((e: any) => { m[e.student_id] = e.status; });
      // default everyone to present
      (studs ?? []).forEach((s: any) => { if (!m[s.id]) m[s.id] = "present"; });
      setMarks(m);
    })();
  }, [classId, date, business]);

  const save = async () => {
    if (!business || !classId) return;
    const rows = students.map((s) => ({
      business_id: business.id, class_id: classId, student_id: s.id,
      date, status: (marks[s.id] ?? "present") as any, marked_by: user?.id ?? null,
    }));
    // upsert via delete+insert for the day
    await supabase.from("school_attendance").delete().eq("class_id", classId).eq("date", date);
    const { error } = await supabase.from("school_attendance").insert(rows);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Attendance saved" });
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><CalendarCheck className="text-primary" />Attendance</h1>
      <div className="rounded-xl border border-border bg-card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="">— Choose class —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </div>
        {students.length > 0 && <Button variant="hero" onClick={save}>Save Attendance</Button>}
      </div>

      {students.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {students.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-heading font-medium">{s.full_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{s.admission_no}</p>
              </div>
              <div className="flex gap-1">
                {STATUSES.map((st) => (
                  <button key={st} onClick={() => setMarks({ ...marks, [s.id]: st })}
                    className={`px-2.5 py-1 rounded-md text-xs capitalize ${marks[s.id] === st ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
export default SchoolAttendance;
