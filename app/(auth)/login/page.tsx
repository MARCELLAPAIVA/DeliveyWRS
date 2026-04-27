"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setLoading(false);
        return alert(error.message);
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          address,
          neighborhood
        });
      }

      setLoading(false);
      alert("Cadastro realizado. Confirme seu e-mail se o Supabase exigir confirmação.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    router.push("/");
  };

  return (
    <main className="container" style={{ maxWidth: 520, padding: "4rem 0" }}>
      <div className="card" style={{ padding: "1.5rem" }}>
        <h1>{isSignup ? "Criar conta" : "Entrar"}</h1>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: 10 }}>
          {isSignup && (
            <>
              <label>Nome completo<input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
              <label>Telefone<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
              <label>Endereço completo<input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required /></label>
              <label>Bairro<input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required /></label>
            </>
          )}
          <label>Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>{loading ? "Aguarde..." : isSignup ? "Criar conta" : "Entrar"}</button>
        </form>
        <button className="btn btn-light" style={{ width: "100%", marginTop: "0.8rem" }} onClick={() => setIsSignup((prev) => !prev)}>
          {isSignup ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      </div>
    </main>
  );
}
