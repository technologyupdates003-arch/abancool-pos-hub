import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText } from "lucide-react";

const grade = (score: number, max: number) => {
  const p = (score / max) * 100;
  if (p >= 80) return "A";
  if (p >= 70) return "B";
  if (p >= 60) return "C";
  if (p >= 50) return "D";
  return "E";
};

const SchoolExams = () => {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), exam_type: "midterm", max_score: 100 });
  const [examId, setExamId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [marks, setMarks] = useState<Record<string, number>>({});

  const load = async () => {
    if (!business) return;
    const [e, s, c] = await Promise.all([
      supabase.from("school_exams").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("school_subjects").select("*").eq("business_id", business.id),
      supabase.from("school_classes").select("id,name").eq("business_id", business.id),
    ]);
    setExams(e.data ?? []);
    setSubjects(s.data ?? []);
    setClasses(c.data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  useEffect(() => {
    if (!business || !classId) { setStudents([]); return; }
    supabase.from("school_students").select("id,full_name").eq("business_id", business.id).eq("class_id", classId).eq("is_active", true).order("full_name").then(({ data }) => setStudents(data ?? []));
  }, [classId, business]);

  const addExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const { error } = await supabase.from("school_exams").insert({ ...form, business_id: business.id, max_score: Number(form.max_score) });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ name: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), exam_type: "midterm", max_score: 100 });
    toast({ title: "Exam created" });
    load();
  };

  const addSubject = async () => {
    const name = prompt("Subject name?");
    if (!name || !business) return;
    await supabase.from("school_subjects").insert({ business_id: business.id, name });
    load();
  };

  const saveMarks = async () => {
    if (!business || !examId || !subjectId) return;
    const exam = exams.find((e) => e.id === examId);
    const max = Number(exam?.max_score ?? 100);
    const rows = students.map((s) => ({
      business_id: business.id, exam_id: examId, student_id: s.id, subject_id: subjectId,
      score: Number(marks[s.id] ?? 0), grade: grade(Number(marks[s.id] ?? 0), max),
    }));
    await supabase.from("school_exam_results").delete().eq("exam_id", examId).eq("subject_id", subjectId).in("student_id", students.map((s) => s.id));
    const { error } = await supabase.from("school_exam_results").insert(rows);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Marks saved" });
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="text-primary" />Exams & Results</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <form onSubmit={addExam} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-heading font-semibold">Create Exam</h3>
          <Input placeholder="Exam name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Term" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} />
            <Input placeholder="Year" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
            <Input placeholder="Type" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} />
            <Input type="number" placeholder="Max score" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} />
          </div>
          <Button variant="hero" type="submit"><Plus size={16} /> Add Exam</Button>
        </form>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Subjects</h3>
            <Button size="sm" variant="outline" onClick={addSubject}><Plus size={14} /> Add</Button>
          </div>
          <ul className="space-y-1 text-sm">
            {subjects.length === 0 ? <li className="text-muted-foreground">No subjects yet.</li> : subjects.map((s) => <li key={s.id}>• {s.name}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 grid md:grid-cols-3 gap-3">
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">— Select exam —</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">— Select class —</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">— Select subject —</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {students.length > 0 && examId && subjectId && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <div className="p-3 flex justify-end"><Button variant="hero" size="sm" onClick={saveMarks}>Save Marks</Button></div>
          {students.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between">
              <p className="text-sm">{s.full_name}</p>
              <Input type="number" className="w-28" placeholder="Score"
                value={marks[s.id] ?? ""} onChange={(e) => setMarks({ ...marks, [s.id]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
export default SchoolExams;
