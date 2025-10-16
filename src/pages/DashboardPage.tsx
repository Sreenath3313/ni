import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useInventoryStore } from '../store/inventoryStore'
import { useSupplierStore } from '../store/supplierStore'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Search,
  Plus,
  AlertTriangle,
  BarChart3,
  FileText,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react'

// Define the color palette
const palette = {
  primary: '#9E7FFF',
  secondary: '#38bdf8',
  accent: '#f472b6',
  background: '#171717',
  surface: '#262626',
  surfaceLight: '#333333',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  border: '#2F2F2F',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}

// Inventory Item Type
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'in-use' | 'maintenance';
  location: string;
  serial_number: string;
  stock_level: number;
  reorder_point: number;
  supplier: string;
  last_updated: string;
}

// Supplier Type
interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  pendingOrders: number;
}

// Mock inventory data
const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Cisco Router 2900', category: 'Network', status: 'available', location: 'Server Room A', serialNumber: 'CSC29001234', stockLevel: 15, reorderPoint: 5, supplier: 'Cisco Systems', lastUpdated: '2023-10-15' },
  { id: '2', name: 'HP ProLiant Server', category: 'Server', status: 'in-use', location: 'Data Center', serialNumber: 'HPL5678901', stockLevel: 3, reorderPoint: 5, supplier: 'HP Enterprise', lastUpdated: '2023-10-12' },
  { id: '3', name: 'Juniper Switch EX4300', category: 'Network', status: 'maintenance', location: 'Closet 3B', serialNumber: 'JNP4300555', stockLevel: 0, reorderPoint: 2, supplier: 'Juniper Networks', lastUpdated: '2023-09-28' },
  { id: '4', name: 'Dell PowerEdge R740', category: 'Server', status: 'available', location: 'Server Room B', serialNumber: 'DLL7401234', stockLevel: 7, reorderPoint: 3, supplier: 'Dell Technologies', lastUpdated: '2023-10-05' },
  { id: '5', name: 'Ubiquiti Access Point', category: 'Wireless', status: 'in-use', location: 'Office Floor 2', serialNumber: 'UBT8765432', stockLevel: 2, reorderPoint: 5, supplier: 'Ubiquiti Inc.', lastUpdated: '2023-10-10' },
  { id: '6', name: 'Palo Alto Firewall', category: 'Security', status: 'available', location: 'Network Core', serialNumber: 'PA5200789', stockLevel: 4, reorderPoint: 2, supplier: 'Palo Alto Networks', lastUpdated: '2023-10-08' },
];

// Mock suppliers data
const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Cisco Systems', contactPerson: 'John Smith', email: 'john@cisco.com', phone: '555-1234', address: '170 W Tasman Dr, San Jose, CA', status: 'active', pendingOrders: 2 },
  { id: '2', name: 'HP Enterprise', contactPerson: 'Sarah Johnson', email: 'sarah@hpe.com', phone: '555-2345', address: '3000 Hanover St, Palo Alto, CA', status: 'active', pendingOrders: 0 },
  { id: '3', name: 'Juniper Networks', contactPerson: 'Mike Williams', email: 'mike@juniper.net', phone: '555-3456', address: '1133 Innovation Way, Sunnyvale, CA', status: 'inactive', pendingOrders: 1 },
  { id: '4', name: 'Dell Technologies', contactPerson: 'Lisa Brown', email: 'lisa@dell.com', phone: '555-4567', address: '1 Dell Way, Round Rock, TX', status: 'active', pendingOrders: 3 },
];

const DashboardPage: React.FC = () => {
  const { user, role } = useAuthStore()
  const { items: inventory, stats, fetchItems, fetchStats, fetchLowStockItems } = useInventoryStore()
  const { suppliers, fetchSuppliers } = useSupplierStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchItems();
      await fetchSuppliers();
      await fetchStats();
      const lowStock = await fetchLowStockItems();
      setLowStockItems(lowStock || []);
    };
    
    loadData();
  }, [fetchItems, fetchSuppliers, fetchStats, fetchLowStockItems]);
  
  // Filter inventory items based on search query and filters
  const filteredItems = inventory ? inventory.filter(item => {
    // Search query filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    // Stock level filter
    const matchesStock = 
      stockFilter === 'all' || 
      (stockFilter === 'low' && item.stock_level <= item.reorder_point) ||
      (stockFilter === 'out' && item.stock_level === 0) ||
      (stockFilter === 'in' && item.stock_level > 0)
    
    return matchesSearch && matchesStatus && matchesCategory && matchesStock
  }) : []

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    navigate('/auth/login');
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: InventoryItem['status'] }) => {
    let bgColor = ''
    let textColor = palette.text
    
    switch(status) {
      case 'available':
        bgColor = palette.success
        break
      case 'in-use':
        bgColor = palette.warning
        break
      case 'maintenance':
        bgColor = palette.error
        break
    }
    
    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {status}
      </span>
    )
  }
  
  // Stock level badge component
  const StockLevelBadge = ({ stock_level, reorder_point }: { stock_level: number, reorder_point: number }) => {
    let bgColor = ''
    let textColor = palette.text
    let label = ''
    
    if (stock_level === 0) {
      bgColor = palette.error
      label = 'Out of Stock'
    } else if (stock_level <= reorder_point) {
      bgColor = palette.warning
      label = 'Low Stock'
    } else {
      bgColor = palette.success
      label = 'In Stock'
    }
    
    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {label} ({stock_level})
      </span>
    )
  }
  
  // Supplier status badge component
  const SupplierStatusBadge = ({ status, pendingOrders }: { status: Supplier['status'], pendingOrders: number }) => {
    let bgColor = status === 'active' ? palette.success : palette.error
    let textColor = palette.text
    
    return (
      <div className="flex flex-col">
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium mb-1"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {status}
        </span>
        {pendingOrders > 0 && (
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: palette.warning, color: textColor }}
          >
            {pendingOrders} pending orders
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900" style={{ backgroundColor: palette.background, color: palette.text }}>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md"
          style={{ backgroundColor: palette.surface }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ backgroundColor: palette.surface, borderRight: `1px solid ${palette.border}` }}
      >
        <div className="flex items-center justify-center h-16 border-b" style={{ borderColor: palette.border }}>
          <h1 className="text-xl font-bold" style={{ color: palette.primary }}>TIMS</h1>
        </div>
        
        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {[
                { name: 'Dashboard', icon: <LayoutDashboard size={20} />, id: 'dashboard' },
                { name: 'Inventory', icon: <Package size={20} />, id: 'inventory' },
                { name: 'Suppliers', icon: <Users size={20} />, id: 'suppliers' },
                { name: 'Settings', icon: <Settings size={20} />, id: 'settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center w-full px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === item.id ? 'bg-opacity-20' : 'hover:bg-opacity-10'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === item.id ? palette.primary : 'transparent',
                    color: activeTab === item.id ? palette.text : palette.textSecondary,
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                  {activeTab === item.id && (
                    <span className="ml-auto">
                      <ChevronRight size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
          
          <div className="p-4 border-t" style={{ borderColor: palette.border }}>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{session?.user?.email}</p>
                <p className="text-xs" style={{ color: palette.textSecondary }}>{role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm rounded-md hover:bg-opacity-10"
              style={{ color: palette.error }}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center h-16 px-6" style={{ backgroundColor: palette.surface, borderBottom: `1px solid ${palette.border}` }}>
          <h2 className="text-lg font-medium">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'inventory' && 'Inventory Management'}
            {activeTab === 'suppliers' && 'Supplier Management'}
            {activeTab === 'settings' && 'Settings'}
          </h2>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-2">Total Inventory</h3>
                  <p className="text-3xl font-bold" style={{ color: palette.primary }}>{mockInventory.length}</p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-2">Available Items</h3>
                  <p className="text-3xl font-bold" style={{ color: palette.success }}>
                    {mockInventory.filter(item => item.status === 'available').length}
                  </p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-2">Low Stock Alerts</h3>
                  <p className="text-3xl font-bold" style={{ color: palette.warning }}>
                    {lowStockItems.length}
                  </p>
                </div>
              </div>
              
              {/* Low Stock Alerts Section */}
              {lowStockItems.length > 0 && (
                <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <div className="flex items-center mb-4">
                    <AlertTriangle size={20} style={{ color: palette.warning }} className="mr-2" />
                    <h3 className="text-lg font-medium">Low Stock Alerts</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y" style={{ borderColor: palette.border }}>
                      <thead style={{ backgroundColor: palette.surfaceLight }}>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Category</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Reorder Point</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Supplier</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: palette.border }}>
                        {lowStockItems.map((item) => (
                          <tr key={item.id} className="hover:bg-opacity-10 hover:bg-gray-700">
                            <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{item.category}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                    <StockLevelBadge stock_level={item.stock_level} reorder_point={item.reorder_point} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.reorder_point}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{item.supplier}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <button
                                className="px-3 py-1 rounded-md text-xs"
                                style={{ backgroundColor: palette.primary, color: palette.text }}
                              >
                                Reorder
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <div className="flex items-center mb-4">
                    <BarChart3 size={20} className="mr-2" style={{ color: palette.secondary }} />
                    <h3 className="text-lg font-medium">Inventory by Category</h3>
                  </div>
                  <div className="space-y-3">
                    {['Network', 'Server', 'Wireless', 'Security'].map(category => {
                      const count = mockInventory.filter(item => item.category === category).length;
                      const percentage = Math.round((count / mockInventory.length) * 100);
                      
                      return (
                        <div key={category}>
                          <div className="flex justify-between mb-1">
                            <span>{category}</span>
                            <span>{count} items ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ backgroundColor: palette.surfaceLight }}>
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${percentage}%`, 
                                backgroundColor: category === 'Network' ? palette.primary : 
                                                category === 'Server' ? palette.secondary : 
                                                category === 'Wireless' ? palette.accent : 
                                                palette.success 
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-6 rounded-lg" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <div className="flex items-center mb-4">
                    <FileText size={20} className="mr-2" style={{ color: palette.accent }} />
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 mt-2 rounded-full mr-3" style={{ backgroundColor: palette.primary }}></div>
                      <div>
                        <p className="text-sm">New Cisco Router added to inventory</p>
                        <p className="text-xs" style={{ color: palette.textSecondary }}>Today, 10:30 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 mt-2 rounded-full mr-3" style={{ backgroundColor: palette.warning }}></div>
                      <div>
                        <p className="text-sm">HP ProLiant Server stock level updated</p>
                        <p className="text-xs" style={{ color: palette.textSecondary }}>Yesterday, 3:45 PM</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 mt-2 rounded-full mr-3" style={{ backgroundColor: palette.error }}></div>
                      <div>
                        <p className="text-sm">Juniper Switch moved to maintenance</p>
                        <p className="text-xs" style={{ color: palette.textSecondary }}>Oct 15, 2023</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: palette.textSecondary }} />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md focus:outline-none"
                    style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                  />
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <button
                      className="flex items-center px-4 py-2 rounded-md"
                      style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                    >
                      <Filter size={16} className="mr-2" />
                      Filters
                    </button>
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg z-10 hidden"
                      style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
                    >
                      <div className="p-3">
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 rounded-md"
                            style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          >
                            <option value="all">All Statuses</option>
                            <option value="available">Available</option>
                            <option value="in-use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Category</label>
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full p-2 rounded-md"
                            style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          >
                            <option value="all">All Categories</option>
                            <option value="Network">Network</option>
                            <option value="Server">Server</option>
                            <option value="Wireless">Wireless</option>
                            <option value="Security">Security</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Stock Level</label>
                          <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="w-full p-2 rounded-md"
                            style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          >
                            <option value="all">All Stock Levels</option>
                            <option value="in">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center px-4 py-2 rounded-md"
                    style={{ backgroundColor: palette.primary, color: palette.text }}
                    onClick={() => {
                      setSelectedItem(null);
                      setShowItemModal(true);
                    }}
                  >
                    <Plus size={18} className="mr-2" />
                    Add New Item
                  </button>
                  <button
                    className="flex items-center px-4 py-2 rounded-md"
                    style={{ backgroundColor: palette.secondary, color: palette.text }}
                  >
                    <Download size={18} className="mr-2" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${palette.border}` }}>
                <table className="min-w-full divide-y" style={{ borderColor: palette.border }}>
                  <thead style={{ backgroundColor: palette.surface }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Stock Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: palette.border }}>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-opacity-10 hover:bg-gray-700 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StockLevelBadge stockLevel={item.stockLevel} reorderPoint={item.reorderPoint} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                className="p-1 rounded-md"
                                style={{ backgroundColor: palette.surfaceLight }}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowItemModal(true);
                                }}
                              >
                                <Edit size={16} style={{ color: palette.secondary }} />
                              </button>
                              <button
                                className="p-1 rounded-md"
                                style={{ backgroundColor: palette.surfaceLight }}
                              >
                                <Trash2 size={16} style={{ color: palette.error }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center" style={{ color: palette.textSecondary }}>
                          No items found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Item Modal */}
              {showItemModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <div className="w-full max-w-2xl rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-medium">{selectedItem ? 'Edit Item' : 'Add New Item'}</h3>
                      <button
                        className="p-1 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight }}
                        onClick={() => setShowItemModal(false)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.name || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.category || ''}
                        >
                          <option value="">Select Category</option>
                          <option value="Network">Network</option>
                          <option value="Server">Server</option>
                          <option value="Wireless">Wireless</option>
                          <option value="Security">Security</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.status || ''}
                        >
                          <option value="">Select Status</option>
                          <option value="available">Available</option>
                          <option value="in-use">In Use</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input
                          type="text"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.location || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Serial Number</label>
                        <input
                          type="text"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.serial_number || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Supplier</label>
                        <select
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.supplier || ''}
                        >
                          <option value="">Select Supplier</option>
                          {mockSuppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Stock Level</label>
                        <input
                          type="number"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.stock_level || 0}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Reorder Point</label>
                        <input
                          type="number"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedItem?.reorder_point || 0}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        className="px-4 py-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text }}
                        onClick={() => setShowItemModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-md"
                        style={{ backgroundColor: palette.primary, color: palette.text }}
                        onClick={() => setShowItemModal(false)}
                      >
                        {selectedItem ? 'Update Item' : 'Add Item'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'suppliers' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: palette.textSecondary }} />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md focus:outline-none"
                    style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                  />
                </div>
                <button
                  className="flex items-center px-4 py-2 rounded-md"
                  style={{ backgroundColor: palette.primary, color: palette.text }}
                  onClick={() => {
                    setSelectedSupplier(null);
                    setShowSupplierModal(true);
                  }}
                >
                  <Plus size={18} className="mr-2" />
                  Add New Supplier
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${palette.border}` }}>
                <table className="min-w-full divide-y" style={{ borderColor: palette.border }}>
                  <thead style={{ backgroundColor: palette.surface }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Contact Person</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: palette.border }}>
                    {mockSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-opacity-10 hover:bg-gray-700 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{supplier.contact_person}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{supplier.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{supplier.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <SupplierStatusBadge status={supplier.status} pendingOrders={supplier.pendingOrders} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              className="p-1 rounded-md"
                              style={{ backgroundColor: palette.surfaceLight }}
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setShowSupplierModal(true);
                              }}
                            >
                              <Edit size={16} style={{ color: palette.secondary }} />
                            </button>
                            <button
                              className="p-1 rounded-md"
                              style={{ backgroundColor: palette.surfaceLight }}
                            >
                              <Trash2 size={16} style={{ color: palette.error }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Supplier Modal */}
              {showSupplierModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <div className="w-full max-w-2xl rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-medium">{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                      <button
                        className="p-1 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight }}
                        onClick={() => setShowSupplierModal(false)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.name || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                        <input
                          type="text"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.contact_person || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.email || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="tel"
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.phone || ''}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.address || ''}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          className="w-full p-2 rounded-md"
                          style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                          defaultValue={selectedSupplier?.status || 'active'}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        className="px-4 py-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text }}
                        onClick={() => setShowSupplierModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-md"
                        style={{ backgroundColor: palette.primary, color: palette.text }}
                        onClick={() => setShowSupplierModal(false)}
                      >
                        {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-4">User Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                        defaultValue="Admin User"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                        defaultValue={session?.user?.email}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role</label>
                      <select
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                        defaultValue={role ?? undefined}
                        disabled
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <button
                      className="w-full px-4 py-2 rounded-md mt-2"
                      style={{ backgroundColor: palette.primary, color: palette.text }}
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
                
                <div className="rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Password</label>
                      <input
                        type="password"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                      />
                    </div>
                    <button
                      className="w-full px-4 py-2 rounded-md mt-2"
                      style={{ backgroundColor: palette.primary, color: palette.text }}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div className="rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Low Stock Alerts</span>
                      <div className="relative inline-block w-12 h-6 rounded-full" style={{ backgroundColor: palette.surfaceLight }}>
                        <input type="checkbox" id="lowStockToggle" className="sr-only" defaultChecked />
                        <span className="block absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6" style={{ backgroundColor: palette.primary }}></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Order Status Updates</span>
                      <div className="relative inline-block w-12 h-6 rounded-full" style={{ backgroundColor: palette.surfaceLight }}>
                        <input type="checkbox" id="orderStatusToggle" className="sr-only" defaultChecked />
                        <span className="block absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6" style={{ backgroundColor: palette.primary }}></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>System Notifications</span>
                      <div className="relative inline-block w-12 h-6 rounded-full" style={{ backgroundColor: palette.surfaceLight }}>
                        <input type="checkbox" id="systemNotifToggle" className="sr-only" defaultChecked />
                        <span className="block absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6" style={{ backgroundColor: palette.primary }}></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg p-6" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <h3 className="text-lg font-medium mb-4">System Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Default Low Stock Threshold (%)</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                        defaultValue="20"
                        min="1"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Data Export Format</label>
                      <select
                        className="w-full p-2 rounded-md"
                        style={{ backgroundColor: palette.surfaceLight, color: palette.text, border: `1px solid ${palette.border}` }}
                        defaultValue="csv"
                      >
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <button
                      className="w-full px-4 py-2 rounded-md mt-2"
                      style={{ backgroundColor: palette.primary, color: palette.text }}
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
