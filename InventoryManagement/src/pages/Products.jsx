import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Search, Plus, X } from 'lucide-react';

const Products = () => {
  const { products, stock, activeWarehouse, addProduct, categories, uoms } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', category: '', uom: '', minStock: 0, reorderPoint: 0, price: 0, initialStock: 0
  });

  const filteredProducts = products.filter(p => 
    (p?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p?.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProduct(newProduct);
    setShowAddModal(false);
    setNewProduct({ name: '', sku: '', category: '', uom: '', minStock: 0, reorderPoint: 0, price: 0, initialStock: 0 });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Products</h2>
        <NeoButton onClick={() => setShowAddModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={20} /> NEW PRODUCT
        </NeoButton>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search products by Name or SKU..." 
            className="w-full pl-10 pr-4 py-3 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Category Filter could go here */}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map(product => {
          const qty = stock[activeWarehouse]?.[product.id] || 0;
          const minStock = product.min_stock_level || product.minStock || 0;
          const status = qty === 0 ? 'Out of Stock' : qty <= minStock ? 'Low Stock' : 'In Stock';
          const statusVariant = qty === 0 ? 'danger' : qty <= minStock ? 'warning' : 'success';

          return (
            <NeoCard key={product.id} className="flex flex-col md:flex-row items-center justify-between p-4 hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black">{product.name || product.title || 'Unnamed Product'}</h3>
                      {(() => {
                        const cat = product.category;
                        const catLabel = typeof cat === 'string' ? cat : (cat && (cat.name || cat.code)) || 'Uncategorized';
                        return <NeoBadge variant="default">{catLabel}</NeoBadge>;
                      })()}
                    </div>
                    <p className="text-sm font-bold text-gray-500">
                      SKU: {product.sku || product.code || '—'} | 
                      UoM: {product.uom?.name || product.uom || product.unit_of_measure || 'Unit'}
                    </p>
                  </div>
              
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-500">Price</p>
                  <p className="text-lg font-black">${product.selling_price || product.price || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-500">Stock</p>
                  <p className="text-2xl font-black">{qty}</p>
                </div>
                <NeoBadge variant={statusVariant} className="text-sm px-4 py-2">{status}</NeoBadge>
              </div>
            </NeoCard>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 max-w-2xl w-full m-4 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-6 uppercase">New Product</h2>
            
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NeoInput 
                label="Product Name" 
                value={newProduct.name} 
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                required 
              />
              <NeoInput 
                label="SKU / Code" 
                value={newProduct.sku} 
                onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                required 
              />
              
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm uppercase">Category</label>
                <select 
                  className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm uppercase">Unit of Measure</label>
                <select 
                  className="w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo outline-none bg-white"
                  value={newProduct.uom}
                  onChange={e => setNewProduct({...newProduct, uom: e.target.value})}
                >
                  <option value="">Select UoM</option>
                  {uoms.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>

              <NeoInput 
                label="Price ($)" 
                type="number"
                value={newProduct.price} 
                onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
              />

              <NeoInput 
                label="Initial Stock" 
                type="number"
                value={newProduct.initialStock} 
                onChange={e => setNewProduct({...newProduct, initialStock: parseFloat(e.target.value)})}
              />

              <div className="col-span-2 grid grid-cols-2 gap-6 border-t-2 border-dashed border-gray-300 pt-4">
                <NeoInput 
                  label="Min Stock Alert" 
                  type="number"
                  value={newProduct.minStock} 
                  onChange={e => setNewProduct({...newProduct, minStock: parseInt(e.target.value)})}
                />
                <NeoInput 
                  label="Reorder Point" 
                  type="number"
                  value={newProduct.reorderPoint} 
                  onChange={e => setNewProduct({...newProduct, reorderPoint: parseInt(e.target.value)})}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <NeoButton type="button" variant="outline" onClick={() => setShowAddModal(false)}>CANCEL</NeoButton>
                <NeoButton type="submit" variant="primary">CREATE PRODUCT</NeoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Products;
