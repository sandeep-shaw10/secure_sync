'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.access_token);
      router.push('/'); // Redirect to Dashboard
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="w-96 p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-400">SecureSync Admin</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block mb-2 text-sm">Username</label>
          <input 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-400 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm">Password</label>
          <input 
            type="password"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <button className="w-full bg-green-600 hover:bg-green-500 p-2 rounded font-bold transition">
          Login
        </button>
      </form>
    </div>
  );
}