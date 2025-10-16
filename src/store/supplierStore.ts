import { create } from 'zustand';
import SupplierService, { 
  Supplier, 
  SupplierDetail,
  Order,
  SupplierFilters
} from '../services/supplier.service';

interface SupplierState {
  suppliers: Supplier[];
  currentSupplier: SupplierDetail | null;
  orders: Order[];
  loading: boolean;
  error: string | null;
  filters: SupplierFilters;
  
  // Actions
  fetchSuppliers: (filters?: SupplierFilters) => Promise<void>;
  fetchSupplierById: (id: number) => Promise<void>;
  createSupplier: (supplier: Partial<Supplier>) => Promise<void>;
  updateSupplier: (id: number, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
  fetchOrders: (supplierId: number) => Promise<void>;
  createOrder: (supplierId: number, order: Partial<Order>) => Promise<void>;
  updateOrderStatus: (supplierId: number, orderId: number, status: string) => Promise<void>;
  setFilters: (filters: Partial<SupplierFilters>) => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  currentSupplier: null,
  orders: [],
  loading: false,
  error: null,
  filters: {
    status: '',
    search: ''
  },
  
  fetchSuppliers: async (filters?: SupplierFilters) => {
    set({ loading: true, error: null });
    try {
      const mergedFilters = filters ? { ...get().filters, ...filters } : get().filters;
      const suppliers = await SupplierService.getAllSuppliers(mergedFilters);
      set({ suppliers, loading: false, filters: mergedFilters });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch suppliers', 
        loading: false 
      });
    }
  },
  
  fetchSupplierById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const supplier = await SupplierService.getSupplierById(id);
      set({ currentSupplier: supplier, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch supplier details', 
        loading: false 
      });
    }
  },
  
  createSupplier: async (supplier: Partial<Supplier>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.createSupplier(supplier);
      // Refresh the list after creating
      await get().fetchSuppliers();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create supplier', 
        loading: false 
      });
    }
  },
  
  updateSupplier: async (id: number, supplier: Partial<Supplier>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.updateSupplier(id, supplier);
      // Update the supplier in the list
      const updatedSuppliers = get().suppliers.map(s => 
        s.id === id ? { ...s, ...supplier } : s
      );
      set({ suppliers: updatedSuppliers, loading: false });
      
      // If this is the current supplier, update it too
      if (get().currentSupplier?.id === id) {
        set({ currentSupplier: { ...get().currentSupplier, ...supplier } });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update supplier', 
        loading: false 
      });
    }
  },
  
  deleteSupplier: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.deleteSupplier(id);
      // Remove the supplier from the list
      const updatedSuppliers = get().suppliers.filter(s => s.id !== id);
      set({ suppliers: updatedSuppliers, loading: false });
      
      // If this is the current supplier, clear it
      if (get().currentSupplier?.id === id) {
        set({ currentSupplier: null });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete supplier', 
        loading: false 
      });
    }
  },
  
  fetchOrders: async (supplierId: number) => {
    set({ loading: true, error: null });
    try {
      const orders = await SupplierService.getOrders(supplierId);
      set({ orders, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch orders', 
        loading: false 
      });
    }
  },
  
  createOrder: async (supplierId: number, order: Partial<Order>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.createOrder(supplierId, order);
      // Refresh orders
      await get().fetchOrders(supplierId);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create order', 
        loading: false 
      });
    }
  },
  
  updateOrderStatus: async (supplierId: number, orderId: number, status: string) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.updateOrderStatus(supplierId, orderId, status);
      // Refresh orders
      await get().fetchOrders(supplierId);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update order status', 
        loading: false 
      });
    }
  },
  
  setFilters: (filters: Partial<SupplierFilters>) => {
    set({ filters: { ...get().filters, ...filters } });
  }
}));