"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { currency } from "@/lib/format";
import { Category, DeliveryZone, PaymentMethod, Product } from "@/lib/types";
import { supabase } from "@/supabase/client";

export default function ShopPage() {
  const router = useRouter();
  const { items, addItem, removeItem, setQuantity, subtotal, clear } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [profileName, setProfileName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ensureAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace("/login");
    };
    ensureAuth();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cat }, { data: prod }, { data: zone }] = await Promise.all([
        supabase.from("categories").select("*").eq("active", true).order("name"),
        supabase.from("products").select("*, categories(*)").eq("active", true).order("name"),
        supabase.from("delivery_zones").select("*").eq("active", true).order("neighborhood")
      ]);
      setCategories(cat ?? []);
      setProducts(prod ?? []);
      setZones(zone ?? []);
    };
    fetchData();
  }, []);

  const selectedZone = useMemo(() => zones.find((z) => z.id === zoneId), [zoneId, zones]);
  const deliveryFee = selectedZone?.fee ?? 0;
  const total = subtotal + deliveryFee;

  const submitOrder = async () => {
    if (!items.length || !zoneId || !address) return alert("Preencha carrinho, endereço e bairro.");
    setSubmitting(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        notes,
        paymentMethod,
        changeFor: paymentMethod === "dinheiro" ? Number(changeFor || 0) : null,
        zoneId,
        profileName,
        phone,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      })
    });
    const payload = await response.json();
    setSubmitting(false);
    if (!response.ok) return alert(payload.error ? JSON.stringify(payload.error) : "Erro ao criar pedido");

    const orderSummary = encodeURIComponent(
      `Pedido #${payload.orderId}\n${items
        .map((item) => `- ${item.quantity}x ${item.product.name} (${currency(item.product.price * item.quantity)})`)
        .join("\n")}\nSubtotal: ${currency(subtotal)}\nEntrega: ${currency(deliveryFee)}\nTotal: ${currency(total)}\nPagamento: ${paymentMethod}`
    );

    alert("Pedido realizado com sucesso! ✅\nAgora envie a confirmação do seu pedido para nosso WhatsApp para agilizar o atendimento.");
    clear();
    window.open(`https://wa.me/5521985529198?text=${orderSummary}`, "_blank");
  };

  return (
    <div className="grid" style={{ gap: "1.2rem" }}>
      <section className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0 }}>Delivery WRS</h1>
        <p style={{ color: "#6b7280" }}>Seu delivery moderno, rápido e responsivo.</p>
      </section>

      <section>
        <h2>Categorias</h2>
        <div className="grid grid-3">
          {categories.map((cat) => (
            <article key={cat.id} className="card" style={{ padding: "0.8rem" }}>{cat.name}</article>
          ))}
        </div>
      </section>

      <section>
        <h2>Produtos</h2>
        <div className="grid grid-3">
          {products.map((product) => (
            <article key={product.id} className="card" style={{ padding: "0.8rem" }}>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{product.categories?.name}</p>
              <h3 style={{ margin: "0.3rem 0" }}>{product.name}</h3>
              <p style={{ color: "#6b7280", minHeight: 44 }}>{product.description}</p>
              <strong>{currency(product.price)}</strong>
              <button className="btn btn-primary" onClick={() => addItem(product)} style={{ width: "100%", marginTop: "0.6rem" }}>Adicionar</button>
            </article>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <h2>Carrinho e Checkout</h2>
        {items.length === 0 && <p>Seu carrinho está vazio.</p>}
        {items.map((item) => (
          <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <span>{item.product.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="btn btn-light" onClick={() => setQuantity(item.product.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button className="btn btn-light" onClick={() => setQuantity(item.product.id, item.quantity + 1)}>+</button>
              <button className="btn btn-light" onClick={() => removeItem(item.product.id)}>Remover</button>
            </div>
          </div>
        ))}

        <div className="grid grid-2" style={{ marginTop: "1rem" }}>
          <label>Nome<input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} /></label>
          <label>Telefone<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label>Endereço completo<input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <label>Bairro
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="">Selecione</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.neighborhood} ({currency(z.fee)})</option>)}
            </select>
          </label>
          <label>Pagamento
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="pix">PIX</option>
            </select>
          </label>
          {paymentMethod === "dinheiro" && <label>Precisa de troco para?<input className="input" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} /></label>}
        </div>
        <label>Observações<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>

        <p>Subtotal: <strong>{currency(subtotal)}</strong></p>
        <p>Taxa de entrega: <strong>{currency(deliveryFee)}</strong></p>
        <p>Total: <strong>{currency(total)}</strong></p>

        <button className="btn btn-primary" onClick={submitOrder} disabled={submitting}>{submitting ? "Enviando..." : "Finalizar pedido"}</button>
      </section>
    </div>
  );
}
