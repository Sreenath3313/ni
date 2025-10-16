import { create } from 'zustand';
import InventoryService, { 
  InventoryItem, 
  InventoryTransaction,
  InventoryStats,
  InventoryFilters
} from '../services/inventory.service';

interface InventoryState {
  items: InventoryItem[];
  currentItem: InventoryItem | null;
  transactions: InventoryTransaction[];
  stats: InventoryStats | null;
  loading: boolean;
  error: string | null;
  filters: InventoryFilters;
  
  // Actions
  fetchItems: (filters?: InventoryFilters) => Promise<void>;
  fetchItemById: (id: number) => Promise<void>;
  createItem: (item: Partial<InventoryItem>) => Promise<void>;
  updateItem: (id: number, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  fetchTransactions: (itemId: number) => Promise<void>;
  addTransaction: (itemId: number, transaction: Partial<InventoryTransaction>) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchLowStockItems: () => Promise<InventoryItem[]>;
  setFilters: (filters: Partial<InventoryFilters>) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  currentItem: null,
  transactions: [],
  stats: null,
  loading: false,
  error: null,
  filters: {
    category: '',
    status: '',
    search: '',
    lowStock: false
  },
  
  fetchItems: async (filters?: InventoryFilters) => {
    set({ loading: true, error: null });
    try {
      const mergedFilters = filters ? { ...get().filters, ...filters } : get().filters;
      const items = await InventoryService.getAllItems(mergedFilters);
      set({ items, loading: false, filters: mergedFilters });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch inventory items', 
        loading: false 
      });
    }
  },
  
  fetchItemById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const item = await InventoryService.getItemById(id);
      set({ currentItem: item, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch inventory item', 
        loading: false 
      });
    }
  },
  
  createItem: async (item: Partial<InventoryItem>) => {
    set({ loading: true, error: null });
    try {
      await InventoryService.createItem(item);
      // Refresh the list after creating
      await get().fetchItems();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create inventory item', 
        loading: false 
      });
    }
  },
  
  updateItem: async (id: number, item: Partial<InventoryItem>) => {
    set({ loading: true, error: null });
    try {
      await InventoryService.updateItem(id, item);
      // Update the item in the list
      const updatedItems = get().items.map(i => 
        i.id === id ? { ...i, ...item } : i
      );
      set({ items: updatedItems, loading: false });
      
      // If this is the current item, update it too
      if (get().currentItem?.id === id) {
        set({ currentItem: { ...get().currentItem, ...item } });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update inventory item', 
        loading: false 
      });
    }
  },
  
  deleteItem: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await InventoryService.deleteItem(id);
      // Remove the item from the list
      const updatedItems = get().items.filter(i => i.id !== id);
      set({ items: updatedItems, loading: false });
      
      // If this is the current item, clear it
      if (get().currentItem?.id === id) {
        set({ currentItem: null });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete inventory item', 
        loading: false 
      });
    }
  },
  
  fetchTransactions: async (itemId: number) => {
    set({ loading: true, error: null });
    try {
      const transactions = await InventoryService.getTransactions(itemId);
      set({ transactions, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch transactions', 
        loading: false 
      });
    }
  },
  
  addTransaction: async (itemId: number, transaction: Partial<InventoryTransaction>) => {
    set({ loading: true, error: null });
    try {
      await InventoryService.addTransaction(itemId, transaction);
      // Refresh transactions and item details
      await get().fetchTransactions(itemId);
      await get().fetchItemById(itemId);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to add transaction', 
        loading: false 
      });
    }
  },
  
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await InventoryService.getStats();
      set({ stats, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch inventory statistics', 
        loading: false 
      });
    }
  },
  
  fetchLowStockItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await InventoryService.getLowStockItems();
      set({ loading: false });
      return items;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch low stock items', 
        loading: false 
      });
      return [];
    }
  },
  
  setFilters: (filters: Partial<InventoryFilters>) => {
    set({ filters: { ...get().filters, ...filters } });
  }
}));