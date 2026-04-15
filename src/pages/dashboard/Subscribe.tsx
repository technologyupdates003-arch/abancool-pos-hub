import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Loader2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const Subscribe = () => {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_monthly").then(({ data }) => {
      setPlans(data ?? []);
      setLoading(false);
    });
  }, []);

  const handlePay = async () => {
    if (!phoneNumber || !selectedPlan || !activeBusiness) return;
    setPaying(true);

    try {
      const amount = billingPeriod === "yearly" ? selectedPlan.price_yearly : selectedPlan.price_monthly;

      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          action: "initiate",
          phone_number: phoneNumber,
          amount,
          business_id: activeBusiness.id,
          plan_slug: selectedPlan.slug,
          billing_period: billingPeriod,
        },
      });

      if (error || !data?.success) {
        toast({ title: "Payment failed", description: data?.error || error?.message, variant: "destructive" });
        setPaying(false);
        return;
      }

      setPaymentId(data.payment_id);
      setInvoiceId(data.invoice_id);
      toast({ title: "STK Push sent!", description: "Check your phone and enter M-Pesa PIN to complete payment." });
      setPaying(false);
      setCheckingStatus(true);

      // Poll for status
      pollStatus(data.payment_id, data.invoice_id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  const pollStatus = async (pid: string, invId: string) => {
    let attempts = 0;
    const maxAttempts = 12;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke("mpesa-stk-push", {
          body: { action: "check_status", payment_id: pid, invoice_id: invId },
        });

        if (data?.status === "completed") {
          clearInterval(interval);
          setCheckingStatus(false);
          setSelectedPlan(null);
          toast({ title: "Payment successful!", description: "Your subscription is now active." });
          window.location.reload();
        } else if (data?.status === "failed") {
          clearInterval(interval);
          setCheckingStatus(false);
          toast({ title: "Payment failed", description: "The M-Pesa transaction was not completed.", variant: "destructive" });
        }
      } catch {
        // continue polling
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setCheckingStatus(false);
        toast({ title: "Timeout", description: "Could not confirm payment. Check your M-Pesa messages and contact support if debited.", variant: "destructive" });
      }
    }, 5000);
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  }

  const currentPlan = activeBusiness?.subscription_plan;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Subscription</h1>
          <p className="text-muted-foreground font-body text-sm">
            Current plan: <span className="text-primary font-medium capitalize">{currentPlan || "Trial"}</span>
            {" · "}Status: <span className="capitalize">{activeBusiness?.subscription_status || "trial"}</span>
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-body transition ${billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >Monthly</button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-body transition ${billingPeriod === "yearly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >Yearly <span className="text-xs opacity-75">(Save 15%)</span></button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = billingPeriod === "yearly" ? plan.price_yearly : plan.price_monthly;
            const isCurrent = currentPlan === plan.slug;
            return (
              <div key={plan.id} className={`rounded-2xl border p-6 flex flex-col ${isCurrent ? "border-primary glow-border bg-card" : "border-border bg-card"}`}>
                {isCurrent && (
                  <span className="inline-block self-start text-xs font-heading font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">Current Plan</span>
                )}
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-3xl font-heading font-extrabold">KES {Number(price).toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">/{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.features ?? []).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                      <Check size={14} className="text-primary shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.max_products && <li className="text-xs text-muted-foreground">Up to {plan.max_products} products</li>}
                  {plan.max_staff && <li className="text-xs text-muted-foreground">Up to {plan.max_staff} staff</li>}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "hero"}
                  className="w-full"
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {isCurrent ? "Active" : "Subscribe"} <ArrowRight size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => { if (!paying && !checkingStatus) setSelectedPlan(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Pay via M-Pesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-body">Plan: <span className="font-semibold">{selectedPlan?.name}</span></p>
              <p className="text-sm font-body">Amount: <span className="font-semibold text-primary">
                KES {Number(billingPeriod === "yearly" ? selectedPlan?.price_yearly : selectedPlan?.price_monthly).toLocaleString()}
              </span></p>
              <p className="text-sm font-body">Period: <span className="capitalize">{billingPeriod}</span></p>
            </div>

            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">M-Pesa Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {checkingStatus ? (
              <div className="text-center py-4 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm font-body text-muted-foreground">Waiting for M-Pesa confirmation...</p>
                <p className="text-xs text-muted-foreground">Enter your PIN on your phone</p>
              </div>
            ) : (
              <Button onClick={handlePay} disabled={paying || !phoneNumber} className="w-full gap-2">
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {paying ? "Sending STK Push..." : "Pay Now"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Subscribe;
