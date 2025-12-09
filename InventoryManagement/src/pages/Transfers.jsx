import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Plus, ArrowRight, X, Check } from 'lucide-react';

const Transfers = () => {
  const { transfers, createTransfer, validateTransfer, products, warehouses } = useStock();
  const [showModal, setShowModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from: warehouses[0]?.id,
    to: warehouses[1]?.id,
    items: [{ productId: products[0]?.id, qty: 1 }]
  });

  const handleAddItem = () => {
    setNewTransfer({
      ...newTransfer,
      items: [...newTransfer.items, { productId: products[0]?.id, qty: 1 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...newTransfer.items];
    newItems.splice(index, 1);
    setNewTransfer({ ...newTransfer, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...newTransfer.items];
    newItems[index][field] = value;
    setNewTransfer({ ...newTransfer, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createTransfer(newTransfer);
    setShowModal(false);
    setNewTransfer({ from: warehouses[0]?.id, to: warehouses[1]?.id, items: [{ productId: products[0]?.id, qty: 1 }] });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Internal Transfers</h2>
        <NeoButton onClick={() => setShowModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={20} /> NEW TRANSFER
        </NeoButton>
      </div>

      <div className="space-y-4">
        {transfers.map(transfer => (
          <NeoCard key={transfer.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black">{transfer.id}</h3>
                <NeoBadge variant={transfer.status === 'Done' ? 'success' : 'default'}>
                  {transfer.status}
                </NeoBadge>
              </div>
              <div className="flex items-center gap-2 font-bold text-gray-600">
                <span>{warehouses.find(w => w.id === transfer.from)?.name}</span>
                <ArrowRight size={16} />
                <span>{warehouses.find(w => w.id === transfer.to)?.name}</span>
              </div>
              <p className="text-sm text-gray-500">Date: {transfer.date}</p>
            </div>

            <div className="flex-1 md:mx-8">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Items</p>
              <div className="flex flex-wrap gap-2">
                {transfer.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <span key={idx} className="bg-gray-100 border-2 border-black px-2 py-1 text-xs font-bold">
                      {prod?.name} x{item.qty}
                    </span>
                  );
                })}
              </div>
            </div>

            {transfer.status !== 'Done' && (
              <NeoButton onClick={() => validateTransfer(transfer.id)} variant="secondary" className="flex items-center gap-2">
                <Check size={18} /> VALIDATE
              </NeoButton>
            )}
          </NeoCard>
        ))}
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-6 uppercase">Internal Transfer</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-sm uppercase">Source Warehouse</label>
                  <select 
                    className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                    value={newTransfer.from}
                    onChange={e => setNewTransfer({...newTransfer, from: e.target.value})}
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-sm uppercase">Destination Warehouse</label>
                  <select 
                    className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                    value={newTransfer.to}
                    onChange={e => setNewTransfer({...newTransfer, to: e.target.value})}
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-3 border-black p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase">Products to Move</h4>
                  <NeoButton type="button" onClick={handleAddItem} variant="outline" className="py-1 px-3 text-sm">
                    + Add Line
                  </NeoButton>
                </div>
                
                <div className="space-y-3">
                  {newTransfer.items.map((item, index) => (
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
                      <div className="w-24">
                        <label className="text-xs font-bold uppercase">Qty</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                          value={item.qty}
                          onChange={e => handleItemChange(index, 'qty', e.target.value)}
                          min="1"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 bg-neo-accent text-white border-2 border-black shadow-neo-sm hover:translate-y-1 hover:shadow-none transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <NeoButton type="button" variant="outline" onClick={() => setShowModal(false)}>CANCEL</NeoButton>
                <NeoButton type="submit" variant="primary">CREATE TRANSFER</NeoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Transfers;
