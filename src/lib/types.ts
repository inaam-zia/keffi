export type MenuCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image_url: string | null;
  created_at: string;
  name_hi?: string | null;
  description_hi?: string | null;
  is_veg?: boolean;
  is_jain?: boolean;
  allergens?: string | null;
};

export type CafeTable = {
  id: string;
  table_number: number;
  enabled: boolean;
  /** Optional friendly name shown in admin (e.g. "Patio", "Window") */
  label?: string | null;
  notes?: string | null;
  session_id?: string;
  /** When set, scan URL must include ?t= this value or the QR is rejected */
  qr_token?: string | null;
  created_at: string;
};

export type OrderStatus = "new" | "preparing" | "served" | "cancelled";

export type OrderType = "dine_in" | "takeaway";

export type Order = {
  id: string;
  table_number: number;
  /** Joined from cafe_tables when available */
  table_label?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  notes?: string | null;
  order_type?: OrderType | null;
  coupon_code?: string | null;
  discount?: number | null;
  loyalty_redeemed?: number | null;
  payment_method?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  notes?: string | null;
  spice_level?: string | null;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export type CartItem = {
  lineId: string;
  kind: "menu" | "offer";
  menuItemId?: string;
  offerId?: string;
  name: string;
  price: number;
  quantity: number;
  /** Human-readable combo contents for cart display */
  includes?: string;
  notes?: string;
  spiceLevel?: string;
};

export type OfferItem = {
  id: string;
  offer_id: string;
  menu_item_id: string;
  quantity: number;
  menu_item?: Pick<MenuItem, "id" | "name" | "price" | "available" | "image_url">;
};

export type Offer = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  offer_items: OfferItem[];
};

export type PlaceOrderPayload = {
  tableNumber: number;
  customerName: string;
  customerPhone: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    spiceLevel?: string;
  }[];
  offers?: { offerId: string; quantity: number }[];
  couponCode?: string;
  loyaltyRedeem?: number;
  orderType?: OrderType;
  notes?: string;
};

export type TableRequest = {
  id: string;
  table_number: number;
  kind: "waiter" | "bill";
  status: "open" | "done";
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  min_order: number;
  active: boolean;
  created_at: string;
};

export type Reservation = {
  id: string;
  guest_name: string;
  phone: string;
  party_size: number;
  reserved_for: string;
  notes: string;
  status: "pending" | "seated" | "cancelled" | "completed";
  created_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity_needed: number;
  inventory_item?: Pick<
    InventoryItem,
    "id" | "name" | "unit" | "quantity" | "low_stock_threshold"
  >;
};

export type Recipe = {
  id: string;
  menu_item_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
  menu_item?: Pick<MenuItem, "id" | "name" | "price" | "available" | "image_url">;
  ingredients: RecipeIngredient[];
};
