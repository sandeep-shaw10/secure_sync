'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import forge from 'node-forge';

export default function PlantDashboard() {
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' or 'upload'
  const [customJson, setCustomJson] = useState('{\n  "status": "active"\n}');
  const [selectedFile, setSelectedFile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const token = localStorage.getItem('plant_token');
    if (!token) router.push('/plant/login');

    axios.get(`${API_URL}/auth/public-key`)
      .then(res => setPublicKey(res.data.public_key))
      .catch(err => console.error("Key Error", err));
  }, []);

  // --- HELPER: GENERATE DUMMY DATA ---
  const generateData = (sizeLabel) => {
    setStatus({ type: 'info', msg: `Generating ${sizeLabel} payload...` });
    
    // Approximate char counts (1 char = 1 byte usually)
    const sizes = {
      '1kb': 1024,
      '100kb': 100 * 1024,
      '1mb': 1024 * 1024,
      '10mb': 10 * 1024 * 1024,
      '25mb': 25 * 1024 * 1024,
      '50mb': 50 * 1024 * 1024
    };

    const targetSize = sizes[sizeLabel];
    // Create a repeatable pattern
    const pattern = "abcdef1234567890"; 
    const repeatCount = Math.ceil(targetSize / pattern.length);
    
    const dummyContent = pattern.repeat(repeatCount).slice(0, targetSize);
    
    // Set into the Custom JSON box if small, or keep in memory if huge
    if (targetSize <= 1024 * 1024) { // Only show < 1MB in text box
      setCustomJson(JSON.stringify({ type: 'simulation', size: sizeLabel, data: dummyContent }, null, 2));
    } else {
      // For large data, we handle it directly during send to avoid UI freeze
      setCustomJson(`[LARGE DATA GENERATED INTERNALLY: ${sizeLabel}]`); 
      window.largeBuffer = dummyContent; // Temporary browser storage
    }
    
    setStatus({ type: 'success', msg: `Ready to send ${sizeLabel}` });
  };

  // --- CORE: ENCRYPT & UPLOAD ---
  const handleSecureUpload = async () => {
    if (!publicKey) return setStatus({ type: 'error', msg: 'Missing Public Key' });

    setStatus({ type: 'loading', msg: 'Encrypting...' });
    const startTime = performance.now();

    try {
      // 1. PREPARE DATA (Get String or File Buffer)
      let rawData = "";
      
      if (activeTab === 'simulate') {
        if (customJson.startsWith("[LARGE DATA")) {
           rawData = window.largeBuffer; // Use the hidden large buffer
        } else {
           rawData = customJson;
        }
      } else {
        if (!selectedFile) return setStatus({ type: 'error', msg: 'No file selected' });
        // Read file as text (or ArrayBuffer for binary, simplified to text for JSON compatibility)
        rawData = await selectedFile.text(); 
      }

      const encryptionStart = performance.now();

      // 2. AES-256 ENCRYPTION
      const aesKey = forge.random.getBytesSync(32);
      const iv = forge.random.getBytesSync(12);

      const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
      cipher.start({ iv: iv });
      // Important: node-forge might block UI on 50MB. 
      // In production, we'd use WebCrypto API, but keeping node-forge for consistency.
      cipher.update(forge.util.createBuffer(rawData));
      cipher.finish();

      const encryptedBytes = cipher.output.getBytes();
      const tag = cipher.mode.tag.getBytes();
      const finalPayload = encryptedBytes + tag;

      // 3. RSA ENCRYPT KEY
      const rsaPublicKey = forge.pki.publicKeyFromPem(publicKey);
      const encryptedAesKey = rsaPublicKey.encrypt(aesKey, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
      });

      const encryptionEnd = performance.now();
      const securityOverhead = (encryptionEnd - encryptionStart).toFixed(2);

      // 4. CONVERT TO BLOB FOR UPLOAD
      // We convert the binary string to a Uint8Array for efficient upload
      const byteCharacters = finalPayload;
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });

      // 5. PREPARE FORM DATA
      const formData = new FormData();
      const token = localStorage.getItem('plant_token');
      const email = JSON.parse(atob(token.split('.')[1])).sub;

      formData.append('plant_email', email);
      formData.append('encrypted_aes_key', forge.util.encode64(encryptedAesKey));
      formData.append('iv', forge.util.encode64(iv));
      formData.append('file', blob, 'secure_payload.bin');

      setStatus({ type: 'loading', msg: 'Uploading Encrypted Stream...' });

      // 6. UPLOAD
      await axios.post(`${API_URL}/api/ingest/stream`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const endTime = performance.now();
      const totalTime = (endTime - startTime).toFixed(2);
      const networkTime = (totalTime - securityOverhead).toFixed(2);
      const sizeMB = (blob.size / (1024*1024)).toFixed(2);

      setMetrics({
        size: `${sizeMB} MB`,
        overhead: `${securityOverhead} ms`,
        total: `${totalTime} ms`
      });
      setStatus({ type: 'success', msg: '✅ Data Stored in GridFS' });

    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Transmission Failed (Check Logs)' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        
        {/* HEADER */}
        <div className="bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-white flex items-center gap-2">
               🛡️ Secure Data Uplink <span className="text-xs bg-blue-600 px-2 py-1 rounded">AES-256</span>
             </h1>
             <p className="text-gray-400 text-sm mt-1">GridFS Enabled • 50MB Capable</p>
          </div>
          <div className="text-right">
             <div className={`text-xs font-bold px-3 py-1 rounded ${publicKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {publicKey ? 'RSA ONLINE' : 'OFFLINE'}
             </div>
          </div>
        </div>

        {/* METRICS PANEL */}
        {metrics && (
          <div className="grid grid-cols-3 divide-x divide-gray-700 bg-gray-800 border-b border-gray-700">
            <div className="p-4 text-center">
              <p className="text-gray-500 text-xs uppercase">Payload Size</p>
              <p className="text-xl font-bold text-white">{metrics.size}</p>
            </div>
            <div className="p-4 text-center bg-blue-900/10">
              <p className="text-blue-400 text-xs uppercase">Security Overhead</p>
              <p className="text-xl font-bold text-blue-400">{metrics.overhead}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-gray-500 text-xs uppercase">Total Latency</p>
              <p className="text-xl font-bold text-white">{metrics.total}</p>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('simulate')}
            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'simulate' ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-750'}`}
          >
            SIMULATE PAYLOAD
          </button>
          <button 
             onClick={() => setActiveTab('upload')}
             className={`flex-1 py-4 font-bold text-sm ${activeTab === 'upload' ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-750'}`}
          >
            FILE UPLOAD
          </button>
        </div>

        <div className="p-8 space-y-6">
          
          {/* TAB 1: SIMULATION BUTTONS */}
          {activeTab === 'simulate' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-400">Select Payload Size</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {['1kb', '100kb', '1mb', '10mb', '25mb', '50mb'].map(size => (
                  <button
                    key={size}
                    onClick={() => generateData(size)}
                    className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white py-2 rounded text-sm font-mono transition"
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <textarea 
                className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-xs font-mono text-green-400 outline-none"
                value={customJson}
                onChange={(e) => { setCustomJson(e.target.value); window.largeBuffer = null; }} // Allow custom edit
              />
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'upload' && (
             <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center hover:border-gray-400 transition bg-gray-750">
                <input 
                  type="file" 
                  id="fileInput"
                  className="hidden" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <div className="text-4xl mb-4">📂</div>
                  <span className="text-lg font-bold text-white block">
                    {selectedFile ? selectedFile.name : 'Click to Upload File'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedFile ? `${(selectedFile.size/1024/1024).toFixed(2)} MB` : 'Max 50MB (GridFS supported)'}
                  </span>
                </label>
             </div>
          )}

          {/* STATUS BAR */}
          {status && (
            <div className={`text-center p-2 rounded text-sm font-bold ${
              status.type === 'error' ? 'text-red-400 bg-red-900/20' : 
              status.type === 'loading' ? 'text-blue-400 animate-pulse' : 
              'text-green-400 bg-green-900/20'
            }`}>
              {status.msg}
            </div>
          )}

          {/* SEND ACTION */}
          <button 
            onClick={handleSecureUpload}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-white shadow-lg text-lg transition transform hover:scale-[1.01]"
          >
            🚀 Encrypt & Transmit Data
          </button>

        </div>
      </div>
    </div>
  );
}