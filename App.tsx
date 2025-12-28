
import React, { useState, useRef, useEffect } from 'react';
import { PromptCategory, PromptArchitectResponse, MediaData } from './types';
import { architectPrompt, getApiKey } from './services/geminiService';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PromptCategory>(PromptCategory.IMAGE);
  const [userInput, setUserInput] = useState('');
  const [media, setMedia] = useState<MediaData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PromptArchitectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'active' | 'missing'>('checking');

  useEffect(() => {
    // Check for API key on mount and set status
    const key = getApiKey();
    setApiKeyStatus(key ? 'active' : 'missing');
  }, []);

  useEffect(() => {
    if (copyFeedback) {
      const timer = setTimeout(() => setCopyFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedback]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1 || item.type.indexOf('video') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1];
              setMedia({
                base64: base64String,
                mimeType: file.type,
                fileName: 'Pasted Content Stream',
                type: file.type.startsWith('video') ? 'video' : 'image'
              });
              setActiveCategory(PromptCategory.MEDIA_ANALYSIS);
              setError(null);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setMedia({
        base64: base64String,
        mimeType: file.type,
        fileName: file.name,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
      setActiveCategory(PromptCategory.MEDIA_ANALYSIS);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleArchitect = async () => {
    if (apiKeyStatus === 'missing') {
      setError("CRITICAL: API_KEY not detected in production environment.");
      return;
    }
    if (!userInput.trim() && !media) {
      setError("Provide a neural idea or paste/upload a data file.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const response = await architectPrompt(activeCategory, userInput, media || undefined);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Construction failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(type);
  };

  const reset = () => {
    setMedia(null);
    setResult(null);
    setUserInput('');
    setActiveCategory(PromptCategory.IMAGE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (apiKeyStatus === 'missing') {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 text-[#1DCD9F] font-mono">
        <div className="max-w-2xl w-full border-4 border-[#1DCD9F] p-10 rounded-lg bg-[#111] shadow-[0_0_50px_rgba(29,205,159,0.2)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-600 text-white rounded-sm flex items-center justify-center font-bold text-2xl animate-pulse">!</div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Integration Required</h1>
          </div>
          <p className="text-sm leading-loose mb-8 opacity-80 uppercase tracking-wide">
            The architect is offline. You must add your Google AI API Key to Vercel to activate the neural core.
          </p>
          <div className="space-y-6">
            <section className="bg-black/50 p-4 rounded border border-[#1DCD9F]/20">
              <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4">Launch Instructions:</h2>
              <ol className="list-decimal list-inside space-y-3 text-[11px] opacity-70">
                <li>Open your Project on <a href="https://vercel.com" className="underline text-[#1DCD9F]">Vercel.com</a></li>
                <li>Go to <span className="text-white">Settings</span> &gt; <span className="text-white">Environment Variables</span></li>
                <li>Key: <span className="text-[#1DCD9F] font-bold">API_KEY</span></li>
                <li>Value: <span className="text-[#1DCD9F] font-bold">[Your Key from AI Studio]</span></li>
                <li>Go to <span className="text-white">Deployments</span> and select <span className="text-white">Redeploy</span></li>
              </ol>
            </section>
            <Button onClick={() => window.location.reload()} className="w-full">Re-Check Connection</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-slate-100 selection:bg-[#1DCD9F] selection:text-[#000000]">
      {copyFeedback && (
        <div className="fixed top-24 right-4 z-[100] bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded-lg font-black uppercase text-xs shadow-[0_0_20px_rgba(29,205,159,0.5)] animate-bounce">
          {copyFeedback} COPIED TO BUFFER
        </div>
      )}

      <header className="border-b-4 border-[#1DCD9F] bg-[#000000] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1DCD9F] text-[#000000] rounded-sm flex items-center justify-center font-bold text-2xl transform hover:rotate-6 transition-transform shadow-lg shadow-[#1DCD9F]/20">A</div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-[#1DCD9F]">Prompt Architect</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#169976]">Cybernetic Deconstruction Unit</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-mono text-[#169976] uppercase tracking-widest font-bold">Terminal ID: GEM-3-PR0</span>
            <span className="text-[10px] text-[#1DCD9F] font-bold animate-pulse">SYSTEMS NOMINAL</span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-[#222222] border-2 border-[#1DCD9F] rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(22,153,118,1)]">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-[#1DCD9F]">
                <span className="w-3 h-3 bg-[#1DCD9F] rounded-full animate-ping"></span>
                Input Terminal
              </h2>

              {!media && (
                <div className="grid grid-cols-3 gap-2 mb-8 bg-[#000000] p-1.5 rounded-lg border border-[#169976]/30">
                  {Object.values(PromptCategory).filter(c => c !== PromptCategory.MEDIA_ANALYSIS).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`py-2.5 px-3 rounded-md text-[10px] font-black transition-all uppercase tracking-tighter ${
                        activeCategory === cat ? 'bg-[#1DCD9F] text-[#000000]' : 'text-[#169976] hover:bg-[#222222]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-8">
                <label className="block text-xs font-black text-[#169976] uppercase mb-2 tracking-widest">Neural Reference</label>
                {media ? (
                  <div className="relative group rounded-lg overflow-hidden border-2 border-[#1DCD9F]">
                    {media.type === 'image' ? (
                      <img src={`data:${media.mimeType};base64,${media.base64}`} alt="Preview" className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video bg-[#000000] flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#1DCD9F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <button onClick={reset} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded hover:bg-red-500 shadow-lg transition-transform hover:scale-110">✕</button>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#1DCD9F] text-[#000000] p-2 text-[10px] uppercase font-black truncate">{media.fileName}</div>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dotted border-[#169976]/50 hover:border-[#1DCD9F] rounded-lg p-10 flex flex-col items-center justify-center gap-4 cursor-pointer group transition-all bg-[#000000] hover:bg-[#111]">
                    <div className="w-16 h-16 rounded-full bg-[#222222] border-2 border-[#169976] flex items-center justify-center group-hover:scale-110 transition-all shadow-lg"><svg className="w-8 h-8 text-[#1DCD9F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></div>
                    <p className="text-sm font-black uppercase text-[#1DCD9F]">Ingest Data</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <label className="block text-xs font-black text-[#169976] uppercase mb-2 tracking-widest">Semantic Context</label>
                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={media ? "Refine deconstruction..." : "Raw vision descriptors..."} className="w-full h-32 bg-[#000000] border-2 border-[#1DCD9F] rounded-lg p-4 text-sm text-white focus:ring-4 focus:ring-[#1DCD9F]/10 outline-none transition-all resize-none font-medium placeholder-[#169976]/50 shadow-inner" />
              </div>

              {error && <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-700 rounded-lg text-red-500 text-[11px] font-black uppercase tracking-tight">{error}</div>}

              <Button onClick={handleArchitect} isLoading={isGenerating} className="w-full h-14" variant="primary">
                {media ? 'Execute Deconstruction' : `Synthesize Logic`}
              </Button>
            </section>
          </div>

          <div className="lg:col-span-7">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-[#222222] border-4 border-[#1DCD9F] border-dotted rounded-lg">
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 border-8 border-[#169976]/10 rounded-full"></div>
                  <div className="absolute inset-0 border-8 border-[#1DCD9F] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-2xl font-black text-[#1DCD9F] mb-2 uppercase italic">Deconstructing...</h3>
              </div>
            ) : result ? (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-[#222222] border-2 border-[#169976] rounded-lg overflow-hidden shadow-[8px_8px_0px_0px_rgba(29,205,159,0.3)]">
                  <div className="bg-[#169976] px-6 py-4 border-b-2 border-[#000000] flex items-center justify-between"><h3 className="font-black text-xs uppercase tracking-widest text-[#000000]">Logic Breakdown</h3></div>
                  <div className="p-8"><p className="text-white leading-relaxed font-medium italic text-lg border-l-4 border-[#1DCD9F] pl-6">"{result.analysis}"</p></div>
                </div>
                <div className="bg-[#000000] border-2 border-[#1DCD9F] rounded-lg overflow-hidden shadow-[8px_8px_0px_0px_rgba(29,205,159,1)]">
                  <div className="bg-[#1DCD9F] px-6 py-4 border-b-2 border-[#000000] flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#000000]">Construct Output</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(result.optimizedPrompt, 'PROMPT')} className="text-[10px] bg-[#000000] text-[#1DCD9F] px-3 py-1.5 rounded font-black uppercase border border-[#000000] hover:bg-[#111]">Copy Plain</button>
                      <button onClick={() => handleCopy(`/imagine prompt: ${result.optimizedPrompt} --v 6.1 --stylize 250`, 'MIDJOURNEY')} className="text-[10px] bg-[#222222] text-[#1DCD9F] px-3 py-1.5 rounded font-black uppercase border border-[#1DCD9F]/30 hover:bg-[#333]">Midjourney Format</button>
                    </div>
                  </div>
                  <div className="p-8 bg-[#222222]/50 font-mono text-base leading-loose"><div className="whitespace-pre-wrap text-[#1DCD9F] font-bold">{result.optimizedPrompt}</div></div>
                </div>
                <div className="bg-[#169976] border-2 border-[#1DCD9F] rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                  <h3 className="text-[#000000] font-black mb-3 flex items-center gap-2 uppercase italic">Neural Optimization Tip</h3>
                  <p className="text-white text-sm font-bold uppercase relative z-10">{result.proTip}</p>
                </div>
                <div className="flex justify-center pt-4"><Button variant="outline" onClick={reset} className="border-4 border-[#1DCD9F]">Reset Buffer</Button></div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-[#222222]/30 border-4 border-[#169976] border-dotted rounded-lg text-[#169976]">
                <p className="text-center font-black uppercase tracking-widest text-lg text-[#1DCD9F]">Buffer Empty</p>
                <p className="text-[10px] mt-2 font-bold uppercase opacity-50 text-center max-w-xs">Terminal awaiting sequence ingestion. Paste or upload data to begin deconstruction.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t-4 border-[#1DCD9F] bg-[#000000]">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <p className="text-[#169976] text-[8px] font-black uppercase tracking-[0.4em]">© 2024 Multi-Modal Prompt Architect // V4.1.0</p>
          <div className="flex items-center gap-3">
             <span className="text-[8px] font-black text-[#169976] uppercase tracking-widest">System Health:</span>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${apiKeyStatus === 'active' ? 'bg-[#1DCD9F] shadow-[0_0_5px_#1DCD9F]' : 'bg-red-600'}`}></div>
                <span className={`text-[8px] font-black uppercase ${apiKeyStatus === 'active' ? 'text-[#1DCD9F]' : 'text-red-600'}`}>
                  API {apiKeyStatus === 'active' ? 'CONNECTED' : 'OFFLINE'}
                </span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
