'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PlantDashboard() {
  const [dataType, setDataType] = useState('production_order');
  const [payload, setPayload] = useState('{\n  "order_id": "ORD-123",\n  "quantity": 500\n}');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: '' }
  const router = useRouter();

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem('plant_token');
    if (!token) router.push('/plant/login');
  }, []);

  const handleSend = async () => {
    setStatus({ type: 'loading', msg: 'Sending Data...' });
    const token = localStorage.getItem('plant_token');
    
    // Decode token to get email (simple base64 decode for UI display purposes)
    const email = JSON.parse(atob(token.split('.')[1])).sub;

    try {
      // We use raw axios here to manually inject the Plant Token
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ingest`,
        {
          plant_email: email,
          data_type: dataType,
          payload: JSON.parse(payload) // Parse text area string to JSON
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStatus({ type: 'success', msg: '✅ Data Logged Successfully' });
    } catch (err) {
      // Handle the specific IP Block error
      const errorMsg = err.response?.data?.detail || 'Transmission Failed';
      setStatus({ type: 'error', msg: `⛔ ${errorMsg}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-4">
          <h1 className="text-2xl font-bold text-white flex items-center">
            🏭 Plant Data Transmitter
          </h1>
        </div>

        <div className="p-8 space-y-6">
          {/* Status Banner */}
          {status && (
            <div className={`p-4 rounded ${
              status.type === 'success' ? 'bg-green-900 text-green-200' : 
              status.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-gray-700'
            }`}>
              {status.msg}
            </div>
          )}

          {/* Data Type Selector */}
          <div>
            <label className="block text-sm font-bold mb-2">Data Type</label>
            <select 
              className="w-full bg-gray-700 p-3 rounded border border-gray-600 outline-none focus:border-blue-500"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              <option value="production_order">Production Order</option>
              <option value="inventory">Inventory Update</option>
              <option value="quality_report">Quality Report</option>
            </select>
          </div>

          {/* JSON Payload Editor */}
          <div>
            <label className="block text-sm font-bold mb-2">JSON Payload</label>
            <textarea 
              rows={6}
              className="w-full bg-gray-900 font-mono text-sm p-4 rounded border border-gray-600 outline-none focus:border-blue-500 text-green-400"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Must be valid JSON.</p>
          </div>

          <button 
            onClick={handleSend}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-lg transition shadow-lg"
          >
            🚀 Transmit Secure Data
          </button>
          
          <div className="text-center">
             <button 
              onClick={() => { localStorage.removeItem('plant_token'); router.push('/plant/login'); }}
              className="text-sm text-gray-500 hover:text-white"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}