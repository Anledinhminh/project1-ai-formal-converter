import React, { useEffect, useRef, useState } from 'react';
import {
  Settings,
  Play,
  Cpu,
  MessageSquare,
  Terminal,
  Activity,
  Zap,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [apiUrl, setApiUrl] = useState(''); // URL Ngrok
  const [context, setContext] = useState('');
  const [intent, setIntent] = useState('');
  const [inputText, setInputText] = useState('');

  const [reasoning, setReasoning] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState('reasoning'); // 'reasoning' | 'result'
  const [lastRunAt, setLastRunAt] = useState(null);

  const inputRef = useRef(null);
  // Ref để lưu trữ text tạm thời khi stream (tránh render lại quá nhiều lần)
  const fullResponseRef = useRef(''); 

  // --- HELPERS ---
  const isValidUrl = (u) => {
    try {
      if (!u) return false;
      const url = new URL(u);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  const resetOutputs = () => {
    setReasoning('');
    setResult('');
    fullResponseRef.current = '';
  };

  // --- HANDLERS (REAL LOGIC) ---
  const handleExecute = async () => {
    // 1. Validation
    if (!inputText.trim()) {
      alert("Please enter some input text!");
      return;
    }
    if (!apiUrl || !isValidUrl(apiUrl)) {
      alert("Please enter a valid Ngrok API URL first!");
      return;
    }

    // 2. Setup State
    setIsProcessing(true);
    setTab('reasoning');
    setReasoning('');
    setResult('');
    fullResponseRef.current = ''; // Reset buffer
    
    // Đánh dấu mốc thời gian
    setLastRunAt(new Date());

    try {
      // 3. Gọi API Streaming
      const response = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: context,
          intent: intent,
          input_text: inputText // Backend yêu cầu key là input_text
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // 4. Xử lý Stream (Đọc từng chunk dữ liệu)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      let buffer = ""; // Buffer để xử lý các dòng JSON bị cắt giữa chừng

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // API trả về dạng: {"text": "A"}\n{"text": "B"}
          // Chúng ta tách theo dấu xuống dòng
          const lines = buffer.split('\n');
          
          // Giữ lại phần cuối cùng (có thể là dòng chưa trọn vẹn) để nối vào lần sau
          buffer = lines.pop(); 

          for (const line of lines) {
            if (line.trim() !== '') {
              try {
                const json = JSON.parse(line);
                if (json.text) {
                  // Cộng dồn vào biến Ref tổng
                  fullResponseRef.current += json.text;
                  
                  // 5. Logic tách Reasoning và Result
                  // Kiểm tra xem đã gặp dấu hiệu phân cách chưa
                  const separator = "### Result:"; 
                  const parts = fullResponseRef.current.split(separator);

                  if (parts.length > 1) {
                    // Đã tìm thấy separator -> Tách ra
                    setReasoning(parts[0].trim());
                    setResult(parts[1].trim());
                    
                    // Nếu tab hiện tại là reasoning mà đã có result, có thể switch tab (optional)
                    // setTab('result'); 
                  } else {
                    // Chưa thấy separator -> Tất cả vẫn là reasoning
                    setReasoning(fullResponseRef.current);
                  }
                }
              } catch (e) {
                console.warn("Lỗi parse JSON chunk:", e);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error(error);
      setReasoning(`❌ Error: ${error.message}\n\nMake sure the Colab server is running and the Ngrok URL is correct.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + Enter to run
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing) handleExecute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputText, context, intent, apiUrl, isProcessing]);

  // Clipboard & download helpers
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  };

  const downloadResult = (filename = 'result.txt') => {
    const blob = new Blob([result || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // --- UI COMPONENTS ---
  const InputHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50 rounded-t-2xl">
      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400 truncate mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Cpu className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">The Face AI</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Reasoning Engine v1.0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-xl">
            <label htmlFor="apiUrl" className="sr-only">API / Ngrok URL</label>
            <div className={`flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border transition-all duration-300 w-full group ${isValidUrl(apiUrl) ? 'border-green-200 focus-within:ring-2 focus-within:ring-green-100' : 'border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
              <Settings className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                id="apiUrl"
                type="url"
                inputMode="url"
                placeholder="Paste ngrok URL (e.g., https://xyz.ngrok-free.app)"
                className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />

              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                {apiUrl ? (
                  isValidUrl(apiUrl) ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px] font-semibold uppercase">Ready</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-semibold uppercase">Invalid</span>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] font-medium text-gray-400 uppercase">Offline</span>
                )}
              </div>
            </div>
          </div>
          
           {/* Reset Button */}
           <button
             className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 shadow-sm"
             onClick={resetOutputs}
             aria-label="Reset outputs"
           >
             <RotateCw className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Reset</span>
           </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
          {/* LEFT COLUMN - INPUTS */}
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden gap-4">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar pb-2">
              
              {/* Context Input */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 transition-shadow hover:shadow-md group focus-within:ring-2 focus-within:ring-indigo-500/10">
                <InputHeader icon={Terminal} title="System Context" subtitle="Define persona, tone, constraints" />
                <div className="p-1">
                  <textarea
                    id="context"
                    ref={inputRef}
                    className="w-full min-h-[80px] p-4 text-sm resize-y bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 leading-relaxed"
                    placeholder="E.g: You are a professional email assistant..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </section>

              {/* Intent Input */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 transition-shadow hover:shadow-md group focus-within:ring-2 focus-within:ring-purple-500/10">
                <InputHeader icon={Activity} title="User Intent" subtitle="What should the assistant achieve?" />
                <div className="p-1">
                  <textarea
                    id="intent"
                    className="w-full min-h-[80px] p-4 text-sm resize-y bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 leading-relaxed"
                    placeholder="E.g: Create a polite decline message..."
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                  />
                </div>
              </section>

              {/* Main Input */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[250px] transition-shadow hover:shadow-md group focus-within:ring-2 focus-within:ring-blue-500/10">
                <InputHeader icon={MessageSquare} title="Input Content" subtitle="Paste text to analyze (Ctrl+Enter to run)" />
                <div className="p-1 flex flex-col flex-1">
                  <textarea
                    id="inputText"
                    className="w-full flex-1 p-4 text-sm resize-none bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 font-mono leading-relaxed"
                    placeholder="Paste the text to analyze here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
              </section>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2.5 ${
                  isProcessing 
                    ? 'bg-gray-800 cursor-not-allowed opacity-80' 
                    : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:shadow-indigo-500/40 bg-[length:200%_auto] hover:bg-right transition-all duration-500'
                }`}
                onClick={handleExecute}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path>
                    </svg>
                    <span className="tracking-wide">PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" /> 
                    <span className="tracking-wide">ANALYZE & EXECUTE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN - OUTPUTS */}
          <div className="lg:col-span-7 flex flex-col h-full gap-5">
            
            {/* Reasoning Terminal */}
            <div className="flex-1 bg-gray-950 rounded-2xl shadow-xl shadow-gray-900/20 overflow-hidden flex flex-col border border-gray-800 ring-1 ring-white/10">
              {/* Terminal Header */}
              <div className="bg-gray-900/50 px-4 py-3 flex items-center justify-between border-b border-gray-800 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600/50 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/90 border border-yellow-600/50 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600/50 shadow-inner" />
                  </div>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    stream_output.log
                  </span>
                </div>

                <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-800">
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tab === 'reasoning' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                    onClick={() => setTab('reasoning')}
                  >
                    Reasoning
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tab === 'result' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                    onClick={() => setTab('result')}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed custom-scrollbar bg-gray-950">
                {tab === 'reasoning' ? (
                  <div className="relative">
                    {!reasoning && !isProcessing && (
                      <div className="text-gray-600 italic mt-2">// Waiting for execution command...</div>
                    )}
                    <pre className="whitespace-pre-wrap text-indigo-200/90 font-medium">
                      {reasoning}
                      {isProcessing && !reasoning && (
                         <span className="inline-block w-2 h-4 align-middle bg-indigo-500 animate-pulse ml-1"/>
                      )}
                      {isProcessing && reasoning && (
                        <span className="animate-pulse text-indigo-500">_</span>
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur py-2 border-b border-gray-800 z-10">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Structured Output</div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" 
                          onClick={() => copyToClipboard(result)}
                          title="Copy JSON"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" 
                          onClick={() => downloadResult()}
                          title="Download JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 overflow-x-auto"> 
                      {result ? (
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap text-emerald-300">{result}</pre>
                      ) : (
                        <div className="text-gray-600 italic">// Result object is empty</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Final Result Card */}
            <div className="min-h-[200px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                   <div className="p-1.5 bg-indigo-100 rounded-md">
                     <CheckCircle className="w-4 h-4 text-indigo-600" />
                   </div>
                   <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Final Output</h3>
                </div>
                <button 
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-1.5" 
                  onClick={() => copyToClipboard(result)}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <div className="p-6 prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-y-auto max-h-[300px] custom-scrollbar">
                {result ? (
                  <div className="whitespace-pre-wrap font-medium">{result}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400 gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 animate-spin-slow"></div>
                    <span className="text-xs uppercase tracking-wider font-medium">Waiting for result...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}