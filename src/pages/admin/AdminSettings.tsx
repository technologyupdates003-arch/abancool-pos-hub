import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const AdminSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("system_settings").select("*");
      const sMap: Record<string, any> = {};
      data?.forEach((s) => { sMap[s.key] = { id: s.id, value: s.value }; });
      setSettings(sMap);
      setLoading(false);
    };
    load();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  const save = async () => {
    for (const [key, { id, value }] of Object.entries(settings)) {
      await supabase.from("system_settings").update({ value, updated_by: user?.id }).eq("id", id);
    }
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: "settings_updated", entity_type: "system",
    });
    toast({ title: "Settings saved" });
  };

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-heading text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground font-body text-sm">Platform-wide configuration</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <label className="text-sm font-body font-medium">Platform Name</label>
            <Input
              value={typeof settings.platform_name?.value === "string" ? settings.platform_name.value : ""}
              onChange={(e) => updateSetting("platform_name", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-body font-medium">Default Currency</label>
            <Input
              value={typeof settings.default_currency?.value === "string" ? settings.default_currency.value : ""}
              onChange={(e) => updateSetting("default_currency", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-body font-medium">Trial Duration (days)</label>
            <Input
              type="number"
              value={settings.trial_duration_days?.value ?? 14}
              onChange={(e) => updateSetting("trial_duration_days", Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-body font-medium">Grace Period After Expiry (days)</label>
            <Input
              type="number"
              value={settings.grace_period_days?.value ?? 3}
              onChange={(e) => updateSetting("grace_period_days", Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <Button onClick={save} className="gap-2"><Save size={16} /> Save Settings</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-heading font-semibold">System Information</h3>
          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span>Abancool Technology POS</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>1.0.0</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><span className="text-green-400">Production</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="text-green-400">Online</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Auth Service</span><span className="text-green-400">Online</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
