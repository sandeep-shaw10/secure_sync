'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function PlantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Call Plant Login Endpoint
      const res = await api.post('/auth/plant/login', { email, password });
      
      // 2. Save Token (We use a specific key to avoid conflict with Admin)
      localStorage.setItem('plant_token', res.data.access_token);
      
      // 3. Redirect to Plant Dashboard
      router.push('/plant/dashboard');
    } catch (err) {
      setError('Invalid Plant Credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="w-96 p-8 bg-gray-800 rounded-lg shadow-lg border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">🏭 Plant Login</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block mb-2 text-sm">Plant Email</label>
          <input 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-400 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm">Password</label>
          <input 
            type="password"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <button className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold transition">
          Access Console
        </button>
      </form>
    </div>
  );
}