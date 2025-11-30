// src/app/page.js
"use client";
import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'uploader_config_v2';

// --- Helpers ---

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

// --- Sub-Components ---

const ConfigTab = ({ configText, setConfigText, provider, setProvider, saveConfig, handleClear }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Credentials</h3>
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

      <div className="flex justify-end">
        <button onClick={handleClear} className="text-sm text-red-400 hover:text-red-600 font-medium">
          Clear Saved Keys
        </button>
      </div>
    </div>
  );
};

const UploadTab = ({ file, setFile, uploading, handleUpload, uploadedUrl, setUploadedUrl, error, provider, ready }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedUrl);
    alert("Copied!");
  };

  if (!ready) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>Please configure your credentials in the <strong>Config</strong> tab first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-4">
        <label className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${provider === 'r2' ? 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50' : 'border-amber-100 bg-amber-50/30 hover:bg-amber-50'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {!file ? (
              <>
                <div className={`p-3 rounded-full mb-3 group-hover:scale-110 transition-transform ${provider === 'r2' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="mb-1 text-sm text-slate-600 font-medium">Click to upload or drag and drop</p>
              </>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in-90">
                <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2 text-2xl">📄</div>
                <p className="text-lg font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>
          <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0]); setUploadedUrl(null); }} />
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-3.5 px-4 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-[0.98] ${!file || uploading
              ? 'bg-slate-300 shadow-none cursor-not-allowed'
              : (provider === 'r2' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700')
            }`}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">{error}</div>
        </div>
      )}

      {uploadedUrl && (
        <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
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
          {file?.type?.startsWith('image/') && (
            <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
              <img src={uploadedUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BrowseTab = ({ parsedConfig, provider, ready }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prefix, setPrefix] = useState(''); // The actual S3 path (always ends in /)
  const [manualPath, setManualPath] = useState(''); // What the user types in the input
  const [error, setError] = useState(null);

  // Sync manual input when the actual prefix changes (e.g. clicking folders)
  useEffect(() => {
    setManualPath(prefix);
  }, [prefix]);

  const fetchList = useCallback(async (currentPrefix = '') => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/list", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          config: parsedConfig,
          prefix: currentPrefix
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch list");

      const folders = (data.commonPrefixes || []).map(p => ({ type: 'folder', name: p.prefix, key: p.prefix }));
      const files = (data.contents || []).map(f => ({ type: 'file', name: f.key.split('/').pop(), key: f.key, size: f.size }));

      setItems([...folders, ...files]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [parsedConfig, provider, ready]);

  // Fetch when prefix changes
  useEffect(() => {
    fetchList(prefix);
  }, [prefix, fetchList]);

  // Handle "Enter" key in the input box
  const handlePathSubmit = (e) => {
    if (e.key === 'Enter') {
      let val = manualPath.trim();

      // 1. Remove leading slash if user typed "/folder"
      if (val.startsWith('/')) val = val.substring(1);

      // 2. Logic: If it looks like a file (doesn't end in /), strip the filename
      //    This allows pasting "folder/sub/image.jpg" and jumping to "folder/sub/"
      if (val.length > 0 && !val.endsWith('/')) {
         // Check if it's likely a folder or file.
         // If user typed "myfolder", they probably want "myfolder/".
         // But if they pasted "myfolder/file.png", they want "myfolder/"

         // Heuristic: If it has an extension, assume file. If not, append slash.
         if (val.includes('.')) {
            const parts = val.split('/');
            parts.pop(); // Remove filename
            val = parts.length > 0 ? parts.join('/') + '/' : '';
         } else {
            val = val + '/';
         }
      }

      setPrefix(val);
      // The useEffect above will catch the prefix change and fetch
    }
  };

  const handleDownload = async (key) => {
    if (provider === 'r2' && parsedConfig.publicDomain) {
      const url = `${parsedConfig.publicDomain}/${key}`;
      window.open(url, '_blank');
      return;
    }

    try {
      const btn = document.activeElement;
      if(btn && btn.tagName === 'BUTTON') { btn.innerText = "⏳"; btn.disabled = true; }

      const res = await fetch("/api/presign", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config: parsedConfig, key })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get download link");
      window.open(data.url, '_blank');

    } catch (err) {
      alert("Download Error: " + err.message);
    } finally {
       const btn = document.activeElement;
       if(btn && btn.tagName === 'BUTTON') { btn.innerText = "Download"; btn.disabled = false; }
    }
  };

  const goUp = () => {
    const parts = prefix.split('/').filter(Boolean);
    parts.pop();
    setPrefix(parts.length ? parts.join('/') + '/' : '');
  };

  if (!ready) {
    return <div className="text-center py-10 text-slate-500">Please configure credentials first.</div>;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px]">

      {/* --- EDITED: Navigation Bar --- */}
      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg text-sm font-mono border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        <button onClick={() => setPrefix('')} className="text-indigo-600 hover:underline shrink-0 px-2 font-bold">root /</button>

        <input
          type="text"
          value={manualPath}
          onChange={(e) => setManualPath(e.target.value)}
          onKeyDown={handlePathSubmit}
          placeholder="Paste path/key here and hit Enter..."
          className="bg-transparent w-full outline-none text-slate-700 placeholder-slate-400"
        />

        {loading && <span className="animate-spin text-slate-400">↻</span>}
      </div>

      {prefix && (
         <button onClick={goUp} className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 mb-2 font-medium px-1">
            ← Up Level
         </button>
      )}

      {error && (
         <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
           {error}
         </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
           Folder is empty
        </div>
      )}

      <div className="space-y-1">
        {!loading && items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors group">
            <div className="flex items-center gap-3 overflow-hidden">
               <span className="text-xl opacity-80">{item.type === 'folder' ? '📁' : '📄'}</span>
               <div className="flex flex-col min-w-0">
                 <button
                    onClick={() => item.type === 'folder' ? setPrefix(item.key) : handleDownload(item.key)}
                    className={`text-sm font-medium truncate hover:text-indigo-600 text-left ${item.type === 'folder' ? 'text-slate-800' : 'text-slate-600'}`}
                 >
                    {item.type === 'folder' ? item.name.replace(prefix, '') : item.name}
                 </button>
                 {item.type === 'file' && <span className="text-xs text-slate-400">{(item.size / 1024).toFixed(1)} KB</span>}
               </div>
            </div>
            {item.type === 'file' && (
                <button onClick={() => handleDownload(item.key)} className="opacity-0 group-hover:opacity-100 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all">
                    Download
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Main Application ---

export default function Uploader() {
  const [activeTab, setActiveTab] = useState('config');
  const [provider, setProvider] = useState('r2');
  const [configText, setConfigText] = useState('');
  const [parsedConfig, setParsedConfig] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setProvider(data.provider || 'r2');
      setConfigText(data.text || '');
      // Refactoring Requirement: If config exists, start in upload tab
      if (data.text) setActiveTab('upload');
    }
    setIsLoaded(true);
  }, []);

  // Parse config whenever text or provider changes
  useEffect(() => {
    const config = parseEnvConfig(configText, provider);
    setParsedConfig(config);
  }, [configText, provider]);

  const saveConfig = (text, prov) => {
    setConfigText(text);
    setProvider(prov);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, provider: prov }));
  };

  const handleClearConfig = () => {
    if (confirm("Clear saved credentials?")) {
      localStorage.removeItem(STORAGE_KEY);
      setConfigText('');
      setParsedConfig({});
      setActiveTab('config');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);

    // Append all config keys dynamically
    Object.keys(parsedConfig).forEach(key => {
      if (parsedConfig[key]) formData.append(key, parsedConfig[key]);
    });

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

  if (!isLoaded) return null;

  const isConfigReady = !!parsedConfig.bucketName;

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
            S3 Tools
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {['config', 'upload', 'browse'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-semibold text-center border-b-2 transition-colors focus:outline-none capitalize ${activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">

            {activeTab === 'config' && (
              <ConfigTab
                configText={configText}
                setConfigText={setConfigText}
                provider={provider}
                setProvider={setProvider}
                saveConfig={saveConfig}
                handleClear={handleClearConfig}
              />
            )}

            {activeTab === 'upload' && (
              <UploadTab
                file={file}
                setFile={setFile}
                uploading={uploading}
                handleUpload={handleUpload}
                uploadedUrl={uploadedUrl}
                setUploadedUrl={setUploadedUrl}
                error={error}
                provider={provider}
                ready={isConfigReady}
              />
            )}

            {activeTab === 'browse' && (
              <BrowseTab
                parsedConfig={parsedConfig}
                provider={provider}
                ready={isConfigReady}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}