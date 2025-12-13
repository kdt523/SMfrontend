import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Plus, X, ClipboardCheck } from 'lucide-react';

const Adjustments = () => {
  const { adjustments, createAdjustment, validateAdjustment, products, warehouses } = useStock();
  const [showModal, setShowModal] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    reference: '',
    warehouse_id: warehouses[0]?.id || '',
    adjustment_date: new Date().toISOString().split('T')[0],
    lines: [{ product_id: products[0]?.id, counted_quantity: 0 }]
  });

  const handleAddItem = () => {
    setNewAdjustment({
      ...newAdjustment,
      lines: [...newAdjustment.lines, { product_id: products[0]?.id, counted_quantity: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newLines = [...newAdjustment.lines];
    newLines.splice(index, 1);
    setNewAdjustment({ ...newAdjustment, lines: newLines });
  };

  const handleItemChange = (index, field, value) => {
    const newLines = [...newAdjustment.lines];
    newLines[index][field] = value;
    setNewAdjustment({ ...newAdjustment, lines: newLines });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Determine location from warehouse
    const wh = warehouses.find(w => w.id === newAdjustment.warehouse_id);
    const locId = wh?.locations?.[0]?.id;

    if (!locId) {
      alert("Selected warehouse must have at least one location.");
      return;
    }

    const payload = {
      ...newAdjustment,
      reference: newAdjustment.reference || `INV-ADJ-${Date.now()}`,
      location_id: locId
    };

    createAdjustment(payload);
    setShowModal(false);
    setNewAdjustment({
      reference: '',
      warehouse_id: warehouses[0]?.id || '',
      adjustment_date: new Date().toISOString().split('T')[0],
      lines: [{ product_id: products[0]?.id, counted_quantity: 0 }]
    });
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
                <h3 className="text-xl font-black">{adj.reference}</h3>
                <NeoBadge variant={adj.state === 'done' ? 'success' : 'default'}>
                  {adj.state}
                </NeoBadge>
              </div>
              <p className="font-bold text-gray-600">Warehouse: {adj.warehouse?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">Date: {adj.adjustment_date}</p>
            </div>

            <div className="flex-1 md:mx-8">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Adjusted Items</p>
              <div className="flex flex-wrap gap-2">
                {adj.lines?.map((line, idx) => {
                  const prodName = line.product?.name || products.find(p => p.id === line.product_id)?.name || 'Unknown';
                  return (
                    <span key={idx} className="bg-gray-100 border-2 border-black px-2 py-1 text-xs font-bold">
                      {prodName}: {line.counted_quantity}
                    </span>
                  );
                })}
              </div>
            </div>

            {adj.state !== 'done' && (
              <NeoButton onClick={() => validateAdjustment(adj.id)} variant="secondary" className="flex items-center gap-2">
                <ClipboardCheck size={18} /> VALIDATE
              </NeoButton>
            )}
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
                <NeoInput 
                  label="Reference" 
                  placeholder="Auto-generated"
                  value={newAdjustment.reference}
                  onChange={(e) => setNewAdjustment({...newAdjustment, reference: e.target.value})}
                />
                <NeoInput 
                  label="Date" 
                  type="date"
                  value={newAdjustment.adjustment_date}
                  onChange={(e) => setNewAdjustment({...newAdjustment, adjustment_date: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm uppercase">Warehouse</label>
                <select 
                  className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                  value={newAdjustment.warehouse_id}
                  onChange={e => setNewAdjustment({...newAdjustment, warehouse_id: e.target.value})}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="border-3 border-black p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase">Counted Products</h4>
                  <NeoButton type="button" onClick={handleAddItem} variant="outline" className="py-1 px-3 text-sm">
                    + Add Line
                  </NeoButton>
                </div>
                
                <div className="space-y-3">
                  {newAdjustment.lines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-bold uppercase">Product</label>
                        <select 
                          className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                          value={line.product_id}
                          onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-bold uppercase">Counted Qty</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                          value={line.counted_quantity}
                          onChange={e => handleItemChange(index, 'counted_quantity', Number(e.target.value))}
                          min="0"
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
                <NeoButton type="submit" variant="primary">CREATE ADJUSTMENT</NeoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Adjustments;
