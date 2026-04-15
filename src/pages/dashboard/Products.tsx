import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Products = () => {
  const { business, memberRole } = useBusiness();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", cost_price: "", sku: "", barcode: "", stock_quantity: "", category_id: "", description: "" });

  const canManage = memberRole === "owner" || memberRole === "manager";

  const fetchData = async () => {
    if (!business) return;
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*, categories(name)").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("business_id", business.id),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
  };

  useEffect(() => { fetchData(); }, [business]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    const payload = {
      business_id: business.id,
      name: form.name,
      price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      sku: form.sku || null,
      barcode: form.barcode || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      category_id: form.category_id || null,
      description: form.description || null,
    };

    if (editId) {
      await supabase.from("products").update(payload).eq("id", editId);
      toast({ title: "Product updated" });
    } else {
      await supabase.from("products").insert(payload);
      toast({ title: "Product added" });
    }
    setShowForm(false); setEditId(null);
    setForm({ name: "", price: "", cost_price: "", sku: "", barcode: "", stock_quantity: "", category_id: "", description: "" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" });
    fetchData();
  };

  const startEdit = (p: any) => {
    setForm({
      name: p.name, price: String(p.price), cost_price: String(p.cost_price ?? ""),
      sku: p.sku ?? "", barcode: p.barcode ?? "", stock_quantity: String(p.stock_quantity ?? 0),
      category_id: p.category_id ?? "", description: p.description ?? "",
    });
    setEditId(p.id); setShowForm(true);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Products</h1>
        {canManage && (
          <Button variant="hero" size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", price: "", cost_price: "", sku: "", barcode: "", stock_quantity: "", category_id: "", description: "" }); }}>
            <Plus size={16} /> Add Product
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="font-heading font-semibold mb-4">{editId ? "Edit" : "New"} Product</h2>
          <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Price (KES)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Cost price" type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Stock quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="sm:col-span-2 flex gap-2">
              <Button variant="hero" type="submit" size="sm">Save</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-heading font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-heading font-semibold">Category</th>
                <th className="text-right px-4 py-3 font-heading font-semibold">Price</th>
                <th className="text-right px-4 py-3 font-heading font-semibold">Stock</th>
                {canManage && <th className="text-right px-4 py-3 font-heading font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-body">No products found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-body">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-body">{p.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-heading font-medium">KES {Number(p.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-body ${p.stock_quantity <= p.low_stock_threshold ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(p)} className="text-muted-foreground hover:text-foreground mr-2"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;
