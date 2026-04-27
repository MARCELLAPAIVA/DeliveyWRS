import { createServerSupabase } from "@/supabase/server";

export default async function AdminDashboard() {
  const supabase = createServerSupabase();
  const [{ count: totalOrders }, { count: totalProducts }, { count: totalClients }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true })
  ]);

  return (
    <div className="grid grid-3">
      <article className="card" style={{ padding: "1rem" }}><h3>Pedidos</h3><strong>{totalOrders ?? 0}</strong></article>
      <article className="card" style={{ padding: "1rem" }}><h3>Produtos</h3><strong>{totalProducts ?? 0}</strong></article>
      <article className="card" style={{ padding: "1rem" }}><h3>Clientes</h3><strong>{totalClients ?? 0}</strong></article>
    </div>
  );
}
