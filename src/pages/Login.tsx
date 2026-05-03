import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) { navigate("/dashboard"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    const uid = data.user?.id;
    let dest = "/dashboard";
    if (uid) {
      // Admin?
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (r?.some((x: any) => x.role === "admin")) dest = "/admin";
      else {
        // School portal user?
        const [{ data: t }, { data: s }, { data: p }] = await Promise.all([
          supabase.from("school_teachers").select("id, business_id, businesses!inner(type)").eq("user_id", uid).maybeSingle(),
          supabase.from("school_students").select("id, business_id, businesses!inner(type)").eq("user_id", uid).maybeSingle(),
          supabase.from("school_parents").select("id, business_id, businesses!inner(type)").eq("user_id", uid).maybeSingle(),
        ]);
        if (t) dest = "/portal/teacher";
        else if (s) dest = "/portal/student";
        else if (p) dest = "/portal/parent";
        else {
          // School owner/manager → /school
          const { data: m } = await supabase.from("business_members").select("business_id, businesses!inner(type)").eq("user_id", uid).eq("is_active", true).limit(1).maybeSingle();
          if ((m as any)?.businesses?.type === "school") dest = "/school";
        }
      }
    }
    setLoading(false);
    navigate(dest);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-16">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="font-heading text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground font-body mb-6">Sign in to your Abancool account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button variant="hero" type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground font-body">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
