import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SubscriptionGate from "@/components/SubscriptionGate";
import DashboardLayout from "@/components/DashboardLayout";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

const POSInterface = () => {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!business) return;
    Promise.all([
      supabase.from("products").select("*").eq("business_id", business.id).eq("is_active", true),
      supabase.from("categories").select("*").eq("business_id", business.id),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts(prods ?? []);
      setCategories(cats ?? []);
    });
  }, [business]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.16; // 16% VAT Kenya
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!business || !user || cart.length === 0) return;
    setProcessing(true);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error } = await supabase.from("orders").insert({
      business_id: business.id,
      order_number: orderNumber,
      staff_id: user.id,
      subtotal,
      tax,
      total,
      payment_method: paymentMethod,
      status: "completed" as any,
    }).select().single();

    if (error || !order) {
      toast({ title: "Order failed", description: error?.message, variant: "destructive" });
      setProcessing(false);
      return;
    }

    // Insert items
    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price,
      total_price: i.price * i.quantity,
    }));
    await supabase.from("order_items").insert(items);

    // Deduct stock manually
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        await supabase.from("products").update({
          stock_quantity: Math.max(0, prod.stock_quantity - item.quantity)
        }).eq("id", item.product_id);
      }
    }

    toast({ title: "Order complete!", description: `${orderNumber} — KES ${total.toLocaleString()}` });
    setCart([]);
    setShowCheckout(false);
    setProcessing(false);
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category_id === selectedCat;
    return matchSearch && matchCat;
  });

  if (!business) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">No business selected</div></DashboardLayout>;

  if (!isSubscribed) return (
    <DashboardLayout>
      <SubscriptionGate feature="POS System" />
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Products side */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg hero-gradient-bg flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-xs">A</span>
          </div>
          <h1 className="font-heading font-bold">{business.name} POS</h1>
          <div className="flex-1" />
          <button onClick={() => setShowCheckout(true)} className="md:hidden relative text-foreground">
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{cart.length}</span>
            )}
          </button>
        </div>

        {/* Search & categories */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCat(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body transition-colors ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body transition-colors ${selectedCat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-auto p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="rounded-xl border border-border bg-card p-4 text-left hover:glow-border transition-all active:scale-95">
                <p className="font-heading font-semibold text-sm truncate">{p.name}</p>
                <p className="text-primary font-heading font-bold text-lg mt-1">KES {Number(p.price).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Stock: {p.stock_quantity}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart side - desktop always visible, mobile overlay */}
      <div className={`${showCheckout ? "fixed inset-0 z-50 bg-background md:relative md:inset-auto" : "hidden md:flex"} w-full md:w-80 lg:w-96 border-l border-border bg-card flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-bold">Cart ({cart.length})</h2>
          <button onClick={() => setShowCheckout(false)} className="md:hidden text-muted-foreground"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground font-body text-sm py-12">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              Tap products to add
            </div>
          ) : cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground font-body">KES {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus size={12} /></button>
                <span className="w-8 text-center text-sm font-heading font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus size={12} /></button>
              </div>
              <p className="text-sm font-heading font-semibold w-20 text-right">KES {(item.price * item.quantity).toLocaleString()}</p>
              <button onClick={() => removeFromCart(item.product_id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="space-y-1 text-sm font-body">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax (16%)</span><span>KES {tax.toLocaleString()}</span></div>
              <div className="flex justify-between font-heading font-bold text-lg"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
            </div>

            <div className="flex gap-2">
              {["cash", "mpesa", "card"].map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-body capitalize transition-colors ${paymentMethod === m ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                  {m === "mpesa" ? "M-Pesa" : m}
                </button>
              ))}
            </div>

            <Button variant="hero" className="w-full" onClick={handleCheckout} disabled={processing}>
              {processing ? "Processing..." : `Charge KES ${total.toLocaleString()}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSInterface;
