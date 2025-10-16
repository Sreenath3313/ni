import { supabase } from "@/lib/supabaseClient"; // adjust path if needed

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive" | "pending";
  pending_orders?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierDetail extends Supplier {
  inventory_items?: any[];
  orders?: Order[];
}

export interface Order {
  id: number;
  supplier_id: number;
  order_date: string;
  expected_delivery_date?: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  total_amount?: number;
  user_id?: number;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierFilters {
  status?: string;
  search?: string;
}

const SupplierService = {
  /** Get all suppliers with optional filters */
  getAll: async (filters?: SupplierFilters): Promise<{ count: number; suppliers: Supplier[] }> => {
    let query = supabase.from("suppliers").select("*", { count: "exact" });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { count: count || 0, suppliers: data || [] };
  },

  /** Get supplier by ID, including orders and inventory */
  getById: async (id: number): Promise<SupplierDetail> => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*, orders(*), inventory_items(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /** Create a new supplier */
  create: async (supplier: Partial<Supplier>): Promise<{ supplier: Supplier }> => {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return { supplier: data };
  },

  /** Update an existing supplier */
  update: async (id: number, supplier: Partial<Supplier>): Promise<{ supplier: Supplier }> => {
    const { data, error } = await supabase
      .from("suppliers")
      .update(supplier)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { supplier: data };
  },

  /** Delete a supplier */
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
  },

  /** Get all orders for a supplier */
  getOrders: async (supplierId: number): Promise<{ count: number; orders: Order[] }> => {
    const { data, count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("supplier_id", supplierId);

    if (error) throw error;
    return { count: count || 0, orders: data || [] };
  },

  /** Create a new order for a supplier */
  createOrder: async (
    supplierId: number,
    order: {
      expected_delivery_date?: string;
      total_amount?: number;
      notes?: string;
    }
  ): Promise<{ order: Order }> => {
    const newOrder = {
      ...order,
      supplier_id: supplierId,
      order_date: new Date().toISOString(),
      status: "pending" as const,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;
    return { order: data };
  },

  /** Update order status */
  updateOrderStatus: async (
    orderId: number,
    data: {
      status: "pending" | "shipped" | "delivered" | "cancelled";
      notes?: string;
    }
  ): Promise<{ order: Order }> => {
    const { data: updated, error } = await supabase
      .from("orders")
      .update(data)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return { order: updated };
  },
};

export default SupplierService;
