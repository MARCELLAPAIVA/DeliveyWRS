import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/categories", label: "Categorias" },
  { href: "/admin/delivery-zones", label: "Entrega" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/reports", label: "Relatórios" },
  { href: "/admin/settings", label: "Configurações" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, padding: "1rem 0 2rem" }}>
      <aside className="card" style={{ padding: "0.8rem", height: "fit-content" }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{ display: "block", padding: "0.5rem 0" }}>{l.label}</Link>
        ))}
      </aside>
      <section>{children}</section>
    </div>
  );
}
