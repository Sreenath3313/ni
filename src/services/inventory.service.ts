import { supabase } from "@/lib/supabaseClient";

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  description?: string;
  serial_number?: string;
  location?: string;
  status: "available" | "in_use" | "maintenance" | "retired";
  stock_level: number;
  reorder_point: number;
  supplier_id?: number;
  supplier_name?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  transaction_type: "purchase" | "sale" | "return" | "adjustment";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  user_id?: number;
  user_name?: string;
  notes?: string;
  transaction_date: string;
}

export interface InventoryStats {
  total_items: number;
  low_stock_count: number;
  total_stock: number;
  by_category: { category: string; count: number }[];
}

export interface InventoryFilters {
  category?: string;
  status?: string;
  search?: string;
  low_stock?: boolean;
}

const InventoryService = {
  /** Fetch all inventory items with optional filters */
  getAll: async (
    filters?: InventoryFilters
  ): Promise<{ count: number; items: InventoryItem[] }> => {
    let query = supabase.from("inventory").select("*", { count: "exact" });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`
      );
    }
    if (filters?.low_stock) {
      query = query.lte("stock_level", supabase.rpc("reorder_point"));
    }

    const { data, count, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    return { count: count || 0, items: data || [] };
  },

  /** Fetch a single item by ID */
  getById: async (id: number): Promise<InventoryItem> => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /** Create a new inventory item */
  create: async (item: Partial<InventoryItem>): Promise<{ item: InventoryItem }> => {
    const { data, error } = await supabase
      .from("inventory")
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return { item: data };
  },

  /** Update existing inventory item */
  update: async (
    id: number,
    item: Partial<InventoryItem>
  ): Promise<{ item: InventoryItem }> => {
    const { data, error } = await supabase
      .from("inventory")
      .update(item)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { item: data };
  },

  /** Delete an inventory item */
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) throw error;
  },

  /** Get all transactions for a specific inventory item */
  getTransactions: async (
    itemId: number
  ): Promise<{ count: number; transactions: InventoryTransaction[] }> => {
    const { data, count, error } = await supabase
      .from("inventory_transactions")
      .select("*", { count: "exact" })
      .eq("inventory_id", itemId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return { count: count || 0, transactions: data || [] };
  },

  /** Add a new transaction (adjust stock levels) */
  addTransaction: async (
    itemId: number,
    transaction: {
      transaction_type: "purchase" | "sale" | "return" | "adjustment";
      quantity: number;
      notes?: string;
    }
  ): Promise<{ transaction: InventoryTransaction; new_stock_level: number }> => {
    // Fetch current stock
    const { data: item, error: fetchError } = await supabase
      .from("inventory")
      .select("stock_level")
      .eq("id", itemId)
      .single();
    if (fetchError) throw fetchError;

    const prevStock = item.stock_level;
    let newStock = prevStock;

    switch (transaction.transaction_type) {
      case "purchase":
      case "return":
        newStock += transaction.quantity;
        break;
      case "sale":
        newStock -= transaction.quantity;
        break;
      case "adjustment":
        newStock = transaction.quantity; // manual adjustment
        break;
    }

    // Update inventory stock
    const { error: updateError } = await supabase
      .from("inventory")
      .update({ stock_level: newStock })
      .eq("id", itemId);
    if (updateError) throw updateError;

    // Add transaction record
    const { data: newTx, error: txError } = await supabase
      .from("inventory_transactions")
      .insert({
        inventory_id: itemId,
        transaction_type: transaction.transaction_type,
        quantity: transaction.quantity,
        previous_stock: prevStock,
        new_stock: newStock,
        notes: transaction.notes,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (txError) throw txError;

    return { transaction: newTx, new_stock_level: newStock };
  },

  /** Get dashboard statistics */
  getStats: async (): Promise<InventoryStats> => {
    const { data, error } = await supabase.from("inventory").select("*");
    if (error) throw error;

    const total_items = data.length;
    const total_stock = data.reduce((sum, i) => sum + i.stock_level, 0);
    const low_stock_count = data.filter(
      (i) => i.stock_level <= i.reorder_point
    ).length;

    const by_category = Object.entries(
      data.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({ category, count }));

    return { total_items, total_stock, low_stock_count, by_category };
  },

  /** Fetch items with low stock */
  getLowStockItems: async (): Promise<{ count: number; items: InventoryItem[] }> => {
    const { data, count, error } = await supabase
      .from("inventory")
      .select("*", { count: "exact" })
      .lte("stock_level", supabase.rpc("reorder_point"));

    if (error) throw error;
    return { count: count || 0, items: data || [] };
  },
};

export default InventoryService;
