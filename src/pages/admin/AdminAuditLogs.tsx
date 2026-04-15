import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: logData }, { data: prof }] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      setLogs(logData ?? []);
      const pMap: Record<string, string> = {};
      prof?.forEach((p) => { pMap[p.user_id] = p.full_name ?? "Unknown"; });
      setProfiles(pMap);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    return l.action.toLowerCase().includes(search.toLowerCase()) ||
      (profiles[l.user_id] ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const actionColor = (action: string) => {
    if (action.includes("delete") || action.includes("suspend")) return "text-destructive";
    if (action.includes("create") || action.includes("activate")) return "text-green-400";
    if (action.includes("impersonation")) return "text-amber-400";
    return "text-primary";
  };

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground font-body text-sm">Track all admin and system actions</p>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actions or users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Timestamp</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden md:table-cell">Entity</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-body whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-body text-xs">{profiles[l.user_id] ?? "System"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-body font-medium ${actionColor(l.action)}`}>
                        {l.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {l.entity_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                      {l.details && Object.keys(l.details).length > 0 ? JSON.stringify(l.details) : "—"}
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
