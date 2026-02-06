'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [newPlant, setNewPlant] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load Plants on Mount
  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const res = await api.get('/admin/plants');
      setPlants(res.data);
      setLoading(false);
    } catch (err) {
      router.push('/login'); // Redirect if not logged in
    }
  };

  const handleAddPlant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/add-plant', newPlant);
      alert('Plant Added & Email Sent!');
      setNewPlant({ name: '', email: '', password: '' }); // Reset form
      fetchPlants(); // Refresh list
    } catch (err) {
      alert('Error adding plant');
    }
  };

  const handleDeleteIP = async (plantEmail, ip) => {
    if(!confirm(`Remove IP ${ip}?`)) return;
    try {
      await api.delete(`/admin/plant/ip?plant_email=${plantEmail}&ip_address=${ip}`);
      fetchPlants();
    } catch (err) {
      alert('Failed to delete IP');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-green-400">🏭 Plant Control Center</h1>
          <button 
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* --- LEFT: ADD PLANT FORM --- */}
          <div className="md:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-white">Add New Plant</h2>
            <form onSubmit={handleAddPlant} className="space-y-4">
              <input 
                placeholder="Factory Name" 
                className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-green-500 outline-none"
                value={newPlant.name}
                onChange={e => setNewPlant({...newPlant, name: e.target.value})}
                required
              />
              <input 
                placeholder="Email Address" 
                className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-green-500 outline-none"
                value={newPlant.email}
                onChange={e => setNewPlant({...newPlant, email: e.target.value})}
                required
              />
               <input 
                type="password"
                placeholder="Set Plant Password" 
                className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-green-500 outline-none"
                value={newPlant.password}
                onChange={e => setNewPlant({...newPlant, password: e.target.value})}
                required
              />
              <button className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold transition">
                + Register Plant
              </button>
            </form>
          </div>

          {/* --- RIGHT: PLANT LIST --- */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white">Active Plants ({plants.length})</h2>
            
            {plants.map((plant) => (
              <div key={plant._id} className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plant.name}</h3>
                    <p className="text-gray-400 text-sm">{plant.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${plant.is_verified ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {plant.is_verified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>

                {/* IP WHITELIST SECTION */}
                <div className="bg-gray-900 rounded p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Whitelisted IPs</p>
                  {plant.whitelisted_ips.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No IPs authorized yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {plant.whitelisted_ips.map(ip => (
                        <div key={ip} className="flex items-center bg-gray-700 px-3 py-1 rounded-full text-sm">
                          <span className="mr-2 font-mono text-green-400">{ip}</span>
                          <button 
                            onClick={() => handleDeleteIP(plant.email, ip)}
                            className="text-red-400 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}