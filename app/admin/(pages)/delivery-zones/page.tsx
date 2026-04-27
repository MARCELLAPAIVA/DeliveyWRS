"use client";

import { useEffect, useState } from "react";
import { currency } from "@/lib/format";
import { DeliveryZone } from "@/lib/types";
import { supabase } from "@/supabase/client";

export default function AdminDeliveryZones() {
  const [items, setItems] = useState<DeliveryZone[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [fee, setFee] = useState("");

  const load = async () => {
    const { data } = await supabase.from("delivery_zones").select("*").order("neighborhood");
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setNeighborhood("");
    setFee("");
  };

  const save = async () => {
    if (!neighborhood || !fee) return;
    if (editingId) {
      await supabase.from("delivery_zones").update({ neighborhood, fee: Number(fee) }).eq("id", editingId);
    } else {
      await supabase.from("delivery_zones").insert({ neighborhood, fee: Number(fee), active: true });
    }
    reset();
    load();
  };

  const edit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setNeighborhood(zone.neighborhood);
    setFee(String(zone.fee));
  };

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <h2>{editingId ? "Editar taxa de entrega" : "Taxa por bairro"}</h2>
      <div className="grid grid-2">
        <input className="input" placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <input className="input" placeholder="Taxa" value={fee} onChange={(e) => setFee(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={save}>{editingId ? "Atualizar" : "Salvar bairro"}</button>
        {editingId && <button className="btn btn-light" onClick={reset}>Cancelar</button>}
      </div>
      {items.map((i) => (
        <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "8px 0" }}>
          <span>{i.neighborhood} - {currency(i.fee)}</span>
          <button className="btn btn-light" onClick={() => edit(i)}>Editar</button>
        </div>
      ))}
    </div>
  );
}
