import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/supabase/server";

const createOrderSchema = z.object({
  address: z.string().min(5),
  notes: z.string().optional(),
  paymentMethod: z.enum(["dinheiro", "cartao", "pix"]),
  changeFor: z.number().nullable().optional(),
  zoneId: z.string().uuid(),
  profileName: z.string().min(2),
  phone: z.string().min(8),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rawBody = await request.json();
  const parsed = createOrderSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const body = parsed.data;

  const [{ data: zone }, { data: products }] = await Promise.all([
    supabase.from("delivery_zones").select("id, neighborhood, fee").eq("id", body.zoneId).single(),
    supabase.from("products").select("id, name, price").in("id", body.items.map((i) => i.productId))
  ]);

  if (!zone) return NextResponse.json({ error: "Bairro inválido" }, { status: 400 });
  if (!products || products.length !== body.items.length) return NextResponse.json({ error: "Produtos inválidos" }, { status: 400 });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const subtotal = body.items.reduce((acc, item) => acc + Number(productMap.get(item.productId)?.price || 0) * item.quantity, 0);
  const total = subtotal + Number(zone.fee);

  await supabase.from("profiles").upsert({
    id: auth.user.id,
    full_name: body.profileName,
    phone: body.phone,
    address: body.address,
    neighborhood: zone.neighborhood
  });

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: auth.user.id,
      delivery_zone_id: body.zoneId,
      address: body.address,
      notes: body.notes,
      status: "novo",
      payment_method: body.paymentMethod,
      change_for: body.paymentMethod === "dinheiro" ? body.changeFor ?? null : null,
      subtotal,
      delivery_fee: zone.fee,
      total
    })
    .select("id")
    .single();

  if (error || !order) return NextResponse.json({ error: error?.message || "Erro ao criar pedido" }, { status: 400 });

  const orderItems = body.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: product.price,
      total_price: Number(product.price) * item.quantity
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  return NextResponse.json({ orderId: order.id, subtotal, deliveryFee: zone.fee, total });
}
