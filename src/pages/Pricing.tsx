import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_monthly").then(({ data }) => {
      setPlans(data ?? []);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-muted-foreground text-lg font-body">
              Every business pays. Choose the plan that fits your needs. Pay via M-Pesa.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-body transition ${billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >Monthly</button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-body transition ${billingPeriod === "yearly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >Yearly <span className="text-xs opacity-75">(Save 15%)</span></button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = index === 1;
              const price = billingPeriod === "yearly" ? plan.price_yearly : plan.price_monthly;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-8 flex flex-col ${
                    isPopular ? "border-primary glow-border bg-card" : "border-border bg-card"
                  }`}
                >
                  {isPopular && (
                    <span className="inline-block self-start text-xs font-heading font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1 mb-4">
                    {plan.slug === "starter" && "Perfect for small shops and kiosks."}
                    {plan.slug === "pro" && "For growing businesses with staff."}
                    {plan.slug === "enterprise" && "Multi-branch operations with advanced features."}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-heading font-extrabold">KES {Number(price).toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/{billingPeriod === "yearly" ? "year" : "month"}</span>
                  </div>
                  <ul className="space-y-2 mb-8 flex-1">
                    {(plan.features ?? []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                        <Check size={14} className="text-primary shrink-0" /> {f}
                      </li>
                    ))}
                    {plan.max_products && (
                      <li className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Check size={12} className="text-primary shrink-0" /> Up to {plan.max_products} products
                      </li>
                    )}
                    {plan.max_staff && (
                      <li className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Check size={12} className="text-primary shrink-0" /> Up to {plan.max_staff} staff
                      </li>
                    )}
                  </ul>
                  <Link to="/register">
                    <Button variant={isPopular ? "hero" : "hero-outline"} className="w-full">
                      Get Started <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Pricing;
