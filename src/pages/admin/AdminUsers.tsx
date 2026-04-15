import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [memberships, setMemberships] = useState<Record<string, { business_name: string; role: string }[]>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: prof }, { data: userRoles }, { data: members }, { data: biz }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("business_members").select("user_id, business_id, role"),
        supabase.from("businesses").select("id, name"),
      ]);

      setProfiles(prof ?? []);

      const rMap: Record<string, string[]> = {};
      userRoles?.forEach((r) => {
        if (!rMap[r.user_id]) rMap[r.user_id] = [];
        rMap[r.user_id].push(r.role);
      });
      setRoles(rMap);

      const mMap: Record<string, { business_name: string; role: string }[]> = {};
      members?.forEach((m) => {
        if (!mMap[m.user_id]) mMap[m.user_id] = [];
        const bizName = biz?.find((b) => b.id === m.business_id)?.name ?? "Unknown";
        mMap[m.user_id].push({ business_name: bizName, role: m.role });
      });
      setMemberships(mMap);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (!search) return true;
      return p.full_name?.toLowerCase().includes(search.toLowerCase());
    });
  }, [profiles, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground font-body text-sm">{filtered.length} users across the platform</p>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">System Roles</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden md:table-cell">Businesses</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-body font-medium">{p.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(roles[p.user_id] ?? []).map((r) => (
                          <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-body ${r === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {(memberships[p.user_id] ?? []).map((m, i) => (
                          <span key={i} className="text-xs text-muted-foreground">{m.business_name} ({m.role})</span>
                        ))}
                        {!(memberships[p.user_id]?.length) && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
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

export default AdminUsers;
