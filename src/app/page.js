"use client";
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'uploader_config_v2';

// Helper to parse the ENV text block dynamically based on provider
const parseEnvConfig = (text, provider) => {
  if (!text) return {};
  const config = {};
  const lines = text.split('\n');

  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let val = valueParts.join('=').trim();
      val = val.replace(/^["']|["']$/g, '');
      config[key.trim()] = val;
    }
  });

  // Normalize keys for internal use
  if (provider === 'aws') {
    return {
      accessKeyId: config['AWS_ACCESS_KEY_ID'] || config['ACCESS_KEY_ID'],
      secretAccessKey: config['AWS_SECRET_ACCESS_KEY'] || config['SECRET_ACCESS_KEY'],
      region: config['AWS_REGION'] || config['REGION'] || 'us-east-1',
      bucketName: config['AWS_BUCKET_NAME'] || config['BUCKET_NAME'],
    };
  } else {
    return {
      accountId: config['R2_ACCOUNT_ID'],
      accessKeyId: config['R2_ACCESS_KEY_ID'],
      secretAccessKey: config['R2_SECRET_ACCESS_KEY'],
      bucketName: config['R2_BUCKET_NAME'],
      publicDomain: config['R2_PUBLIC_URL'],
    };
  }
};

export default function Uploader() {
  const [provider, setProvider] = useState('r2'); // 'r2' or 'aws'
  const [configText, setConfigText] = useState('');
  const [parsedConfig, setParsedConfig] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setProvider(data.provider || 'r2');
      setConfigText(data.text || '');
    }
    setIsLoaded(true);
  }, []);

  // Parse config whenever text or provider changes
  useEffect(() => {
    const config = parseEnvConfig(configText, provider);
    setParsedConfig(config);

    // Auto-hide logic
    const requiredR2 = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName'];
    const requiredAWS = ['accessKeyId', 'secretAccessKey', 'bucketName', 'region'];
    const required = provider === 'r2' ? requiredR2 : requiredAWS;

    const missing = required.filter(k => !config[k]);

    if (missing.length === 0 && showSettings && isLoaded) {
      // Slight delay to allow user to see it validated
      const timer = setTimeout(() => setShowSettings(false), 500);
      return () => clearTimeout(timer);
    }
  }, [configText, provider, isLoaded]);

  const saveConfig = (text, prov) => {
    setConfigText(text);
    setProvider(prov);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, provider: prov }));
  };

  const handleClearConfig = () => {
    if(confirm("Clear saved credentials?")) {
      localStorage.removeItem(STORAGE_KEY);
      setConfigText('');
      setParsedConfig({});
      setShowSettings(true);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);
    formData.append("accessKeyId", parsedConfig.accessKeyId);
    formData.append("secretAccessKey", parsedConfig.secretAccessKey);
    formData.append("bucketName", parsedConfig.bucketName);

    if (provider === 'r2') {
      formData.append("accountId", parsedConfig.accountId);
      formData.append("publicDomain", parsedConfig.publicDomain);
    } else {
      formData.append("region", parsedConfig.region);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadedUrl(data.url);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedUrl);
    alert("Copied!");
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans text-slate-800">

      {/* GitHub Link */}
      <div className="absolute top-5 right-5">
        <a href="https://github.com/Fiery-Tools/s3-instant-uploader" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-2 text-sm font-medium">
          <span>Source</span>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
        </a>
      </div>

      <div className="w-full max-w-2xl space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            S3 Instant Uploader
          </h1>
          <p className="text-slate-500 text-lg">
            Secure client for Cloudflare R2 & AWS S3
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 overflow-hidden">

          {/* Privacy Banner */}
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div className="text-sm text-blue-900">
              <span className="font-semibold">Privacy:</span> Keys are stored in your browser (LocalStorage). We do not save them.
            </div>
          </div>

          <div className="p-8">

            {/* Header & Switcher */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-xs text-slate-600 font-bold">1</span>
                 <h2 className="text-lg font-bold text-slate-800">Configuration</h2>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => saveConfig(configText, 'r2')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${provider === 'r2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cloudflare R2
                </button>
                <button
                   onClick={() => saveConfig(configText, 'aws')}
                   className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${provider === 'aws' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  AWS S3
                </button>
              </div>
            </div>

            {/* Config Textarea */}
            <div className={`transition-all duration-300 ${showSettings ? 'block' : 'hidden'}`}>
              <div className="space-y-4">
                <textarea
                  value={configText}
                  onChange={(e) => saveConfig(e.target.value, provider)}
                  placeholder={
                    provider === 'r2'
                    ? `R2_ACCOUNT_ID=...\nR2_ACCESS_KEY_ID=...\nR2_SECRET_ACCESS_KEY=...\nR2_BUCKET_NAME=...\nR2_PUBLIC_URL=...`
                    : `AWS_ACCESS_KEY_ID=...\nAWS_SECRET_ACCESS_KEY=...\nAWS_REGION=us-east-1\nAWS_BUCKET_NAME=...`
                  }
                  className={`w-full h-48 p-4 text-sm font-mono bg-slate-800 text-white rounded-xl focus:ring-2 outline-none resize-none shadow-inner ${provider === 'r2' ? 'focus:ring-indigo-500' : 'focus:ring-amber-500'}`}
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Config Summary / Edit Button */}
            {!showSettings && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${provider === 'r2' ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                   <span className="text-sm font-semibold text-slate-700">
                      {provider === 'r2' ? 'R2 Config Loaded' : 'AWS Config Loaded'}
                   </span>
                   <span className="text-xs text-slate-400 border-l border-slate-300 pl-2 ml-1">
                      Bucket: {parsedConfig.bucketName}
                   </span>
                </div>
                <button onClick={() => setShowSettings(true)} className="text-xs font-semibold text-blue-600 hover:underline">
                  Edit
                </button>
              </div>
            )}

            {showSettings && parsedConfig.bucketName && (
               <div className="flex justify-end mt-2">
                  <button onClick={handleClearConfig} className="text-xs text-red-400 hover:text-red-600">Clear Keys</button>
               </div>
            )}

            <hr className="my-8 border-slate-100" />

            {/* Upload Section */}
            <div className={`transition-all duration-500 ${!parsedConfig.bucketName ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${parsedConfig.bucketName ? (provider === 'r2' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white') : 'bg-slate-200 text-slate-600'}`}>2</span>
                  Upload Image
                </h2>

               <div className="space-y-4">
                  <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${provider === 'r2' ? 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50' : 'border-amber-100 bg-amber-50/30 hover:bg-amber-50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {!file ? (
                        <>
                          <div className={`p-3 rounded-full mb-3 group-hover:scale-110 transition-transform ${provider === 'r2' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                          </div>
                          <p className="mb-1 text-sm text-slate-600">Click to upload or drag and drop</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center animate-in zoom-in-90">
                          <p className="text-lg font-medium text-slate-700">{file.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0]); setUploadedUrl(null); }} accept="image/*" />
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`w-full py-4 px-4 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-[0.98] ${
                      !file || uploading
                        ? 'bg-slate-300 shadow-none cursor-not-allowed'
                        : (provider === 'r2' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700')
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
               </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Success */}
            {uploadedUrl && (
              <div className="mt-8 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                     <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">✓</div>
                     Upload Successful
                  </div>
                  <button onClick={copyToClipboard} className="text-xs bg-white text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm hover:bg-emerald-100 font-semibold transition-colors">
                    Copy Link
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-100 font-mono text-xs break-all text-slate-600 shadow-sm">
                  {uploadedUrl}
                </div>

                <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                  <img src={uploadedUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}