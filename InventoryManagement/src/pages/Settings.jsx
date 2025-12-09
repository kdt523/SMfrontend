import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import { useStock } from '../context/StockContext';
import { Warehouse, MapPin, Plus } from 'lucide-react';

const Settings = () => {
  const { warehouses, mockCategories } = useStock();
  const [activeTab, setActiveTab] = useState('warehouses');

  return (
    <Layout>
      <h2 className="text-4xl font-black uppercase mb-6">Settings</h2>

      <div className="flex gap-4 mb-6 border-b-3 border-black pb-1">
        <button 
          onClick={() => setActiveTab('warehouses')}
          className={`px-6 py-2 font-bold text-lg transition-all ${activeTab === 'warehouses' ? 'bg-neo-main border-t-3 border-x-3 border-black -mb-1.5 pb-3' : 'hover:bg-gray-100'}`}
        >
          Warehouses
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2 font-bold text-lg transition-all ${activeTab === 'categories' ? 'bg-neo-main border-t-3 border-x-3 border-black -mb-1.5 pb-3' : 'hover:bg-gray-100'}`}
        >
          Categories
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-6 py-2 font-bold text-lg transition-all ${activeTab === 'general' ? 'bg-neo-main border-t-3 border-x-3 border-black -mb-1.5 pb-3' : 'hover:bg-gray-100'}`}
        >
          General
        </button>
      </div>

      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map(wh => (
            <NeoCard key={wh.id} className="relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-neo-blue p-3 border-2 border-black shadow-neo-sm">
                  <Warehouse size={24} />
                </div>
                <NeoButton variant="ghost" className="p-2">Edit</NeoButton>
              </div>
              <h3 className="text-2xl font-black uppercase mb-1">{wh.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 font-bold">
                <MapPin size={18} />
                {wh.location}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                <p className="text-sm font-bold text-gray-500 uppercase">Code: {wh.id}</p>
              </div>
            </NeoCard>
          ))}
          
          <button className="border-3 border-black border-dashed p-6 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors min-h-[200px]">
            <div className="bg-gray-200 p-4 rounded-full">
              <Plus size={32} />
            </div>
            <span className="font-black text-xl uppercase">Add Warehouse</span>
          </button>
        </div>
      )}

      {activeTab === 'categories' && (
        <NeoCard>
          <h3 className="text-xl font-black uppercase mb-4">Product Categories</h3>
          <div className="flex flex-wrap gap-3">
            {mockCategories.map(cat => (
              <div key={cat} className="bg-white border-2 border-black px-4 py-2 shadow-neo-sm font-bold flex items-center gap-2">
                {cat}
                <button className="hover:text-red-600"><Plus size={16} className="rotate-45" /></button>
              </div>
            ))}
            <button className="bg-neo-main border-2 border-black px-4 py-2 shadow-neo-sm font-bold flex items-center gap-2 hover:translate-y-1 hover:shadow-none transition-all">
              <Plus size={16} /> Add New
            </button>
          </div>
        </NeoCard>
      )}

      {activeTab === 'general' && (
        <NeoCard className="max-w-2xl">
          <h3 className="text-xl font-black uppercase mb-6">System Preferences</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">Low Stock Alerts</h4>
                <p className="text-sm text-gray-500">Notify when products reach reorder point</p>
              </div>
              <div className="w-14 h-8 bg-neo-green border-2 border-black rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white border-2 border-black rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">Auto-Validation</h4>
                <p className="text-sm text-gray-500">Automatically validate internal transfers</p>
              </div>
              <div className="w-14 h-8 bg-gray-300 border-2 border-black rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-5 h-5 bg-white border-2 border-black rounded-full"></div>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-black">
              <NeoButton variant="primary">SAVE CHANGES</NeoButton>
            </div>
          </div>
        </NeoCard>
      )}
    </Layout>
  );
};

export default Settings;
