import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Target, Award, Globe } from "lucide-react";

const values = [
  { icon: Target, title: "Mission-Driven", desc: "Empowering African businesses with world-class technology." },
  { icon: Users, title: "Customer First", desc: "Every feature is built from real business feedback." },
  { icon: Award, title: "Quality", desc: "Enterprise-grade reliability at small-business pricing." },
  { icon: Globe, title: "Pan-African", desc: "Built for Africa's diverse markets and payment systems." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6">
          About <span className="text-gradient">Abancool Technology</span>
        </h1>
        <p className="text-lg text-muted-foreground font-body mb-12 max-w-2xl">
          We build enterprise-grade point of sale solutions that are simple to use, 
          affordable, and tailored for Africa's fastest-growing businesses.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-6">
              <v.icon size={24} className="text-primary mb-3" />
              <h3 className="font-heading font-semibold text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="font-heading text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-muted-foreground font-body leading-relaxed">
            Founded with a simple belief: every business deserves powerful tools regardless of size. 
            Abancool Technology started by solving POS challenges for local shops in Kenya and has grown 
            into a full SaaS platform serving retail, hospitality, and food & beverage businesses 
            across East Africa. With native M-Pesa integration and cloud-based architecture, 
            we're making enterprise technology accessible to everyone.
          </p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default About;
