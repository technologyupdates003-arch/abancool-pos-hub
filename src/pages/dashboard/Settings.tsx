import { useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { business, refetchBusinesses } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bizName, setBizName] = useState(business?.name ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveBusiness = async () => {
    if (!business) return;
    setSaving(true);
    await supabase.from("businesses").update({ name: bizName }).eq("id", business.id);
    await refetchBusinesses();
    toast({ title: "Business updated" });
    setSaving(false);
  };

  const changePassword = async () => {
    if (!password || password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password updated" }); setPassword(""); }
  };

  return (
    <DashboardLayout>
      <h1 className="font-heading text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading font-semibold mb-4">Business Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-body">Business Name</label>
              <input value={bizName} onChange={(e) => setBizName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body">Business Type</label>
              <input value={business?.type ?? ""} disabled
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-body text-muted-foreground capitalize" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body">Subscription</label>
              <input value={`${business?.subscription_plan ?? "starter"} (${business?.subscription_status ?? "trial"})`} disabled
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-body text-muted-foreground capitalize" />
            </div>
            <Button variant="hero" size="sm" onClick={saveBusiness} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading font-semibold mb-4">Change Password</h2>
          <div className="space-y-3">
            <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button variant="hero" size="sm" onClick={changePassword}>Update Password</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
