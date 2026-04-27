import Link from "next/link";
import { CartProvider } from "@/context/cart-context";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0" }}>
          <Link href="/">Delivery WRS</Link>
          <Link href="/admin" className="btn btn-light">Painel Admin</Link>
        </div>
      </header>
      <main className="container" style={{ padding: "1rem 0 2rem" }}>{children}</main>
    </CartProvider>
  );
}
