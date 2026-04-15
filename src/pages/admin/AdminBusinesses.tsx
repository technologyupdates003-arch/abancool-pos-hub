import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Edit2, Trash2, Ban, CheckCircle, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 15;

const AdminBusinesses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [owners, setOwners] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editBiz, setEditBiz] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", subscription_plan: "", type: "" });

  useEffect(() => {
    const load = async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      setBusinesses(biz ?? []);

      // Fetch owners (members with role=owner)
      const { data: members } = await supabase
        .from("business_members")
        .select("business_id, user_id, role")
        .eq("role", "owner");

      if (members?.length) {
        const ownerIds = [...new Set(members.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name");

        const ownerMap: Record<string, any> = {};
        for (const m of members) {
          if (m.role === "owner") {
            const p = profiles?.find((p) => p.user_id === m.user_id);
            ownerMap[m.business_id] = { name: p?.full_name ?? "Unknown", user_id: m.user_id };
          }
        }
        setOwners(ownerMap);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && b.type !== filterType) return false;
      if (filterStatus === "active" && !b.is_active) return false;
      if (filterStatus === "suspended" && b.is_active) return false;
      if (filterStatus === "trial" && b.subscription_status !== "trial") return false;
      return true;
    });
  }, [businesses, search, filterType, filterStatus]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleBusiness = async (id: string, active: boolean) => {
    await supabase.from("businesses").update({ is_active: !active }).eq("id", id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: active ? "business_suspended" : "business_activated",
      entity_type: "business", entity_id: id,
    });
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !active } : b)));
    toast({ title: active ? "Business suspended" : "Business activated" });
  };

  const deleteBusiness = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete this business and all its data.")) return;
    // Delete order_items, orders, products, categories, members, tables first
    const { data: orders } = await supabase.from("orders").select("id").eq("business_id", id);
    if (orders?.length) {
      for (const o of orders) {
        await supabase.from("order_items").delete().eq("order_id", o.id);
      }
    }
    await supabase.from("orders").delete().eq("business_id", id);
    await supabase.from("products").delete().eq("business_id", id);
    await supabase.from("categories").delete().eq("business_id", id);
    await supabase.from("restaurant_tables").delete().eq("business_id", id);
    await supabase.from("business_members").delete().eq("business_id", id);
    await supabase.from("businesses").delete().eq("id", id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: "business_deleted", entity_type: "business", entity_id: id,
    });
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Business deleted" });
  };

  const saveEdit = async () => {
    if (!editBiz) return;
    await supabase.from("businesses").update({
      name: editForm.name, subscription_plan: editForm.subscription_plan, type: editForm.type as any,
    }).eq("id", editBiz.id);
    await supabase.from("audit_logs").insert({
      user_id: user?.id, action: "business_edited", entity_type: "business", entity_id: editBiz.id,
      details: editForm,
    });
    setBusinesses((prev) => prev.map((b) => (b.id === editBiz.id ? { ...b, ...editForm } : b)));
    setEditBiz(null);
    toast({ title: "Business updated" });
  };

  const impersonate = (bizId: string) => {
    // Store impersonation in sessionStorage and navigate to dashboard
    sessionStorage.setItem("admin_impersonate_business_id", bizId);
    supabase.from("audit_logs").insert({
      user_id: user?.id, action: "business_impersonation", entity_type: "business", entity_id: bizId,
    });
    toast({ title: "Impersonation mode", description: "Viewing business dashboard as admin. Return to /admin to exit." });
    navigate("/dashboard");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Business Management</h1>
          <p className="text-muted-foreground font-body text-sm">{filtered.length} businesses</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search businesses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-body">
            <option value="all">All Types</option>
            <option value="retail">Retail</option>
            <option value="bar">Bar</option>
            <option value="restaurant">Restaurant</option>
            <option value="general">General</option>
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-body">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Business</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Owner</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden md:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden lg:table-cell">Sub Status</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold hidden lg:table-cell">Trial Ends</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-body font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-body text-xs">{owners[b.id]?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize hidden md:table-cell">{b.type}</td>
                    <td className="px-4 py-3 text-muted-foreground font-body capitalize hidden md:table-cell">{b.subscription_plan}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${b.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {b.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full font-body bg-muted text-muted-foreground capitalize">
                        {b.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-body text-xs hidden lg:table-cell">
                      {b.trial_ends_at ? new Date(b.trial_ends_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details"
                          onClick={() => navigate(`/admin/businesses/${b.id}`)}>
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit"
                          onClick={() => { setEditBiz(b); setEditForm({ name: b.name, subscription_plan: b.subscription_plan ?? "starter", type: b.type }); }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={b.is_active ? "Suspend" : "Activate"}
                          onClick={() => toggleBusiness(b.id, b.is_active)}>
                          {b.is_active ? <Ban size={14} className="text-destructive" /> : <CheckCircle size={14} className="text-green-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Login as Business"
                          onClick={() => impersonate(b.id)}>
                          <LogIn size={14} className="text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete"
                          onClick={() => deleteBusiness(b.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-body">No businesses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-body">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editBiz} onOpenChange={() => setEditBiz(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Business</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-body text-muted-foreground">Name</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground">Type</label>
              <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="retail">Retail</option>
                <option value="bar">Bar</option>
                <option value="restaurant">Restaurant</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground">Plan</label>
              <select value={editForm.subscription_plan} onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Button onClick={saveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBusinesses;
