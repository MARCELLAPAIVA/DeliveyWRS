"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays, subMonths, subWeeks } from "date-fns";
import { currency } from "@/lib/format";
import { supabase } from "@/supabase/client";

interface Order { id: string; total: number; created_at: string; status: string }
interface Sold { product_name: string; qty: number }

type Period = "daily" | "weekly" | "monthly";

const csvFromRows = (rows: string[][]) => rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Sold[]>([]);
  const [period, setPeriod] = useState<Period>("daily");

  useEffect(() => {
    const load = async () => {
      const since = period === "daily" ? subDays(new Date(), 1) : period === "weekly" ? subWeeks(new Date(), 1) : subMonths(new Date(), 1);

      const [{ data: o }, { data: sold }] = await Promise.all([
        supabase.from("orders").select("id,total,created_at,status").eq("status", "finalizado").gte("created_at", since.toISOString()),
        supabase.rpc("top_selling_products")
      ]);
      setOrders(o ?? []);
      setTopProducts((sold as Sold[]) ?? []);
    };
    load();
  }, [period]);

  const totalRevenue = useMemo(() => orders.reduce((a, b) => a + b.total, 0), [orders]);

  const exportSales = () => {
    const csv = csvFromRows([
      ["pedido", "data", "total"],
      ...orders.map((o) => [o.id, format(new Date(o.created_at), "dd/MM/yyyy HH:mm"), o.total.toFixed(2)])
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid">
      <div className="card" style={{ padding: "1rem" }}>
        <h2>Resumo financeiro</h2>
        <label>Período
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="daily">Diário (últimas 24h)</option>
            <option value="weekly">Semanal (últimos 7 dias)</option>
            <option value="monthly">Mensal (últimos 30 dias)</option>
          </select>
        </label>
        <p>Faturamento no período: <strong>{currency(totalRevenue)}</strong></p>
        <p>Total de pedidos finalizados: <strong>{orders.length}</strong></p>
        <button className="btn btn-primary" onClick={exportSales}>Exportar vendas CSV</button>
      </div>
      <div className="card" style={{ padding: "1rem" }}>
        <h3>Produtos mais vendidos</h3>
        {topProducts.map((p) => <p key={p.product_name}>{p.product_name}: {p.qty}</p>)}
      </div>
    </div>
  );
}
