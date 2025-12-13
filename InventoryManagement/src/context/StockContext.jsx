import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockProducts, mockStock, mockReceipts, mockDeliveries, mockTransfers, mockAdjustments, mockWarehouses, mockUsers } from '../data/mockData';
import api from '../api/client';

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
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', timeout = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, timeout);
  };

  // Normalize product responses from API into an array
  const normalizeProducts = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (p.items && Array.isArray(p.items)) return p.items;
    if (p.results && Array.isArray(p.results)) return p.results;
    if (p.data && Array.isArray(p.data)) return p.data;
    if (typeof p === 'object') {
      const vals = Object.values(p).find(v => Array.isArray(v));
      if (Array.isArray(vals)) return vals;
    }
    return [];
  };

  const login = (email, password) => {
    return api.postForm('/auth/login', { username: email, password })
      .then(res => {
        const token = res.access_token;
        if (!token) return false;
        api.setToken(token);
        return Promise.all([
          api.get('/auth/me').catch(() => null),
          api.get('/products').catch(() => null),
        ]).then(([u, p]) => {
          if (u) setUser(u);
          if (p) setProducts(normalizeProducts(p));
          loadLists();
          return true;
        });
      })
      .catch(err => {
        console.error('Login error', err);
        return false;
      });
  };

  const signUp = (payload) => {
    return api.post('/auth/signup', payload)
      .then(user => {
        return login(payload.email, payload.password).then(success => {
          if (success) {
            loadLists();
          }
          return success;
        });
      })
      .catch(err => {
        console.error('Signup error', err);
        throw err;
      });
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return true;
    } catch (error) {
      console.error("Forgot password error:", error);
      return false;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  useEffect(() => {
    api.initClient();
    api.get('/auth/me').then(u => {
      if (u) {
        setUser(u);
        loadLists();
      }
      api.get('/products').then(p => { if (p) setProducts(normalizeProducts(p)); }).catch(() => {});
    }).catch(() => {
      // keep mock data if not authenticated
    });
  }, []);

  const getProductStock = (productId, warehouseId = null) => {
    if (warehouseId) {
      return stock[warehouseId]?.[productId] || 0;
    }
    return Object.values(stock).reduce((acc, whStock) => acc + (whStock[productId] || 0), 0);
  };

  const addProduct = async (product) => {
    try {
      // Handle Category
      const cats = await api.get('/products/categories');
      let category = (cats || []).find(c => c.name.toLowerCase() === (product.category || '').toLowerCase());
      if (!category) {
        const code = (product.category || 'GEN').toUpperCase().replace(/\s+/g, '_');
        category = await api.post('/products/categories', { name: product.category || 'General', code });
      }

      // Handle UOM
      const uomsList = await api.get('/products/uom');
      const uomName = product.uom || product.unit_of_measure || 'Unit';
      let uom = (uomsList || []).find(u => u.name.toLowerCase() === uomName.toLowerCase() || u.code.toLowerCase() === uomName.toLowerCase());
      if (!uom) {
        // Create default UOM if not found
        const code = uomName.substring(0, 3).toUpperCase();
        uom = await api.post('/products/uom', { name: uomName, code, unit_type: 'unit' });
      }

      const payload = {
        name: product.name,
        sku: product.sku,
        uom_id: uom.id,
        reorder_point: Number(product.reorderPoint || 0),
        min_stock_level: Number(product.minStock || 0),
        reorder_quantity: 0, // Default
        is_active: true,
        category_id: category.id,
        cost_price: Number(product.price || 0), // Assuming price is cost price for now
        selling_price: Number(product.price || 0),
        initial_stock: Number(product.initialStock || 0)
      };

      const created = await api.post('/products', payload);
      await loadLists();
      return created;
    } catch (err) {
      console.error('Failed to create product on server', err);
      throw err;
    }
  };

  const createReceipt = (receipt) => {
    // Ensure payload matches backend expectation
    // receipt: { supplier_id, warehouse_id, lines: [{ product_id, quantity, unit_price }] }
    return api.post('/receipts', receipt)
      .then(r => {
        setReceipts(prev => [...prev, r]);
        refreshStock();
        return r;
      })
      .catch((err) => {
        console.error("Create receipt failed", err);
        throw err;
      });
  };

  const validateReceipt = (receiptId) => {
    if (!receiptId) return Promise.reject(new Error('Invalid receipt id'));
    
    return api.post(`/receipts/${receiptId}/validate`)
      .then(updated => {
        setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
        refreshStock();
        return updated;
      })
      .catch(err => {
        console.error('Validate receipt error', err);
        throw err;
      });
  };

  const createDelivery = (delivery) => {
    const payload = {
      delivery_number: delivery.delivery_number || `DEL-${Date.now()}`,
      warehouse_id: activeWarehouse || delivery.warehouse_id,
      delivery_date: delivery.delivery_date || new Date().toISOString().split('T')[0],
      customer_id: delivery.customer_id || null,
      notes: delivery.notes || (delivery.customer_name ? `Customer: ${delivery.customer_name}` : null),
      lines: (delivery.items || delivery.lines || []).map(it => ({
        product_id: it.productId || it.product_id,
        location_id: it.location_id,
        ordered_quantity: Number(it.qty || it.requested_qty || it.ordered_quantity || 0)
      }))
    };

    // If no warehouse selected, try to find one
    const ensureWarehouse = () => {
      // If we have warehouse and locations for all lines, we are good
      if (payload.warehouse_id && payload.lines.every(l => l.location_id)) {
          return Promise.resolve(payload.warehouse_id);
      }

      return api.get('/settings').then(ws => {
        const arr = Array.isArray(ws) ? ws : (ws && ws.items ? ws.items : []);
        if (arr.length) {
          // If no warehouse set, use first one
          if (!payload.warehouse_id) {
              payload.warehouse_id = arr[0].id;
          }
          
          // Find the warehouse object to get locations
          const wh = arr.find(w => w.id === payload.warehouse_id) || arr[0];
          const defaultLoc = wh.locations && wh.locations.length > 0 ? wh.locations[0].id : null;
          
          // Fill in missing locations
          payload.lines.forEach(l => {
              if (!l.location_id) {
                  if (defaultLoc) l.location_id = defaultLoc;
                  else throw new Error('No location found for warehouse');
              }
          });
          
          return payload.warehouse_id;
        }
        showToast('No warehouses defined on server.', 'error');
        return Promise.reject(new Error('No warehouses'));
      });
    };

    return ensureWarehouse()
      .then(() => api.post('/deliveries', payload))
      .then(d => {
        setDeliveries(prev => [...prev, d]);
        return d;
      })
      .catch(err => {
        console.error('Create delivery failed', err);
        const msg = String(err?.message || err || '');
        if (err?.status === 401 || msg.includes('Could not validate credentials')) {
          showToast('Session expired — please log in again', 'error');
          logout();
          window.location.href = '/login';
        }
        throw err;
      });
  };

  const validateDelivery = (deliveryId) => {
    if (!deliveryId) return Promise.reject(new Error('Invalid delivery id'));

    // Check if it's a local draft (starts with DEL-) - though we shouldn't have local drafts if we always create on server
    if (String(deliveryId).startsWith('DEL-')) {
        showToast('Cannot validate local draft. Please save first.', 'error');
        return Promise.reject(new Error('Cannot validate local draft'));
    }

    return api.post(`/deliveries/${deliveryId}/validate`)
      .then(updated => {
        setDeliveries(prev => prev.map(d => d.id === updated.id ? updated : d));
        refreshStock();
        return updated;
      })
      .catch(err => {
        console.error('Validate delivery error', err);
        throw err;
      });
  };

  const createTransfer = (transfer) => {
    return api.post('/transfers', transfer)
      .then(t => {
        setTransfers(prev => [...prev, t]);
        return t;
      })
      .catch(err => {
        console.error("Create transfer failed", err);
        throw err;
      });
  };

  const validateTransfer = (transferId) => {
    if (!transferId) return Promise.reject(new Error('Invalid transfer id'));
    return api.post(`/transfers/${transferId}/validate`)
      .then(updated => {
        setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));
        refreshStock();
        return updated;
      })
      .catch(err => {
        console.error('Validate transfer error', err);
        throw err;
      });
  };

  const createAdjustment = (adjustment) => {
    return api.post('/adjustments', adjustment)
      .then(a => {
        setAdjustments(prev => [...prev, a]);
        refreshStock();
        return a;
      })
      .catch(err => {
        console.error("Create adjustment failed", err);
        throw err;
      });
  };

  const validateAdjustment = (id) => {
    return api.post(`/adjustments/${id}/validate`)
      .then(updated => {
        setAdjustments(prev => prev.map(a => a.id === id ? updated : a));
        refreshStock();
        return updated;
      })
      .catch(err => {
        console.error("Validate adjustment failed", err);
        throw err;
      });
  };

  const refreshStock = () => {
    return api.get('/stock/quants').then(quants => {
      const stockMap = {};
      quants.forEach(q => {
        // q.location is an object, we need warehouse_id from it
        const whId = q.location?.warehouse_id;
        if (whId) {
            if (!stockMap[whId]) stockMap[whId] = {};
            stockMap[whId][q.product_id] = Number(q.quantity);
        }
      });
      setStock(stockMap);
    }).catch(() => {});
  };

  const loadLists = () => {
    api.get('/products').then(p => { if (p) setProducts(normalizeProducts(p)); }).catch(() => {});
    api.get('/products/categories').then(c => { if (c) setCategories(c); }).catch(() => {});
    api.get('/products/uom').then(u => { if (u) setUoms(u); }).catch(() => {});
    api.get('/receipts').then(r => { if (r) setReceipts(r); }).catch(() => {});
    api.get('/deliveries').then(d => { if (d) setDeliveries(d); }).catch(() => {});
    api.get('/transfers').then(t => { if (t) setTransfers(t); }).catch(() => {});
    api.get('/adjustments').then(a => { if (a) setAdjustments(a); }).catch(() => {});
    api.get('/settings').then(ws => {
      const items = Array.isArray(ws) ? ws : (ws && ws.items ? ws.items : []);
      setWarehouses(items);
      if (items.length > 0 && !activeWarehouse) {
          setActiveWarehouse(items[0].id);
      }
    }).catch(() => {});
    refreshStock();
  }

  const createWarehouse = (payload) => {
    // payload: { name, code, location? }
    return api.post('/settings', payload)
      .then(w => {
        setWarehouses(prev => {
          // replace if code exists
          const idx = prev.findIndex(p => p.code === w.code || p.id === w.id);
          if (idx >= 0) {
            const copy = [...prev]; copy[idx] = w; return copy;
          }
          return [...prev, w];
        });
        return w;
      })
      .catch(err => {
        console.error('Create warehouse failed', err);
        throw err;
      });
  };

  return (
    <StockContext.Provider value={{
      user, login, logout, signUp, forgotPassword, resetPassword,
      products, addProduct,
      stock, getProductStock,
      receipts, createReceipt, validateReceipt,
      deliveries, createDelivery, validateDelivery,
      transfers, createTransfer, validateTransfer,
      adjustments, createAdjustment, validateAdjustment,
      warehouses, createWarehouse, activeWarehouse, setActiveWarehouse,
      categories, uoms,
      showToast }}>
      {children}
      {/* Toast container */}
      <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ marginBottom: 8, padding: '10px 14px', borderRadius: 6, color: '#fff', background: t.type === 'error' ? '#e53e3e' : t.type === 'success' ? '#16a34a' : '#2563eb', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
            <div style={{ fontWeight: 700 }}>{t.type.toUpperCase()}</div>
            <div style={{ marginTop: 4 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </StockContext.Provider>
  );
};
