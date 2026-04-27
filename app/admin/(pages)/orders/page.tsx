"use client";

import { useEffect, useState } from "react";
import { currency } from "@/lib/format";
import { supabase } from "@/supabase/client";

interface OrderRow {
  id: string;
  status: string;
  payment_method: string;
  total: number;
  address: string;
  created_at: string;
  profiles?: { full_name: string; phone: string };
}

const statuses = ["novo", "preparo", "entrega", "finalizado"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const load = async () => {
    const { data } = await supabase.from("orders").select("*, profiles(full_name, phone)").order("created_at", { ascending: false });
    setOrders(data ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("orders-realtime").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => { await supabase.from("orders").update({ status }).eq("id", id); load(); };

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <h2>Pedidos em tempo real</h2>
      {orders.map((order) => (
        <div key={order.id} style={{ borderBottom: "1px solid #e5e7eb", padding: "0.8rem 0" }}>
          <strong>#{order.id.slice(0, 8)}</strong> - {order.profiles?.full_name ?? "Cliente"} - {currency(order.total)}
          <p style={{ margin: "4px 0" }}>{order.address} | {order.payment_method}</p>
          <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
