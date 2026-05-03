import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

const SchoolHome = () => {
  const { business, isSubscribed } = useBusiness();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, feesCollected: 0, presentToday: 0 });

  useEffect(() => {
    if (!business || !isSubscribed) return;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [s, t, c, pay, att] = await Promise.all([
        supabase.from("school_students").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("is_active", true),
        supabase.from("school_teachers").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("is_active", true),
        supabase.from("school_classes").select("*", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("school_fee_payments").select("amount").eq("business_id", business.id),
        supabase.from("school_attendance").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("date", today).eq("status", "present"),
      ]);
      const fees = (pay.data ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      setStats({
        students: s.count ?? 0,
        teachers: t.count ?? 0,
        classes: c.count ?? 0,
        feesCollected: fees,
        presentToday: att.count ?? 0,
      });
    })();
  }, [business, isSubscribed]);

  if (!business) return <DashboardLayout><div className="text-center py-20"><h2 className="font-heading text-2xl font-bold">No school selected</h2></div></DashboardLayout>;

  if (!isSubscribed) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">Activate Your School</h2>
        <p className="text-muted-foreground font-body text-sm max-w-md mb-6">
          Subscribe to a plan to unlock the full school management system.
        </p>
        <Button variant="hero" onClick={() => navigate("/dashboard/subscribe")}>Choose a Plan</Button>
      </div>
    </DashboardLayout>
  );

  const cards = [
    { label: "Students", value: stats.students, icon: GraduationCap, to: "/school/students", color: "text-primary" },
    { label: "Teachers", value: stats.teachers, icon: Users, to: "/school/teachers", color: "text-blue-400" },
    { label: "Classes", value: stats.classes, icon: BookOpen, to: "/school/classes", color: "text-amber-400" },
    { label: "Present Today", value: stats.presentToday, icon: Users, to: "/school/attendance", color: "text-green-400" },
    { label: "Fees Collected", value: `KES ${stats.feesCollected.toLocaleString()}`, icon: DollarSign, to: "/school/fees", color: "text-emerald-400" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Welcome, {profile?.full_name?.split(" ")[0] ?? "Principal"}!</h1>
        <p className="text-muted-foreground font-body text-sm">{business.name} • School Management</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-body">{c.label}</span>
              <c.icon size={16} className={c.color} />
            </div>
            <p className="text-2xl font-heading font-bold">{c.value}</p>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};
export default SchoolHome;
