import api from './api';

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
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
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
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
  getAll: async (filters?: SupplierFilters): Promise<{ count: number; suppliers: Supplier[] }> => {
    const response = await api.get('/suppliers', { params: filters });
    return response.data;
  },
  
  getById: async (id: number): Promise<SupplierDetail> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
  
  create: async (supplier: Partial<Supplier>): Promise<{ supplier: Supplier }> => {
    const response = await api.post('/suppliers', supplier);
    return response.data;
  },
  
  update: async (id: number, supplier: Partial<Supplier>): Promise<{ supplier: Supplier }> => {
    const response = await api.put(`/suppliers/${id}`, supplier);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
  
  getOrders: async (id: number): Promise<{ count: number; orders: Order[] }> => {
    const response = await api.get(`/suppliers/${id}/orders`);
    return response.data;
  },
  
  createOrder: async (
    id: number, 
    order: { 
      expected_delivery_date?: string; 
      total_amount?: number; 
      notes?: string 
    }
  ): Promise<{ order: Order }> => {
    const response = await api.post(`/suppliers/${id}/orders`, order);
    return response.data;
  },
  
  updateOrderStatus: async (
    orderId: number, 
    data: { 
      status: 'pending' | 'shipped' | 'delivered' | 'cancelled'; 
      notes?: string 
    }
  ): Promise<{ order: Order }> => {
    const response = await api.put(`/suppliers/orders/${orderId}`, data);
    return response.data;
  }
};

export default SupplierService;