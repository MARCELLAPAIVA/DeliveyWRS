"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { Category } from "@/lib/types";

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setName("");
    setIconUrl("");
  };

  const save = async () => {
    if (!name) return;
    if (editingId) {
      await supabase.from("categories").update({ name, icon_url: iconUrl }).eq("id", editingId);
    } else {
      await supabase.from("categories").insert({ name, icon_url: iconUrl, active: true });
    }
    reset();
    load();
  };

  const startEdit = (item: Category) => {
    setEditingId(item.id);
    setName(item.name);
    setIconUrl(item.icon_url ?? "");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <h2>{editingId ? "Editar categoria" : "Categorias"}</h2>
      <div className="grid grid-2">
        <input className="input" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Ícone (URL opcional)" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={save}>{editingId ? "Atualizar" : "Criar categoria"}</button>
        {editingId && <button className="btn btn-light" onClick={reset}>Cancelar</button>}
      </div>
      {items.map((i) => (
        <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderBottom: "1px solid #eee" }}>
          <span>{i.name}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-light" onClick={() => startEdit(i)}>Editar</button>
            <button className="btn btn-light" onClick={() => remove(i.id)}>Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}
