import api from './api';

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  description?: string;
  serial_number?: string;
  location?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
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
  transaction_type: 'purchase' | 'sale' | 'return' | 'adjustment';
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
  getAll: async (filters?: InventoryFilters): Promise<{ count: number; items: InventoryItem[] }> => {
    const response = await api.get('/inventory', { params: filters });
    return response.data;
  },
  
  getById: async (id: number): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  create: async (item: Partial<InventoryItem>): Promise<{ item: InventoryItem }> => {
    const response = await api.post('/inventory', item);
    return response.data;
  },
  
  update: async (id: number, item: Partial<InventoryItem>): Promise<{ item: InventoryItem }> => {
    const response = await api.put(`/inventory/${id}`, item);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },
  
  getTransactions: async (id: number): Promise<{ count: number; transactions: InventoryTransaction[] }> => {
    const response = await api.get(`/inventory/${id}/transactions`);
    return response.data;
  },
  
  addTransaction: async (
    id: number, 
    transaction: { 
      transaction_type: string; 
      quantity: number; 
      notes?: string 
    }
  ): Promise<{ transaction: InventoryTransaction; new_stock_level: number }> => {
    const response = await api.post(`/inventory/${id}/transactions`, transaction);
    return response.data;
  },
  
  getStats: async (): Promise<InventoryStats> => {
    const response = await api.get('/inventory/stats/overview');
    return response.data;
  },
  
  getLowStockItems: async (): Promise<{ count: number; items: InventoryItem[] }> => {
    const response = await api.get('/inventory', { params: { low_stock: true } });
    return response.data;
  }
};

export default InventoryService;