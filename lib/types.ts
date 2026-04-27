export type PaymentMethod = "dinheiro" | "cartao" | "pix";
export type OrderStatus = "novo" | "preparo" | "entrega" | "finalizado";

export interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  active: boolean;
  categories?: Category;
}

export interface DeliveryZone {
  id: string;
  neighborhood: string;
  fee: number;
  active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
