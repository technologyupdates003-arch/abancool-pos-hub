import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Smartphone } from "lucide-react";

const SettingsPage = () => {
  const { business, refetchBusinesses } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bizName, setBizName] = useState(business?.name ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // M-Pesa settings
  const [mpesa, setMpesa] = useState({
    id: null as string | null,
    mpesa_consumer_key: "",
    mpesa_consumer_secret: "",
    mpesa_shortcode: "",
    mpesa_passkey: "",
    mpesa_environment: "sandbox",
    mpesa_enabled: false,
  });
  const [savingMpesa, setSavingMpesa] = useState(false);

  useEffect(() => {
    if (!business) return;
    supabase
      .from("business_payment_settings")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMpesa({
            id: data.id,
            mpesa_consumer_key: data.mpesa_consumer_key ?? "",
            mpesa_consumer_secret: data.mpesa_consumer_secret ?? "",
            mpesa_shortcode: data.mpesa_shortcode ?? "",
            mpesa_passkey: data.mpesa_passkey ?? "",
            mpesa_environment: data.mpesa_environment ?? "sandbox",
            mpesa_enabled: !!data.mpesa_enabled,
          });
        }
      });
  }, [business]);

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

  const saveMpesa = async () => {
    if (!business) return;
    setSavingMpesa(true);
    const payload = {
      business_id: business.id,
      mpesa_consumer_key: mpesa.mpesa_consumer_key.trim() || null,
      mpesa_consumer_secret: mpesa.mpesa_consumer_secret.trim() || null,
      mpesa_shortcode: mpesa.mpesa_shortcode.trim() || null,
      mpesa_passkey: mpesa.mpesa_passkey.trim() || null,
      mpesa_environment: mpesa.mpesa_environment,
      mpesa_enabled: mpesa.mpesa_enabled,
    };
    const { error } = mpesa.id
      ? await supabase.from("business_payment_settings").update(payload).eq("id", mpesa.id)
      : await supabase.from("business_payment_settings").insert(payload);

    if (error) toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    else toast({ title: "M-Pesa settings saved" });
    setSavingMpesa(false);
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
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={18} className="text-primary" />
            <h2 className="font-heading font-semibold">M-Pesa Daraja Credentials</h2>
          </div>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Add your own Safaricom Daraja API credentials so customers can pay via M-Pesa STK push at the POS. Get these from your{" "}
            <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline">Daraja portal</a>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div>
                <p className="text-sm font-body font-medium">Enable M-Pesa at POS</p>
                <p className="text-xs text-muted-foreground">Allow cashiers to charge customers via STK push</p>
              </div>
              <Switch
                checked={mpesa.mpesa_enabled}
                onCheckedChange={(v) => setMpesa({ ...mpesa, mpesa_enabled: v })}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body">Environment</label>
              <select
                value={mpesa.mpesa_environment}
                onChange={(e) => setMpesa({ ...mpesa, mpesa_environment: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="production">Production (live)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body">Business Shortcode (Paybill / Till)</label>
              <Input
                value={mpesa.mpesa_shortcode}
                onChange={(e) => setMpesa({ ...mpesa, mpesa_shortcode: e.target.value })}
                placeholder="e.g. 174379"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body">Consumer Key</label>
              <Input
                value={mpesa.mpesa_consumer_key}
                onChange={(e) => setMpesa({ ...mpesa, mpesa_consumer_key: e.target.value })}
                placeholder="Daraja Consumer Key"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body">Consumer Secret</label>
              <Input
                type="password"
                value={mpesa.mpesa_consumer_secret}
                onChange={(e) => setMpesa({ ...mpesa, mpesa_consumer_secret: e.target.value })}
                placeholder="Daraja Consumer Secret"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body">Passkey (Lipa Na M-Pesa)</label>
              <Input
                type="password"
                value={mpesa.mpesa_passkey}
                onChange={(e) => setMpesa({ ...mpesa, mpesa_passkey: e.target.value })}
                placeholder="Online Passkey"
              />
            </div>

            <Button variant="hero" size="sm" onClick={saveMpesa} disabled={savingMpesa}>
              {savingMpesa ? "Saving..." : "Save M-Pesa Settings"}
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
