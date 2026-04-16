import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe, BarChart3, Store, UtensilsCrossed, Wine, Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImg from "@/assets/hero-pos.jpg";
import retailImg from "@/assets/retail-pos.jpg";
import barImg from "@/assets/bar-pos.jpg";
import restaurantImg from "@/assets/restaurant-pos.jpg";

const solutions = [
  {
    title: "Retail POS",
    desc: "Barcode scanning, inventory tracking, fast checkout, and receipt generation for shops of any size.",
    icon: Store,
    img: retailImg,
  },
  {
    title: "Bar & Liquor POS",
    desc: "Tab management, happy hour pricing, quick-order buttons, and drink category management.",
    icon: Wine,
    img: barImg,
  },
  {
    title: "Restaurant POS",
    desc: "Table management, kitchen display, order tracking, split bills, and waiter assignment.",
    icon: UtensilsCrossed,
    img: restaurantImg,
  },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second checkout with zero lag, even on busy days." },
  { icon: Shield, title: "Bank-Grade Security", desc: "Encrypted data, role-based access, isolated multi-tenant architecture." },
  { icon: Globe, title: "M-Pesa Integrated", desc: "Accept mobile payments instantly with STK Push integration." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Sales reports, profit tracking, and staff performance at a glance." },
  { icon: Smartphone, title: "Touch-Friendly", desc: "Designed for tablets and touch screens — no training needed." },
  { icon: Store, title: "Multi-Business", desc: "Manage multiple branches from a single dashboard." },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-6">
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-body text-primary">Now with M-Pesa Integration</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              The POS System <br />
              <span className="text-gradient">Built for Africa</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-lg font-body">
              Run your retail shop, bar, or restaurant with a powerful, cloud-based point of sale. Start in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button variant="hero" size="lg" className="text-base px-8">
                  Start Your POS <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/solutions">
                <Button variant="hero-outline" size="lg" className="text-base px-8">
                  View Solutions
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 hero-gradient-bg opacity-20 blur-3xl rounded-3xl" />
            <img
              src={heroImg}
              alt="Abancool POS Dashboard on tablet"
              className="relative rounded-2xl glow-border w-full"
              width={1280}
              height={720}
            />
          </div>
        </div>
      </div>
    </section>

    {/* Solutions — Zigzag */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            One Platform, <span className="text-gradient">Every Business</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Whether you run a retail shop, a bustling bar, or a fine-dining restaurant — Abancool has the right POS for you.
          </p>
        </div>

        <div className="space-y-20">
          {solutions.map((sol, i) => (
            <div
              key={sol.title}
              className={`grid md:grid-cols-2 gap-10 items-center ${
                i % 2 === 1 ? "md:direction-rtl" : ""
              }`}
              style={i % 2 === 1 ? { direction: "rtl" } : undefined}
            >
              <div style={{ direction: "ltr" }}>
                <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 mb-4">
                  <sol.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold mb-3">{sol.title}</h3>
                <p className="text-muted-foreground font-body mb-6">{sol.desc}</p>
                <Link to="/register">
                  <Button variant="hero" size="sm">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
              <div style={{ direction: "ltr" }}>
                <img
                  src={sol.img}
                  alt={sol.title}
                  className="rounded-2xl glow-border w-full"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="text-gradient">Succeed</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6 hover:glow-border transition-shadow duration-300">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 font-body">
            Join thousands of businesses already using Abancool POS. Set up in minutes, not days.
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg" className="text-base px-10">
              Get Started <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Index;
