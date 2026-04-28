import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Store, UtensilsCrossed, ArrowRight, Check, Pill } from "lucide-react";
import retailImg from "@/assets/retail-pos.jpg";
import restaurantImg from "@/assets/restaurant-pos.jpg";
import pharmacyImg from "@/assets/pharmacy-pos.jpg";

const solutions = [
  {
    title: "Retail POS",
    icon: Store,
    img: retailImg,
    features: ["Barcode scanning", "Cart system & fast checkout", "Receipt generation", "Stock auto-deduction", "Supplier management", "Sales reports"],
  },
  {
    title: "Restaurant POS",
    icon: UtensilsCrossed,
    img: restaurantImg,
    features: ["Table management", "Kitchen Display System", "Order tracking", "Waiter assignment", "Split bills", "Order statuses"],
  },
  {
    title: "Pharmacy POS",
    icon: Pill,
    img: pharmacyImg,
    features: ["Prescription tracking", "Batch & expiry management", "Drug inventory control", "Supplier & purchase orders", "Low-stock alerts", "Compliant receipts"],
  },
];

const Solutions = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4">
            POS <span className="text-gradient">Solutions</span>
          </h1>
          <p className="text-muted-foreground text-lg font-body">
            Purpose-built POS systems for every industry. Choose yours and start selling today.
          </p>
        </div>

        <div className="space-y-20">
          {solutions.map((sol, i) => (
            <div
              key={sol.title}
              className={`grid md:grid-cols-2 gap-10 items-center`}
              style={i % 2 === 1 ? { direction: "rtl" } : undefined}
            >
              <div style={{ direction: "ltr" }}>
                <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 mb-4">
                  <sol.icon size={20} className="text-primary" />
                </div>
                <h2 className="font-heading text-3xl font-bold mb-4">{sol.title}</h2>
                <ul className="space-y-2 mb-6">
                  {sol.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground font-body text-sm">
                      <Check size={16} className="text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant="hero" size="sm">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
              <div style={{ direction: "ltr" }}>
                <img src={sol.img} alt={sol.title} className="rounded-2xl glow-border w-full" loading="lazy" width={800} height={600} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Solutions;
