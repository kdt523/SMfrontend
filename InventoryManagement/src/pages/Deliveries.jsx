import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Plus, Check, X, PackageCheck } from 'lucide-react';

const Deliveries = () => {
  const { deliveries, createDelivery, validateDelivery, products, warehouses, activeWarehouse } = useStock();
  const [showModal, setShowModal] = useState(false);
  
  const [newDelivery, setNewDelivery] = useState({
    delivery_number: '',
    customer_id: '', // TODO: Add customer management
    customer_name: '', // Fallback for now
    warehouse_id: activeWarehouse || '',
    delivery_date: new Date().toISOString().split('T')[0],
    lines: [{ product_id: products[0]?.id, ordered_quantity: 1, location_id: '' }]
  });

  useEffect(() => {
    if (activeWarehouse && !newDelivery.warehouse_id) {
      setNewDelivery(prev => ({ ...prev, warehouse_id: activeWarehouse }));
    }
  }, [activeWarehouse]);

  const getLocations = (warehouseId) => {
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh?.locations || [];
  };

  const availableLocations = getLocations(newDelivery.warehouse_id);

  const handleAddItem = () => {
    // Default to first location if available
    const defaultLoc = availableLocations.length > 0 ? availableLocations[0].id : '';
    setNewDelivery({
      ...newDelivery,
      lines: [...newDelivery.lines, { product_id: products[0]?.id, ordered_quantity: 1, location_id: defaultLoc }]
    });
  };

  const handleRemoveItem = (index) => {
    const newLines = [...newDelivery.lines];
    newLines.splice(index, 1);
    setNewDelivery({ ...newDelivery, lines: newLines });
  };

  const handleItemChange = (index, field, value) => {
    const newLines = [...newDelivery.lines];
    newLines[index][field] = value;
    setNewDelivery({ ...newDelivery, lines: newLines });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...newDelivery,
      delivery_number: newDelivery.delivery_number || `DEL-${Date.now()}`,
      customer_name: newDelivery.customer_name || 'Unknown',
      lines: newDelivery.lines.map(line => ({
        ...line,
        location_id: line.location_id || (availableLocations.length > 0 ? availableLocations[0].id : '')
      }))
    };
    createDelivery(payload);
    setShowModal(false);
    setNewDelivery({
      delivery_number: '',
      customer_id: '',
      customer_name: '',
      warehouse_id: activeWarehouse || '',
      delivery_date: new Date().toISOString().split('T')[0],
      lines: [{ product_id: products[0]?.id, ordered_quantity: 1, location_id: '' }]
    });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Delivery Orders</h2>
        <NeoButton onClick={() => setShowModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={20} /> NEW ORDER
        </NeoButton>
      </div>

      <div className="space-y-4">
        {deliveries.map(delivery => (
          <NeoCard key={delivery.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black">{delivery.delivery_number}</h3>
                <NeoBadge variant={delivery.state === 'done' ? 'success' : delivery.state === 'ready' ? 'info' : 'default'}>
                  {delivery.state}
                </NeoBadge>
              </div>
              <p className="font-bold text-gray-600">Customer: {delivery.customer?.name || delivery.customer_name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">Date: {delivery.delivery_date}</p>
            </div>

            <div className="flex-1 md:mx-8">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Items to Pick</p>
              <div className="flex flex-wrap gap-2">
                {delivery.lines?.map((line, idx) => {
                  const prodName = line.product?.name || products.find(p => p.id === line.product_id)?.name || 'Unknown';
                  return (
                    <span key={idx} className="bg-gray-100 border-2 border-black px-2 py-1 text-xs font-bold">
                      {prodName} x{line.ordered_quantity}
                    </span>
                  );
                })}
              </div>
            </div>

            {delivery.state !== 'done' && (
              <NeoButton onClick={() => validateDelivery(delivery.id)} variant="secondary" className="flex items-center gap-2">
                <PackageCheck size={18} /> VALIDATE
              </NeoButton>
            )}
          </NeoCard>
        ))}
      </div>

      {/* New Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-6 uppercase">Outgoing Delivery</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <NeoInput 
                  label="Delivery Number" 
                  placeholder="Auto-generated"
                  value={newDelivery.delivery_number}
                  onChange={(e) => setNewDelivery({...newDelivery, delivery_number: e.target.value})}
                />
                <NeoInput 
                  label="Date" 
                  type="date"
                  value={newDelivery.delivery_date}
                  onChange={(e) => setNewDelivery({...newDelivery, delivery_date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NeoInput 
                  label="Customer Name" 
                  value={newDelivery.customer_name} 
                  onChange={e => setNewDelivery({...newDelivery, customer_name: e.target.value})}
                  required 
                />
                <div>
                  <label className="block text-sm font-bold uppercase mb-1">Warehouse</label>
                  <select 
                    className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    value={newDelivery.warehouse_id}
                    onChange={(e) => setNewDelivery({...newDelivery, warehouse_id: e.target.value})}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-3 border-black p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase">Products to Pick</h4>
                  <NeoButton type="button" onClick={handleAddItem} variant="outline" className="py-1 px-3 text-sm">
                    + Add Line
                  </NeoButton>
                </div>
                
                <div className="space-y-3">
                  {newDelivery.lines.map((line, index) => (
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
                      <div className="flex-1">
                        <label className="text-xs font-bold uppercase">Source Location</label>
                        <select 
                          className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                          value={line.location_id}
                          onChange={e => handleItemChange(index, 'location_id', e.target.value)}
                        >
                          <option value="">Select Location</option>
                          {availableLocations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-bold uppercase">Qty</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border-2 border-black shadow-neo-sm outline-none"
                          value={line.ordered_quantity}
                          onChange={e => handleItemChange(index, 'ordered_quantity', Number(e.target.value))}
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
                <NeoButton type="submit" variant="primary">CREATE ORDER</NeoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Deliveries;
