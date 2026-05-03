import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap, CalendarCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const TeacherPortal = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: t } = await supabase.from("school_teachers").select("*, businesses(name)").eq("user_id", user.id).maybeSingle();
      setTeacher(t);
      if (t) {
        const { data: s } = await supabase.from("school_students").select("id,full_name,admission_no, school_classes(name)").eq("business_id", t.business_id).eq("is_active", true);
        setStudents(s ?? []);
      }
    })();
  }, [user]);

  const out = async () => { await signOut(); navigate("/"); };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Link to="/login" className="text-primary">Please sign in</Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-bold">Teacher Portal</h1>
          <p className="text-xs text-muted-foreground">{teacher?.businesses?.name ?? "—"} • {profile?.full_name}</p>
        </div>
        <Button size="sm" variant="outline" onClick={out}><LogOut size={14} /> Sign out</Button>
      </header>
      <div className="p-6">
        {!teacher ? (
          <p className="text-muted-foreground">Your account isn't linked to a teacher profile yet. Ask your school admin.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-border bg-card p-4"><GraduationCap className="text-primary mb-2" /><p className="text-2xl font-heading font-bold">{students.length}</p><p className="text-xs text-muted-foreground">Students in school</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><CalendarCheck className="text-green-400 mb-2" /><p className="text-sm font-heading">Attendance</p><p className="text-xs text-muted-foreground">Use main dashboard to mark</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><FileText className="text-amber-400 mb-2" /><p className="text-sm font-heading">Exams</p><p className="text-xs text-muted-foreground">Enter marks via Exams page</p></div>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <div className="p-3 font-heading font-semibold">My School Students</div>
              {students.slice(0, 20).map((s) => (
                <div key={s.id} className="p-3 flex justify-between text-sm">
                  <span>{s.full_name}</span>
                  <span className="text-muted-foreground">{s.school_classes?.name ?? "—"} • {s.admission_no}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default TeacherPortal;
