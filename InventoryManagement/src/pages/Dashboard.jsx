import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, Truck, ArrowLeftRight, ClipboardList } from 'lucide-react';

const Dashboard = () => {
  const { products, stock, receipts, deliveries, transfers, activeWarehouse, setActiveWarehouse, warehouses } = useStock();
  const [filterDoc, setFilterDoc] = useState('All');

  // KPIs
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => {
    const qty = stock[activeWarehouse]?.[p.id] || 0;
    return qty <= (p.reorder_quantity || 0);
  });
  const outOfStockItems = products.filter(p => {
    const qty = stock[activeWarehouse]?.[p.id] || 0;
    return qty === 0;
  });
  const pendingReceipts = receipts.filter(r => r.state !== 'done' && r.state !== 'canceled').length;
  const pendingDeliveries = deliveries.filter(d => d.state !== 'done' && d.state !== 'canceled').length;
  const scheduledTransfers = transfers.filter(t => t.state !== 'done').length;

  const COLORS = ['#FFDE59', '#5CE1E6', '#FF5757', '#CB6CE6'];
  const stockData = products.map(p => ({
    name: p.name,
    stock: stock[activeWarehouse]?.[p.id] || 0
  })).slice(0, 5);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black uppercase">Dashboard</h2>
        <div className="flex gap-4 items-center">
          <span className="font-bold">WAREHOUSE:</span>
          <select 
            className="border-3 border-black p-2 font-bold shadow-neo-sm focus:shadow-neo outline-none"
            value={activeWarehouse}
            onChange={(e) => setActiveWarehouse(e.target.value)}
          >
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="mb-8 bg-neo-accent text-white border-3 border-black p-4 shadow-neo flex items-center gap-4">
          <AlertTriangle size={32} strokeWidth={3} />
          <div>
            <h3 className="font-black text-xl">ATTENTION REQUIRED</h3>
            <p className="font-bold">
              {outOfStockItems.length} items out of stock, {lowStockItems.length} items low on stock in {warehouses.find(w => w.id === activeWarehouse)?.name}.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <NeoCard className="bg-neo-blue">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm uppercase mb-1">Total Products</p>
              <h3 className="text-5xl font-black">{totalProducts}</h3>
            </div>
            <Package size={40} strokeWidth={2} className="opacity-50" />
          </div>
        </NeoCard>
        
        <NeoCard className="bg-neo-main">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm uppercase mb-1">Pending Receipts</p>
              <h3 className="text-5xl font-black">{pendingReceipts}</h3>
            </div>
            <ClipboardList size={40} strokeWidth={2} className="opacity-50" />
          </div>
        </NeoCard>

        <NeoCard className="bg-neo-green">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm uppercase mb-1">Pending Deliveries</p>
              <h3 className="text-5xl font-black">{pendingDeliveries}</h3>
            </div>
            <Truck size={40} strokeWidth={2} className="opacity-50" />
          </div>
        </NeoCard>

        <NeoCard className="bg-neo-purple text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm uppercase mb-1">Transfers</p>
              <h3 className="text-5xl font-black">{scheduledTransfers}</h3>
            </div>
            <ArrowLeftRight size={40} strokeWidth={2} className="opacity-50" />
          </div>
        </NeoCard>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <NeoCard title="Stock Overview" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis tick={{fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{border: '3px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 'bold'}}
                  cursor={{fill: '#f0f0f0'}}
                />
                <Bar dataKey="stock" fill="#FFDE59" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        <NeoCard title="Recent Activity">
          <div className="space-y-4">
            {[...receipts, ...deliveries].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b-2 border-gray-200 pb-2 last:border-0">
                <div>
                  <p className="font-bold text-sm">{item.id}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
                <NeoBadge variant={item.status === 'Done' ? 'success' : 'warning'}>{item.status}</NeoBadge>
              </div>
            ))}
          </div>
        </NeoCard>
      </div>
    </Layout>
  );
};

export default Dashboard;
