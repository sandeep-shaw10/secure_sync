'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';

export default function PlantDetails() {
  const { email } = useParams(); // Get email from URL
  const decodedEmail = decodeURIComponent(email); // Fix %40 to @
  const router = useRouter();

  const [plant, setPlant] = useState(null);
  const [newIp, setNewIp] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Plant Details
  useEffect(() => {
    fetchPlant();
  }, []);

  const fetchPlant = async () => {
    try {
      const res = await api.get(`/admin/plant/${decodedEmail}`);
      setPlant(res.data);
      setLoading(false);
    } catch (err) {
      alert('Plant not found');
      router.push('/');
    }
  };

  // --- ACTIONS ---

  const handleAddIp = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/plant/ip', { 
        plant_email: plant.email, 
        ip_address: newIp 
      });
      setNewIp('');
      fetchPlant(); // Refresh data
    } catch (err) {
      alert('Failed to add IP');
    }
  };

  const handleDeleteIp = async (ip) => {
    if (!confirm(`Are you sure you want to remove IP: ${ip}?`)) return;
    try {
      await api.delete(`/admin/plant/ip?plant_email=${plant.email}&ip_address=${ip}`);
      fetchPlant();
    } catch (err) {
      alert('Failed to remove IP');
    }
  };

  const handleDeletePlant = async () => {
    const confirmName = prompt(`Type "${plant.name}" to confirm deletion:`);
    if (confirmName !== plant.name) return alert("Deletion cancelled.");

    try {
      await api.delete(`/admin/plant/${plant.email}`);
      router.push('/'); // Go back to dashboard
    } catch (err) {
      alert('Failed to delete plant');
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading Plant Data...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER / BACK BUTTON */}
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white mb-6">
          ← Back to Dashboard
        </button>

        {/* PLANT INFO CARD */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border-l-4 border-blue-500 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{plant.name}</h1>
              <p className="text-gray-400 font-mono">{plant.email}</p>
              <p className="text-xs text-gray-500 mt-2">ID: {plant._id}</p>
            </div>
            <span className={`px-4 py-2 rounded font-bold ${plant.is_verified ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {plant.is_verified ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: IP MANAGEMENT */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">Allowed IPs (Whitelist)</h2>
            
            {/* List IPs */}
            <div className="space-y-3 mb-6">
              {plant.whitelisted_ips.length === 0 && <p className="text-gray-500 italic">No IPs added yet.</p>}
              {plant.whitelisted_ips.map(ip => (
                <div key={ip} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="font-mono text-white">{ip}</span>
                  <button 
                    onClick={() => handleDeleteIp(ip)}
                    className="text-red-400 hover:text-red-200 text-sm font-bold"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>

            {/* Add IP Form */}
            <form onSubmit={handleAddIp} className="flex gap-2">
              <input 
                placeholder="Enter new IP (e.g. 192.168.1.5)" 
                className="flex-1 bg-gray-900 p-2 rounded border border-gray-600 outline-none focus:border-green-500"
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                required
              />
              <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold">
                Add
              </button>
            </form>
          </div>

          {/* RIGHT: DANGER ZONE */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-red-900/50">
            <h2 className="text-xl font-bold mb-4 text-red-500">Danger Zone</h2>
            <p className="text-gray-400 text-sm mb-6">
              Deleting this plant will verify remove all associated logs, history, and access tokens immediately. This action cannot be undone.
            </p>
            <button 
              onClick={handleDeletePlant}
              className="w-full bg-red-600/20 hover:bg-red-600 border border-red-600 text-red-500 hover:text-white py-4 rounded font-bold transition"
            >
              DELETE PLANT PERMANENTLY
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}