import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Plus, X, ClipboardCheck } from 'lucide-react';

const Adjustments = () => {
  const { adjustments, createAdjustment, products, warehouses, stock } = useStock();
  const [showModal, setShowModal] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    warehouse: warehouses[0]?.id,
    reason: 'Audit',
    items: [{ productId: products[0]?.id, qty: 0 }]
  });

  const handleAddItem = () => {
    setNewAdjustment({
      ...newAdjustment,
      items: [...newAdjustment.items, { productId: products[0]?.id, qty: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...newAdjustment.items];
    newItems.splice(index, 1);
    setNewAdjustment({ ...newAdjustment, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...newAdjustment.items];
    newItems[index][field] = value;
    setNewAdjustment({ ...newAdjustment, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createAdjustment(newAdjustment);
    setShowModal(false);
    setNewAdjustment({ warehouse: warehouses[0]?.id, reason: 'Audit', items: [{ productId: products[0]?.id, qty: 0 }] });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Stock Adjustments</h2>
        <NeoButton onClick={() => setShowModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={20} /> NEW ADJUSTMENT
        </NeoButton>
      </div>

      <div className="space-y-4">
        {adjustments.map(adj => (
          <NeoCard key={adj.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black">{adj.id}</h3>
                <NeoBadge variant="default">{adj.reason}</NeoBadge>
              </div>
              <p className="font-bold text-gray-600">Warehouse: {warehouses.find(w => w.id === adj.warehouse)?.name}</p>
              <p className="text-sm text-gray-500">Date: {adj.date}</p>
            </div>

            <div className="flex-1 md:mx-8">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Adjusted Items</p>
              <div className="flex flex-wrap gap-2">
                {adj.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <span key={idx} className="bg-gray-100 border-2 border-black px-2 py-1 text-xs font-bold">
                      {prod?.name}: {item.qty}
                    </span>
                  );
                })}
              </div>
            </div>
          </NeoCard>
        ))}
      </div>

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-6 uppercase">Inventory Adjustment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-sm uppercase">Warehouse</label>
                  <select 
                    className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                    value={newAdjustment.warehouse}
                    onChange={e => setNewAdjustment({...newAdjustment, warehouse: e.target.value})}
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-sm uppercase">Reason</label>
                  <select 
                    className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                    value={newAdjustment.reason}
                    onChange={e => setNewAdjustment({...newAdjustment, reason: e.target.value})}
                  >
                    <option>Audit</option>
                    <option>Damage</option>
                    <option>Mismatch</option>
                    <option>Theft</option>
                  </select>
                </div>
              </div>

              <div className="border-3 border-black p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase">Counted Quantities</h4>
                  <NeoButton type="button" onClick={handleAddItem} variant="outline" className="py-1 px-3 text-sm">
                    + Add Line
                  </NeoButton>
                </div>
                
                <div className="space-y-3">
                  {newAdjustment.items.map((item, index) => {
                    const currentStock = stock[newAdjustment.warehouse]?.[item.productId] || 0;
                    const diff = parseInt(item.qty) - currentStock;
                    
                    return (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-bold uppercase">Product</label>
                          <select 
                            className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                            value={item.productId}
                            onChange={e => handleItemChange(index, 'productId', e.target.value)}
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <label className="text-xs font-bold uppercase text-gray-500">Current</label>
                          <div className="px-3 py-2 bg-gray-200 border-2 border-gray-300 font-bold text-center">
                            {currentStock}
                          </div>
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-bold uppercase">Counted</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                            value={item.qty}
                            onChange={e => handleItemChange(index, 'qty', e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="w-20 text-center">
                           <span className={`text-xs font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                             {diff > 0 ? '+' : ''}{diff}
                           </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 bg-neo-accent text-white border-2 border-black shadow-neo-sm hover:translate-y-1 hover:shadow-none transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <NeoButton type="button" variant="outline" onClick={() => setShowModal(false)}>CANCEL</NeoButton>
                <NeoButton type="submit" variant="primary">APPLY ADJUSTMENT</NeoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Adjustments;
