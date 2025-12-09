export const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@stockmaster.com', role: 'admin', avatar: 'AU' },
  { id: 2, name: 'Warehouse Staff', email: 'staff@stockmaster.com', role: 'staff', avatar: 'WS' },
];

export const mockWarehouses = [
  { id: 'WH-001', name: 'Main Warehouse', location: 'New York' },
  { id: 'WH-002', name: 'West Coast Hub', location: 'Los Angeles' },
];

export const mockCategories = [
  'Electronics', 'Furniture', 'Office Supplies', 'Raw Materials'
];

export const mockProducts = [
  { id: 'P-001', name: 'Ergonomic Chair', sku: 'FUR-001', category: 'Furniture', uom: 'Unit', minStock: 10, reorderPoint: 20, price: 150 },
  { id: 'P-002', name: 'Standing Desk', sku: 'FUR-002', category: 'Furniture', uom: 'Unit', minStock: 5, reorderPoint: 10, price: 300 },
  { id: 'P-003', name: 'Monitor 27"', sku: 'ELE-001', category: 'Electronics', uom: 'Unit', minStock: 15, reorderPoint: 30, price: 250 },
  { id: 'P-004', name: 'Mechanical Keyboard', sku: 'ELE-002', category: 'Electronics', uom: 'Unit', minStock: 20, reorderPoint: 40, price: 100 },
  { id: 'P-005', name: 'Paper Ream A4', sku: 'OFF-001', category: 'Office Supplies', uom: 'Box', minStock: 50, reorderPoint: 100, price: 5 },
];

export const mockStock = {
  'WH-001': {
    'P-001': 45,
    'P-002': 8,
    'P-003': 12, // Low stock
    'P-004': 100,
    'P-005': 200,
  },
  'WH-002': {
    'P-001': 10,
    'P-002': 2, // Low stock
    'P-003': 50,
    'P-004': 30,
    'P-005': 0, // Out of stock
  }
};

export const mockReceipts = [
  { id: 'REC-001', supplier: 'Office Depot', date: '2023-10-25', status: 'Done', items: [{ productId: 'P-005', qty: 100 }] },
  { id: 'REC-002', supplier: 'Tech Wholesalers', date: '2023-10-26', status: 'Waiting', items: [{ productId: 'P-003', qty: 20 }] },
];

export const mockDeliveries = [
  { id: 'DEL-001', customer: 'Acme Corp', date: '2023-10-27', status: 'Ready', items: [{ productId: 'P-001', qty: 5 }] },
  { id: 'DEL-002', customer: 'Globex Inc', date: '2023-10-28', status: 'Draft', items: [{ productId: 'P-004', qty: 10 }] },
];

export const mockTransfers = [
  { id: 'INT-001', from: 'WH-001', to: 'WH-002', date: '2023-10-20', status: 'Done', items: [{ productId: 'P-001', qty: 5 }] },
];

export const mockAdjustments = [
  { id: 'ADJ-001', warehouse: 'WH-001', date: '2023-10-15', reason: 'Damage', items: [{ productId: 'P-005', qty: -2 }] },
];
