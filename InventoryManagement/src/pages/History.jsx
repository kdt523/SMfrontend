import React, { useState } from 'react';
import Layout from '../components/Layout';
import NeoCard from '../components/ui/NeoCard';
import NeoBadge from '../components/ui/NeoBadge';
import { useStock } from '../context/StockContext';
import { Search } from 'lucide-react';

const History = () => {
  const { receipts, deliveries, transfers, adjustments } = useStock();
  const [filterType, setFilterType] = useState('All');

  // Combine all moves into one list
  const allMoves = [
    ...receipts.map(r => ({ ...r, type: 'Receipt', ref: r.id })),
    ...deliveries.map(d => ({ ...d, type: 'Delivery', ref: d.id })),
    ...transfers.map(t => ({ ...t, type: 'Transfer', ref: t.id })),
    ...adjustments.map(a => ({ ...a, type: 'Adjustment', ref: a.id })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredMoves = filterType === 'All' ? allMoves : allMoves.filter(m => m.type === filterType);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black uppercase">Move History</h2>
        <div className="flex gap-2">
          {['All', 'Receipt', 'Delivery', 'Transfer', 'Adjustment'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 font-bold border-2 border-black transition-all ${filterType === type ? 'bg-neo-main shadow-neo-sm' : 'bg-white hover:bg-gray-100'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <NeoCard className="overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-neo-purple text-white">
            <tr>
              <th className="p-4 border-b-3 border-black uppercase font-black">Date</th>
              <th className="p-4 border-b-3 border-black uppercase font-black">Reference</th>
              <th className="p-4 border-b-3 border-black uppercase font-black">Type</th>
              <th className="p-4 border-b-3 border-black uppercase font-black">Details</th>
              <th className="p-4 border-b-3 border-black uppercase font-black">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMoves.map((move, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b-2 border-gray-200 last:border-0">
                <td className="p-4 font-bold">{move.date}</td>
                <td className="p-4 font-mono">{move.ref}</td>
                <td className="p-4">
                  <NeoBadge variant={
                    move.type === 'Receipt' ? 'success' : 
                    move.type === 'Delivery' ? 'info' : 
                    move.type === 'Adjustment' ? 'danger' : 'warning'
                  }>
                    {move.type}
                  </NeoBadge>
                </td>
                <td className="p-4 text-sm">
                  {move.type === 'Receipt' && `From: ${move.supplier}`}
                  {move.type === 'Delivery' && `To: ${move.customer}`}
                  {move.type === 'Transfer' && `From ${move.from} to ${move.to}`}
                  {move.type === 'Adjustment' && `Reason: ${move.reason}`}
                  <div className="text-xs text-gray-500 mt-1">
                    {move.items.length} line items
                  </div>
                </td>
                <td className="p-4">
                  {move.status ? (
                    <span className={`font-bold ${move.status === 'Done' ? 'text-green-600' : 'text-gray-600'}`}>
                      {move.status}
                    </span>
                  ) : (
                    <span className="font-bold text-gray-600">Applied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeoCard>
    </Layout>
  );
};

export default History;
