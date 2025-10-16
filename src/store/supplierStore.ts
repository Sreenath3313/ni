import { create } from 'zustand';
import SupplierService, {
  Supplier,
  SupplierDetail,
  Order,
  SupplierFilters,
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
  updateOrderStatus: (
    orderId: number,
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled',
    notes?: string
  ) => Promise<void>;
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
    search: '',
  },

  // ✅ Fetch all suppliers
  fetchSuppliers: async (filters?: SupplierFilters) => {
    set({ loading: true, error: null });
    try {
      const mergedFilters = filters
        ? { ...get().filters, ...filters }
        : get().filters;
      const response = await SupplierService.getAll(mergedFilters);
      set({
        suppliers: response.suppliers || [],
        loading: false,
        filters: mergedFilters,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch suppliers',
        loading: false,
      });
    }
  },

  // ✅ Fetch single supplier details
  fetchSupplierById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const supplier = await SupplierService.getById(id);
      set({ currentSupplier: supplier, loading: false });
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || 'Failed to fetch supplier details',
        loading: false,
      });
    }
  },

  // ✅ Create supplier
  createSupplier: async (supplier: Partial<Supplier>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.create(supplier);
      await get().fetchSuppliers();
      set({ loading: false });
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || 'Failed to create supplier',
        loading: false,
      });
    }
  },

  // ✅ Update supplier
  updateSupplier: async (id: number, supplier: Partial<Supplier>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.update(id, supplier);
      const updatedSuppliers = get().suppliers.map((s) =>
        s.id === id ? { ...s, ...supplier } : s
      );
      set({ suppliers: updatedSuppliers, loading: false });

      if (get().currentSupplier?.id === id) {
        set({
          currentSupplier: { ...get().currentSupplier!, ...supplier },
        });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || 'Failed to update supplier',
        loading: false,
      });
    }
  },

  // ✅ Delete supplier
  deleteSupplier: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.delete(id);
      const updatedSuppliers = get().suppliers.filter((s) => s.id !== id);
      set({ suppliers: updatedSuppliers, loading: false });

      if (get().currentSupplier?.id === id) {
        set({ currentSupplier: null });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || 'Failed to delete supplier',
        loading: false,
      });
    }
  },

  // ✅ Fetch supplier orders
  fetchOrders: async (supplierId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await SupplierService.getOrders(supplierId);
      set({ orders: response.orders || [], loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch orders',
        loading: false,
      });
    }
  },

  // ✅ Create new order for supplier
  createOrder: async (supplierId: number, order: Partial<Order>) => {
    set({ loading: true, error: null });
    try {
      await SupplierService.createOrder(supplierId, order);
      await get().fetchOrders(supplierId);
      set({ loading: false });
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || 'Failed to create order',
        loading: false,
      });
    }
  },

  // ✅ Update order status
  updateOrderStatus: async (
  orderId: number,
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled',
  notes?: string
) => {
  set({ loading: true, error: null });
  try {
    await SupplierService.updateOrderStatus(orderId, { status, notes });

    // ✅ Safely refresh current supplier orders if one is selected
    const currentSupplier = get().currentSupplier;
    if (currentSupplier?.id) {
      await get().fetchOrders(currentSupplier.id);
    }

    set({ loading: false });
  } catch (error: any) {
    set({
      error:
        error.response?.data?.message || 'Failed to update order status',
      loading: false,
    });
  }
  },

  // ✅ Set filters
  setFilters: (filters: Partial<SupplierFilters>) => {
    set({ filters: { ...get().filters, ...filters } });
  },
}));
