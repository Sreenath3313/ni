import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useInventoryStore } from "../store/inventoryStore";
import { useSupplierStore } from "../store/supplierStore";
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
  Filter,
} from "lucide-react";

// 🎨 Color palette
const palette = {
  primary: "#9E7FFF",
  secondary: "#38bdf8",
  accent: "#f472b6",
  background: "#171717",
  surface: "#262626",
  surfaceLight: "#333333",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  border: "#2F2F2F",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

// 🧩 Inventory Item Type
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: "available" | "in-use" | "maintenance";
  location: string;
  serial_number: string;
  stock_level: number;
  reorder_point: number;
  supplier: string;
  last_updated: string;
}

// 🧩 Supplier Type
interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  pending_orders: number;
}

// 📦 Mock Inventory
const mockInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Cisco Router 2900",
    category: "Network",
    status: "available",
    location: "Server Room A",
     serial_number: "CSC29001234",
     stock_level: 15,
     reorder_point: 5,
    supplier: "Cisco Systems",
     last_updated: "2023-10-15",
  },
  {
    id: "2",
    name: "HP ProLiant Server",
    category: "Server",
    status: "in-use",
    location: "Data Center",
     serial_number: "HPL5678901",
     stock_level: 3,
     reorder_point: 5,
    supplier: "HP Enterprise",
     last_updated: "2023-10-12",
  },
  {
    id: "3",
    name: "Juniper Switch EX4300",
    category: "Network",
    status: "maintenance",
    location: "Closet 3B",
     serial_number: "JNP4300555",
     stock_level: 0,
     reorder_point: 2,
    supplier: "Juniper Networks",
     last_updated: "2023-09-28",
  },
  {
    id: "4",
    name: "Dell PowerEdge R740",
    category: "Server",
    status: "available",
    location: "Server Room B",
     serial_number: "DLL7401234",
     stock_level: 7,
     reorder_point: 3,
    supplier: "Dell Technologies",
     last_updated: "2023-10-05",
  },
  {
    id: "5",
    name: "Ubiquiti Access Point",
    category: "Wireless",
    status: "in-use",
    location: "Office Floor 2",
     serial_number: "UBT8765432",
     stock_level: 2,
     reorder_point: 5,
    supplier: "Ubiquiti Inc.",
     last_updated: "2023-10-10",
  },
  {
    id: "6",
    name: "Palo Alto Firewall",
    category: "Security",
    status: "available",
    location: "Network Core",
     serial_number: "PA5200789",
     stock_level: 4,
     reorder_point: 2,
    supplier: "Palo Alto Networks",
     last_updated: "2023-10-08",
  },
];

// 📦 Mock Suppliers
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Cisco Systems",
    contact_person: "John Smith",
    email: "john@cisco.com",
    phone: "555-1234",
    address: "170 W Tasman Dr, San Jose, CA",
    status: "active",
    pending_orders: 2,
  },
  {
    id: "2",
    name: "HP Enterprise",
    contact_person: "Sarah Johnson",
    email: "sarah@hpe.com",
    phone: "555-2345",
    address: "3000 Hanover St, Palo Alto, CA",
    status: "active",
    pending_orders: 0,
  },
  {
    id: "3",
    name: "Juniper Networks",
    contact_person: "Mike Williams",
    email: "mike@juniper.net",
    phone: "555-3456",
    address: "1133 Innovation Way, Sunnyvale, CA",
    status: "inactive",
    pending_orders: 1,
  },
  {
    id: "4",
    name: "Dell Technologies",
    contact_person: "Lisa Brown",
    email: "lisa@dell.com",
    phone: "555-4567",
    address: "1 Dell Way, Round Rock, TX",
    status: "active",
    pending_orders: 3,
  },
];

const DashboardPage: React.FC = () => {
  const { user, role, logout } = useAuthStore();
  const { fetchItems, fetchStats, fetchLowStockItems } = useInventoryStore();
  const { fetchSuppliers } = useSupplierStore();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
  await fetchItems();
  await fetchSuppliers();
  await fetchStats();
  await fetchLowStockItems(); // call it if it updates store internally
  setLowStockItems(
mockInventory.filter((item) => item.stock_level <= item.reorder_point)
  );
    };
    loadData();
  }, [fetchItems, fetchSuppliers, fetchStats, fetchLowStockItems]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  // Status badge
  const StatusBadge = ({ status }: { status: InventoryItem["status"] }) => {
    const colors = {
      available: palette.success,
      "in-use": palette.warning,
      maintenance: palette.error,
    };
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors[status], color: palette.text }}
      >
        {status}
      </span>
    );
  };

  // Stock level badge
  const StockLevelBadge = ({
    stock_level,
    reorder_point,
  }: {
    stock_level: number;
    reorder_point: number;
  }) => {
    let bg = palette.success;
    let label = "In Stock";
    if (stock_level === 0) {
      bg = palette.error;
      label = "Out of Stock";
    } else if (stock_level <= reorder_point) {
      bg = palette.warning;
      label = "Low Stock";
    }
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bg, color: palette.text }}
      >
        {label} ({stock_level})
      </span>
    );
  };

  // Supplier status badge
  const SupplierStatusBadge = ({
    status,
    pending_orders,
  }: {
    status: Supplier["status"];
    pending_orders: number;
  }) => {
    return (
      <div className="flex flex-col">
        <span
          className="px-2 py-1 rounded-full text-xs font-medium mb-1"
          style={{
            backgroundColor:
              status === "active" ? palette.success : palette.error,
            color: palette.text,
          }}
        >
          {status}
        </span>
        {pending_orders > 0 && (
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: palette.warning, color: palette.text }}
          >
            {pending_orders} pending orders
          </span>
        )}
      </div>
    );
  };

  // Filtered items
  const filteredItems = mockInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
(stockFilter === "low" && item.stock_level <= item.reorder_point) ||
(stockFilter === "out" && item.stock_level === 0) ||
(stockFilter === "in" && item.stock_level > 0);

    return matchesSearch && matchesStatus && matchesCategory && matchesStock;
  });

  return (
    <div
      className="flex h-screen bg-gray-900"
      style={{ backgroundColor: palette.background, color: palette.text }}
    >
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          backgroundColor: palette.surface,
          borderRight: `1px solid ${palette.border}`,
        }}
      >
        <div
          className="flex items-center justify-center h-16 border-b"
          style={{ borderColor: palette.border }}
        >
          <h1 className="text-xl font-bold" style={{ color: palette.primary }}>
            TIMS
          </h1>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="mt-5 px-2">
            {[
              { name: "Dashboard", icon: <LayoutDashboard size={20} />, id: "dashboard" },
              { name: "Inventory", icon: <Package size={20} />, id: "inventory" },
              { name: "Suppliers", icon: <Users size={20} />, id: "suppliers" },
              { name: "Settings", icon: <Settings size={20} />, id: "settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-2 text-sm rounded-md ${
                  activeTab === item.id
                    ? "bg-opacity-20"
                    : "hover:bg-opacity-10"
                }`}
                style={{
                  backgroundColor:
                    activeTab === item.id ? palette.primary : "transparent",
                  color:
                    activeTab === item.id
                      ? palette.text
                      : palette.textSecondary,
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
          </nav>

          <div
            className="p-4 border-t"
            style={{ borderColor: palette.border }}
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p
                  className="text-xs"
                  style={{ color: palette.textSecondary }}
                >
                  {role}
                </p>
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
        <header
          className="flex items-center h-16 px-6"
          style={{
            backgroundColor: palette.surface,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <h2 className="text-lg font-medium capitalize">{activeTab}</h2>
        </header>

        {/* Dashboard Section */}
        {activeTab === "dashboard" && (
          <main className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: palette.surface,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <h3>Total Inventory</h3>
                <p
                  className="text-3xl font-bold"
                  style={{ color: palette.primary }}
                >
                  {mockInventory.length}
                </p>
              </div>
              <div
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: palette.surface,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <h3>Available Items</h3>
                <p
                  className="text-3xl font-bold"
                  style={{ color: palette.success }}
                >
                  {mockInventory.filter((i) => i.status === "available").length}
                </p>
              </div>
              <div
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: palette.surface,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <h3>Low Stock Alerts</h3>
                <p
                  className="text-3xl font-bold"
                  style={{ color: palette.warning }}
                >
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
