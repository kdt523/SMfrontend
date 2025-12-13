import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Plus, Check, X } from 'lucide-react';

const Receipts = () => {
  const { receipts, createReceipt, validateReceipt, products, warehouses, activeWarehouse } = useStock();
  const [showModal, setShowModal] = useState(false);
  
  // Initialize with defaults
  const [newReceipt, setNewReceipt] = useState({
    receipt_number: '',
    supplier_id: '', // TODO: Add supplier management
    warehouse_id: activeWarehouse || '',
    location_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    lines: [{ product_id: products[0]?.id, received_quantity: 1, location_id: '' }]
  });

  // Update warehouse_id when activeWarehouse changes or on init
  useEffect(() => {
    if (activeWarehouse && !newReceipt.warehouse_id) {
      setNewReceipt(prev => ({ ...prev, warehouse_id: activeWarehouse }));
    }
  }, [activeWarehouse]);

  // Get locations for selected warehouse
  const getLocations = (warehouseId) => {
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh?.locations || [];
  };

  const availableLocations = getLocations(newReceipt.warehouse_id);

  const handleAddItem = () => {
    setNewReceipt({
      ...newReceipt,
      lines: [...newReceipt.lines, { product_id: products[0]?.id, received_quantity: 1, location_id: newReceipt.location_id }]
    });
  };

  const handleRemoveItem = (index) => {
    const newLines = [...newReceipt.lines];
    newLines.splice(index, 1);
    setNewReceipt({ ...newReceipt, lines: newLines });
  };

  const handleItemChange = (index, field, value) => {
    const newLines = [...newReceipt.lines];
    newLines[index][field] = value;
    setNewReceipt({ ...newReceipt, lines: newLines });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Generate receipt number if empty
    const payload = {
      ...newReceipt,
      receipt_number: newReceipt.receipt_number || `REC-${Date.now()}`,
      // Ensure lines have location_id (fallback to header location)
      lines: newReceipt.lines.map(line => ({
        ...line,
        location_id: line.location_id || newReceipt.location_id
      }))
    };
    createReceipt(payload);
    setShowModal(false);
    // Reset form
    setNewReceipt({
      receipt_number: '',
      supplier_id: '',
      warehouse_id: activeWarehouse || '',
      location_id: '',
      receipt_date: new Date().toISOString().split('T')[0],
      lines: [{ product_id: products[0]?.id, received_quantity: 1, location_id: '' }]
    });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Receipts</h2>
        <NeoButton onClick={() => setShowModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={20} /> NEW RECEIPT
        </NeoButton>
      </div>

      <div className="space-y-4">
        {receipts.map(receipt => (
          <NeoCard key={receipt.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black">{receipt.receipt_number}</h3>
                <NeoBadge variant={receipt.state === 'done' ? 'success' : receipt.state === 'waiting' ? 'warning' : 'default'}>
                  {receipt.state}
                </NeoBadge>
              </div>
              <p className="font-bold text-gray-600">Supplier: {receipt.supplier?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">Date: {receipt.receipt_date}</p>
            </div>

            <div className="flex-1 md:mx-8">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Items</p>
              <div className="flex flex-wrap gap-2">
                {receipt.lines?.map((line, idx) => {
                  const prodName = line.product?.name || products.find(p => p.id === line.product_id)?.name || 'Unknown';
                  return (
                    <span key={idx} className="bg-gray-100 border-2 border-black px-2 py-1 text-xs font-bold">
                      {prodName} x{line.received_quantity}
                    </span>
                  );
                })}
              </div>
            </div>

            {receipt.state !== 'done' && (
              <NeoButton onClick={() => validateReceipt(receipt.id)} variant="secondary" className="flex items-center gap-2">
                <Check size={18} /> VALIDATE
              </NeoButton>
            )}
          </NeoCard>
        ))}
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-6 uppercase">Incoming Receipt</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <NeoInput 
                  label="Receipt Number" 
                  placeholder="Auto-generated if empty"
                  value={newReceipt.receipt_number}
                  onChange={(e) => setNewReceipt({...newReceipt, receipt_number: e.target.value})}
                />
                <NeoInput 
                  label="Date" 
                  type="date"
                  value={newReceipt.receipt_date}
                  onChange={(e) => setNewReceipt({...newReceipt, receipt_date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase mb-1">Warehouse</label>
                  <select 
                    className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    value={newReceipt.warehouse_id}
                    onChange={(e) => setNewReceipt({...newReceipt, warehouse_id: e.target.value, location_id: ''})}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase mb-1">Location</label>
                  <select 
                    className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    value={newReceipt.location_id}
                    onChange={(e) => setNewReceipt({...newReceipt, location_id: e.target.value})}
                    required
                  >
                    <option value="">Select Location</option>
                    {availableLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold uppercase">Items</label>
                  <button type="button" onClick={handleAddItem} className="text-xs font-bold underline hover:text-blue-600">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {newReceipt.lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <select 
                          className="w-full border-2 border-black p-2 text-sm font-bold"
                          value={line.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <NeoInput 
                          type="number" 
                          min="1"
                          value={line.received_quantity}
                          onChange={(e) => handleItemChange(idx, 'received_quantity', Number(e.target.value))}
                        />
                      </div>
                      {newReceipt.lines.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <NeoButton type="submit" variant="primary" className="w-full py-3 text-lg">
                CREATE RECEIPT
              </NeoButton>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Receipts;
