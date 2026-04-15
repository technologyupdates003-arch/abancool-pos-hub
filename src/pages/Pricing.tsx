import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "KES 2,500",
    period: "/month",
    desc: "Perfect for small shops and kiosks.",
    features: ["1 POS terminal", "Basic inventory", "Receipt generation", "M-Pesa payments", "Email support"],
    popular: false,
  },
  {
    name: "Business",
    price: "KES 5,000",
    period: "/month",
    desc: "For growing businesses with staff.",
    features: ["Up to 3 terminals", "Full inventory & suppliers", "Staff management", "Sales reports", "M-Pesa + cash", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "KES 12,000",
    period: "/month",
    desc: "Multi-branch operations with advanced features.",
    features: ["Unlimited terminals", "Multi-branch", "Advanced analytics", "API access", "Custom integrations", "Dedicated account manager", "SLA guarantee"],
    popular: false,
  },
];

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="text-muted-foreground text-lg font-body">
            Start free for 14 days. No credit card required. Pay via M-Pesa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-primary glow-border bg-card"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="inline-block self-start text-xs font-heading font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground font-body mt-1 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-heading font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <Check size={14} className="text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant={plan.popular ? "hero" : "hero-outline"} className="w-full">
                  Start Free Trial <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Pricing;
