import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Store, Wine, UtensilsCrossed, Briefcase } from "lucide-react";

const businessTypes = [
  { value: "retail", label: "Retail Shop", icon: Store },
  { value: "bar", label: "Bar / Liquor", icon: Wine },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "general", label: "General Business", icon: Briefcase },
];

const Register = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", business: "", type: "" });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) {
      toast({ title: "Select a business type", variant: "destructive" });
      return;
    }
    toast({ title: "Account created!", description: "Authentication will be connected with Lovable Cloud." });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-20 pb-8">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="font-heading text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground font-body mb-6">Start your 14-day free trial</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input
                placeholder="Business name"
                value={form.business}
                onChange={(e) => setForm({ ...form, business: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div>
                <p className="text-sm font-heading font-medium mb-2">Business Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {businessTypes.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: bt.value })}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-body transition-all ${
                        form.type === bt.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <bt.icon size={16} />
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="hero" type="submit" className="w-full">Create Account</Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground font-body">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
