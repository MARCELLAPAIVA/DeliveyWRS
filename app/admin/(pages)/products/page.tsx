"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { currency } from "@/lib/format";
import { supabase } from "@/supabase/client";
import { Category, Product } from "@/lib/types";

const initialForm = { id: "", name: "", description: "", price: "", category_id: "", active: true, image_url: "" };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  const isEdit = useMemo(() => !!form.id, [form.id]);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*, categories(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name")
    ]);
    setProducts(p ?? []);
    setCategories(c ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const filePath = `products/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("products").upload(filePath, file, { upsert: false });
    if (error) return alert(error.message);

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    setForm((old) => ({ ...old, image_url: data.publicUrl }));
  };

  const save = async () => {
    if (!form.name || !form.category_id || !form.price) return alert("Preencha nome, categoria e preço.");

    setBusy(true);
    const payload = { ...form, price: Number(form.price) };
    if (isEdit) {
      await supabase.from("products").update(payload).eq("id", form.id);
    } else {
      await supabase.from("products").insert(payload);
    }
    setBusy(false);
    setForm(initialForm);
    load();
  };

  const edit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      category_id: product.category_id,
      active: product.active,
      image_url: product.image_url ?? ""
    });
  };

  const toggle = async (product: Product) => {
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Deseja excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  return (
    <div className="grid">
      <div className="card" style={{ padding: "1rem" }}>
        <h2>{isEdit ? "Editar produto" : "Novo produto"}</h2>
        <div className="grid grid-2">
          <input className="input" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <input className="input" placeholder="URL imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input type="file" accept="image/*" onChange={handleUpload} style={{ marginTop: 6 }} />
          </div>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Selecione categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativo</label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar produto"}</button>
          {isEdit && <button className="btn btn-light" onClick={() => setForm(initialForm)}>Cancelar edição</button>}
        </div>
      </div>

      <div className="card" style={{ padding: "1rem" }}>
        <h2>Produtos cadastrados</h2>
        {products.map((p) => (
          <div key={p.id} style={{ borderBottom: "1px solid #e5e7eb", padding: "0.7rem 0" }}>
            <strong>{p.name}</strong> — {currency(p.price)} ({p.categories?.name})
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn btn-light" onClick={() => edit(p)}>Editar</button>
              <button className="btn btn-light" onClick={() => toggle(p)}>{p.active ? "Inativar" : "Ativar"}</button>
              <button className="btn btn-light" onClick={() => remove(p.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
