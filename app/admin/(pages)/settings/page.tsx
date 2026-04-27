"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

export default function AdminSettings() {
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("5521985529198");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).single();
      if (!data) return;
      setStoreName(data.store_name ?? "");
      setLogoUrl(data.logo_url ?? "");
      setWhatsapp(data.whatsapp ?? "");
    };
    load();
  }, []);

  const uploadLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `branding/logo.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
  };

  const save = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("settings").upsert({ id: 1, store_name: storeName, logo_url: logoUrl, whatsapp, updated_by: auth.user.id });
    alert("Configurações salvas");
  };

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <h2>Configurações da loja</h2>
      <label>Nome da loja<input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} /></label>
      <label>Logo URL<input className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></label>
      <input type="file" accept="image/*" onChange={uploadLogo} />
      <label>WhatsApp<input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></label>
      <button className="btn btn-primary" onClick={save}>Salvar</button>
    </div>
  );
}
