import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, Receipt } from "lucide-react";

const SchoolFees = () => {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"structures" | "invoices">("structures");
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sf, setSf] = useState({ class_id: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), item_name: "", amount: 0 });
  const [inv, setInv] = useState({ student_id: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), total: 0, due_date: "" });

  const load = async () => {
    if (!business) return;
    const [c, st, fs, fi] = await Promise.all([
      supabase.from("school_classes").select("id,name").eq("business_id", business.id),
      supabase.from("school_students").select("id,full_name,admission_no").eq("business_id", business.id).eq("is_active", true),
      supabase.from("school_fee_structures").select("*, school_classes(name)").eq("business_id", business.id),
      supabase.from("school_fee_invoices").select("*, school_students(full_name,admission_no)").eq("business_id", business.id).order("created_at", { ascending: false }),
    ]);
    setClasses(c.data ?? []); setStudents(st.data ?? []); setStructures(fs.data ?? []); setInvoices(fi.data ?? []);
  };
  useEffect(() => { load(); }, [business]);

  const addStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const { error } = await supabase.from("school_fee_structures").insert({ ...sf, business_id: business.id, amount: Number(sf.amount), class_id: sf.class_id || null });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setSf({ class_id: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), item_name: "", amount: 0 });
    toast({ title: "Fee item added" });
    load();
  };

  const issueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const total = Number(inv.total);
    const number = `INV-${Date.now()}`;
    const { error } = await supabase.from("school_fee_invoices").insert({
      business_id: business.id, student_id: inv.student_id, invoice_number: number,
      term: inv.term, academic_year: inv.academic_year, total, balance: total,
      due_date: inv.due_date || null, status: "unpaid",
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setInv({ student_id: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), total: 0, due_date: "" });
    toast({ title: "Invoice issued" });
    load();
  };

  const recordPayment = async (invoice: any) => {
    const amtStr = prompt(`Amount paid (balance KES ${invoice.balance})?`);
    if (!amtStr) return;
    const amount = Number(amtStr);
    if (!amount || amount <= 0) return;
    const method = prompt("Method (cash / mpesa / bank)?", "cash") || "cash";
    const receipt = method === "mpesa" ? prompt("M-Pesa receipt?") : null;
    const newPaid = Number(invoice.paid) + amount;
    const newBal = Math.max(0, Number(invoice.total) - newPaid);
    const status = newBal === 0 ? "paid" : "partial";
    await supabase.from("school_fee_payments").insert({
      business_id: business!.id, invoice_id: invoice.id, student_id: invoice.student_id,
      amount, method, mpesa_receipt: receipt, recorded_by: user?.id ?? null,
    });
    await supabase.from("school_fee_invoices").update({ paid: newPaid, balance: newBal, status }).eq("id", invoice.id);
    toast({ title: "Payment recorded" });
    load();
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2"><DollarSign className="text-primary" />Fees</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("structures")} className={`px-4 py-2 rounded-md text-sm ${tab === "structures" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Fee Structures</button>
        <button onClick={() => setTab("invoices")} className={`px-4 py-2 rounded-md text-sm ${tab === "invoices" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Invoices</button>
      </div>

      {tab === "structures" ? (
        <>
          <form onSubmit={addStructure} className="rounded-xl border border-border bg-card p-4 mb-6 grid md:grid-cols-5 gap-3">
            <select value={sf.class_id} onChange={(e) => setSf({ ...sf, class_id: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Term" value={sf.term} onChange={(e) => setSf({ ...sf, term: e.target.value })} />
            <Input placeholder="Year" value={sf.academic_year} onChange={(e) => setSf({ ...sf, academic_year: e.target.value })} />
            <Input placeholder="Item (e.g. Tuition)" value={sf.item_name} onChange={(e) => setSf({ ...sf, item_name: e.target.value })} required />
            <div className="flex gap-2">
              <Input type="number" placeholder="Amount" value={sf.amount} onChange={(e) => setSf({ ...sf, amount: Number(e.target.value) })} required />
              <Button variant="hero" type="submit"><Plus size={16} /></Button>
            </div>
          </form>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {structures.length === 0 ? <p className="p-8 text-center text-muted-foreground text-sm">No fee items yet.</p>
              : structures.map((s) => (
                <div key={s.id} className="p-3 flex justify-between text-sm">
                  <div>{s.item_name} • {s.school_classes?.name ?? "All"} • {s.term} {s.academic_year}</div>
                  <div className="font-heading font-semibold">KES {Number(s.amount).toLocaleString()}</div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <>
          <form onSubmit={issueInvoice} className="rounded-xl border border-border bg-card p-4 mb-6 grid md:grid-cols-5 gap-3">
            <select value={inv.student_id} onChange={(e) => setInv({ ...inv, student_id: e.target.value })} required className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">— Student —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}
            </select>
            <Input placeholder="Term" value={inv.term} onChange={(e) => setInv({ ...inv, term: e.target.value })} />
            <Input placeholder="Year" value={inv.academic_year} onChange={(e) => setInv({ ...inv, academic_year: e.target.value })} />
            <Input type="number" placeholder="Total" value={inv.total} onChange={(e) => setInv({ ...inv, total: Number(e.target.value) })} required />
            <div className="flex gap-2">
              <Input type="date" value={inv.due_date} onChange={(e) => setInv({ ...inv, due_date: e.target.value })} />
              <Button variant="hero" type="submit"><Plus size={16} /></Button>
            </div>
          </form>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left">
                <tr><th className="p-3">Invoice</th><th className="p-3">Student</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Balance</th><th className="p-3">Status</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices.</td></tr>
                  : invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3 font-mono text-xs">{i.invoice_number}</td>
                      <td className="p-3">{i.school_students?.full_name}</td>
                      <td className="p-3">KES {Number(i.total).toLocaleString()}</td>
                      <td className="p-3">KES {Number(i.paid).toLocaleString()}</td>
                      <td className="p-3">KES {Number(i.balance).toLocaleString()}</td>
                      <td className="p-3 capitalize"><span className={`px-2 py-0.5 rounded-full text-xs ${i.status === "paid" ? "bg-green-500/10 text-green-400" : i.status === "partial" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{i.status}</span></td>
                      <td className="p-3">{i.balance > 0 && <button onClick={() => recordPayment(i)} className="text-primary hover:underline text-xs flex items-center gap-1"><Receipt size={12} /> Record Payment</button>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};
export default SchoolFees;
