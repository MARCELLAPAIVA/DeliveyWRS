import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/supabase/server";

const schema = z.object({
  lines: z.array(z.string()).min(1)
});

const moneyRegex = /([0-9]+[\.,][0-9]{2})/;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", auth.user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  let currentCategory = "Geral";
  let inserted = 0;

  for (const line of body.data.lines) {
    const clean = line.trim();
    if (!clean) continue;

    if (clean.endsWith(":")) {
      currentCategory = clean.replace(":", "").trim();
      await supabase.from("categories").upsert({ name: currentCategory, active: true }, { onConflict: "name" });
      continue;
    }

    const match = clean.match(moneyRegex);
    if (!match) continue;

    const rawPrice = match[1].replace(".", "").replace(",", ".");
    const price = Number(rawPrice);
    const name = clean.replace(match[1], "").replace(/[-–—]$/, "").trim();

    const { data: category } = await supabase.from("categories").select("id").eq("name", currentCategory).single();
    if (!category?.id || !name || Number.isNaN(price)) continue;

    await supabase.from("products").insert({
      category_id: category.id,
      name,
      description: "Importado via PDF",
      price,
      active: true
    });
    inserted += 1;
  }

  return NextResponse.json({ inserted });
}
