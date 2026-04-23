import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, AlertTriangle, TrendingUp, ArrowDown, ArrowUp, Plus } from "lucide-react";

const Stock = () => {
  const { business, memberRole } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showRestock, setShowRestock] = useState(false);
  const [restockForm, setRestockForm] = useState({ product_id: "", quantity: "", unit_cost: "", supplier_id: "", notes: "" });

  const canManage = memberRole === "owner" || memberRole === "manager";

  const load = async () => {
    if (!business) return;
    const [{ data: prods }, { data: movs }, { data: sups }] = await Promise.all([
      supabase.from("products").select("*, suppliers(name)").eq("business_id", business.id).eq("is_active", true).order("name"),
      supabase.from("stock_movements").select("*, products(name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("suppliers").select("*").eq("business_id", business.id).eq("is_active", true),
    ]);
    setProducts(prods ?? []);
    setMovements(movs ?? []);
    setSuppliers(sups ?? []);
  };

  useEffect(() => { load(); }, [business]);

  const lowStock = products.filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold ?? 10));
  const outOfStock = products.filter((p) => Number(p.stock_quantity) <= 0);
  const totalStockValue = products.reduce((sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price ?? 0), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + Number(p.stock_quantity) * Number(p.price ?? 0), 0);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !restockForm.product_id || !restockForm.quantity) return;
    const qty = parseInt(restockForm.quantity);
    if (qty <= 0) return;

    const product = products.find((p) => p.id === restockForm.product_id);
    if (!product) return;

    // Insert movement
    const { error: mErr } = await supabase.from("stock_movements").insert({
      business_id: business.id,
      product_id: restockForm.product_id,
      supplier_id: restockForm.supplier_id || null,
      movement_type: "purchase",
      quantity: qty,
      unit_cost: parseFloat(restockForm.unit_cost) || 0,
      notes: restockForm.notes || null,
      created_by: user?.id ?? null,
    });

    // Bump stock
    const { error: pErr } = await supabase
      .from("products")
      .update({ stock_quantity: Number(product.stock_quantity) + qty })
      .eq("id", restockForm.product_id);

    if (mErr || pErr) {
      toast({ title: "Restock failed", description: (mErr || pErr)?.message, variant: "destructive" });
    } else {
      toast({ title: "Stock added", description: `+${qty} ${product.name}` });
      setRestockForm({ product_id: "", quantity: "", unit_cost: "", supplier_id: "", notes: "" });
      setShowRestock(false);
      load();
    }
  };

  return (
    <DashboardLayout>
      <SubscriptionGate feature="Stock Management">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Package size={22} className="text-primary" /> Stock</h1>
            <p className="text-muted-foreground font-body text-sm">Track inventory and restock from suppliers</p>
          </div>
          {canManage && (
            <Button variant="hero" size="sm" onClick={() => setShowRestock(true)}><Plus size={16} /> Restock</Button>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground font-body mb-1">Products tracked</p>
            <p className="text-2xl font-heading font-bold">{products.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground font-body mb-1">Stock value (cost)</p>
            <p className="text-2xl font-heading font-bold">KES {totalStockValue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground font-body mb-1">Retail value</p>
            <p className="text-2xl font-heading font-bold text-primary">KES {totalRetailValue.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl border p-5 ${lowStock.length > 0 ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"}`}>
            <p className="text-xs text-muted-foreground font-body mb-1 flex items-center gap-1">
              <AlertTriangle size={12} /> Low stock alerts
            </p>
            <p className={`text-2xl font-heading font-bold ${lowStock.length > 0 ? "text-red-400" : ""}`}>{lowStock.length}</p>
          </div>
        </div>

        {/* Low stock list */}
        {lowStock.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 mb-6">
            <h2 className="font-heading font-semibold mb-3 flex items-center gap-2 text-red-400">
              <AlertTriangle size={16} /> Low Stock — Reorder Soon
            </h2>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-sm">
                  <div>
                    <span className="font-body font-medium">{p.name}</span>
                    {p.suppliers?.name && <span className="text-xs text-muted-foreground ml-2">via {p.suppliers.name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-body px-2 py-0.5 rounded-full ${Number(p.stock_quantity) <= 0 ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {p.stock_quantity} left (threshold: {p.low_stock_threshold ?? 10})
                    </span>
                    {canManage && (
                      <Button size="sm" variant="outline" onClick={() => { setRestockForm({ ...restockForm, product_id: p.id }); setShowRestock(true); }}>
                        Restock
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold">All Inventory</h2>
            <span className="text-xs text-muted-foreground">{products.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-heading font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-heading font-semibold">Supplier</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Cost</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Price</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Stock</th>
                  <th className="text-right px-4 py-3 font-heading font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-body">No products yet</td></tr>
                ) : products.map((p) => {
                  const low = Number(p.stock_quantity) <= Number(p.low_stock_threshold ?? 10);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-body">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-body text-xs">{p.suppliers?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">KES {Number(p.cost_price ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">KES {Number(p.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body ${low ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        KES {(Number(p.stock_quantity) * Number(p.cost_price ?? 0)).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent movements */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold flex items-center gap-2"><TrendingUp size={16} /> Recent Stock Movements</h2>
          </div>
          {movements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-body text-sm">No movements yet</div>
          ) : (
            <div className="divide-y divide-border">
              {movements.map((m) => {
                const inbound = m.movement_type === "purchase" || m.movement_type === "return";
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inbound ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {inbound ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </div>
                      <div>
                        <p className="font-body">{m.products?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.movement_type} · {new Date(m.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-heading font-bold ${inbound ? "text-green-400" : "text-red-400"}`}>
                      {inbound ? "+" : "-"}{Math.abs(m.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Restock dialog */}
        <Dialog open={showRestock} onOpenChange={(o) => { if (!o) { setShowRestock(false); setRestockForm({ product_id: "", quantity: "", unit_cost: "", supplier_id: "", notes: "" }); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Restock Inventory</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRestock} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-body">Product</label>
                <select required value={restockForm.product_id} onChange={(e) => setRestockForm({ ...restockForm, product_id: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (current: {p.stock_quantity})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-body">Quantity *</label>
                  <Input type="number" min="1" required value={restockForm.quantity} onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-body">Unit cost</label>
                  <Input type="number" step="0.01" value={restockForm.unit_cost} onChange={(e) => setRestockForm({ ...restockForm, unit_cost: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body">Supplier</label>
                <select value={restockForm.supplier_id} onChange={(e) => setRestockForm({ ...restockForm, supplier_id: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">No supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body">Notes</label>
                <Input value={restockForm.notes} onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} placeholder="Optional" />
              </div>
              <Button variant="hero" type="submit" className="w-full">Confirm Restock</Button>
            </form>
          </DialogContent>
        </Dialog>
      </SubscriptionGate>
    </DashboardLayout>
  );
};

export default Stock;
