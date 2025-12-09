import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import { LayoutDashboard, Package, Truck, ArrowLeftRight, ClipboardList, History, Settings, LogOut, User, Search } from 'lucide-react';
import NeoButton from './ui/NeoButton';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
  <Link to={to}>
    <div className={`flex items-center gap-3 px-4 py-3 border-b-2 border-black hover:bg-neo-main transition-colors ${active ? 'bg-neo-main' : 'bg-white'}`}>
      <Icon size={20} strokeWidth={2.5} />
      <span className="font-bold uppercase text-sm">{label}</span>
    </div>
  </Link>
);

const Layout = ({ children }) => {
  const { user, logout } = useStock();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-neo-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-3 border-black flex flex-col fixed h-full z-10">
        <div className="p-6 border-b-3 border-black bg-neo-purple">
          <h1 className="text-2xl font-black text-white tracking-tighter">STOCK<br/>MASTER</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
          <SidebarItem to="/products" icon={Package} label="Products" active={location.pathname === '/products'} />
          <SidebarItem to="/receipts" icon={ClipboardList} label="Receipts" active={location.pathname === '/receipts'} />
          <SidebarItem to="/deliveries" icon={Truck} label="Delivery Orders" active={location.pathname === '/deliveries'} />
          <SidebarItem to="/transfers" icon={ArrowLeftRight} label="Internal Transfers" active={location.pathname === '/transfers'} />
          <SidebarItem to="/adjustments" icon={ClipboardList} label="Stock Adjustments" active={location.pathname === '/adjustments'} />
          <SidebarItem to="/history" icon={History} label="Move History" active={location.pathname === '/history'} />
          <SidebarItem to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t-3 border-black bg-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-neo-blue rounded-full border-2 border-black flex items-center justify-center font-bold">
              {user.avatar}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-600 truncate">{user.role}</p>
            </div>
          </div>
          <NeoButton onClick={handleLogout} variant="outline" className="w-full text-sm py-1">
            <div className="flex items-center justify-center gap-2">
              <LogOut size={16} /> Logout
            </div>
          </NeoButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 bg-white border-b-3 border-black flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Quick Search (SKU, Product, Doc)..." 
                className="w-full pl-10 pr-4 py-2 border-2 border-black shadow-neo-sm focus:shadow-neo focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NeoButton variant="ghost" className="px-3">
              <User size={24} />
            </NeoButton>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
