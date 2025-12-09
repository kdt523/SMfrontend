import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockProducts, mockStock, mockReceipts, mockDeliveries, mockTransfers, mockAdjustments, mockWarehouses, mockUsers } from '../data/mockData';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(mockProducts);
  const [stock, setStock] = useState(mockStock);
  const [receipts, setReceipts] = useState(mockReceipts);
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [transfers, setTransfers] = useState(mockTransfers);
  const [adjustments, setAdjustments] = useState(mockAdjustments);
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [activeWarehouse, setActiveWarehouse] = useState(mockWarehouses[0].id);

  const login = (email, password) => {
    // Dummy login
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const getProductStock = (productId, warehouseId = null) => {
    if (warehouseId) {
      return stock[warehouseId]?.[productId] || 0;
    }
    // Sum across all warehouses
    return Object.values(stock).reduce((acc, whStock) => acc + (whStock[productId] || 0), 0);
  };

  const addProduct = (product) => {
    setProducts([...products, { ...product, id: `P-${Date.now()}` }]);
  };

  const createReceipt = (receipt) => {
    setReceipts([...receipts, { ...receipt, id: `REC-${Date.now()}`, status: 'Draft', date: new Date().toISOString().split('T')[0] }]);
  };

  const validateReceipt = (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    // Update stock
    const newStock = { ...stock };
    // Assuming receipts go to active warehouse for simplicity or defined in receipt
    const targetWh = activeWarehouse; 
    
    receipt.items.forEach(item => {
      if (!newStock[targetWh]) newStock[targetWh] = {};
      newStock[targetWh][item.productId] = (newStock[targetWh][item.productId] || 0) + parseInt(item.qty);
    });

    setStock(newStock);
    setReceipts(receipts.map(r => r.id === receiptId ? { ...r, status: 'Done' } : r));
  };

  const createDelivery = (delivery) => {
    setDeliveries([...deliveries, { ...delivery, id: `DEL-${Date.now()}`, status: 'Draft', date: new Date().toISOString().split('T')[0] }]);
  };

  const validateDelivery = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    const newStock = { ...stock };
    const sourceWh = activeWarehouse;

    delivery.items.forEach(item => {
      if (!newStock[sourceWh]) newStock[sourceWh] = {};
      newStock[sourceWh][item.productId] = Math.max(0, (newStock[sourceWh][item.productId] || 0) - parseInt(item.qty));
    });

    setStock(newStock);
    setDeliveries(deliveries.map(d => d.id === deliveryId ? { ...d, status: 'Done' } : d));
  };

  const createTransfer = (transfer) => {
    setTransfers([...transfers, { ...transfer, id: `INT-${Date.now()}`, status: 'Draft', date: new Date().toISOString().split('T')[0] }]);
  };

  const validateTransfer = (transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    const newStock = { ...stock };
    
    transfer.items.forEach(item => {
      // Remove from source
      if (!newStock[transfer.from]) newStock[transfer.from] = {};
      newStock[transfer.from][item.productId] = Math.max(0, (newStock[transfer.from][item.productId] || 0) - parseInt(item.qty));
      
      // Add to dest
      if (!newStock[transfer.to]) newStock[transfer.to] = {};
      newStock[transfer.to][item.productId] = (newStock[transfer.to][item.productId] || 0) + parseInt(item.qty);
    });

    setStock(newStock);
    setTransfers(transfers.map(t => t.id === transferId ? { ...t, status: 'Done' } : t));
  };

  const createAdjustment = (adjustment) => {
    const newStock = { ...stock };
    const wh = adjustment.warehouse;
    
    adjustment.items.forEach(item => {
       if (!newStock[wh]) newStock[wh] = {};
       // Adjustment sets the absolute value or adds difference? 
       // Usually "counted quantity" is input, so we set it.
       // But for simplicity let's assume the input is the difference or we handle logic in UI.
       // Let's assume the UI sends the final counted qty, so we update to that.
       newStock[wh][item.productId] = parseInt(item.qty);
    });

    setStock(newStock);
    setAdjustments([...adjustments, { ...adjustment, id: `ADJ-${Date.now()}`, date: new Date().toISOString().split('T')[0] }]);
  };

  return (
    <StockContext.Provider value={{
      user, login, logout,
      products, addProduct,
      stock, getProductStock,
      receipts, createReceipt, validateReceipt,
      deliveries, createDelivery, validateDelivery,
      transfers, createTransfer, validateTransfer,
      adjustments, createAdjustment,
      warehouses, activeWarehouse, setActiveWarehouse
    }}>
      {children}
    </StockContext.Provider>
  );
};
