import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

const typeIcon = (type: string) => {
  switch (type) {
    case "success": return <CheckCircle size={16} className="text-green-400" />;
    case "warning": return <AlertTriangle size={16} className="text-amber-400" />;
    case "error": return <XCircle size={16} className="text-destructive" />;
    default: return <Info size={16} className="text-primary" />;
  }
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(100);
      setNotifications(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("admin-notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await supabase.from("admin_notifications").update({ is_read: true }).eq("id", n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground font-body text-sm">{notifications.filter((n) => !n.is_read).length} unread</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck size={14} /> Mark All Read
          </Button>
        </div>

        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`rounded-xl border bg-card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                n.is_read ? "border-border opacity-60" : "border-primary/30 hover:bg-muted/20"
              }`}
            >
              {typeIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
