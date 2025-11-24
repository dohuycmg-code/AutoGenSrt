import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { SubtitleViewer } from './components/SubtitleViewer';
import { generateSubtitles } from './services/geminiService';
import { fileToBase64, formatFileSize, downloadAsZip, vttToSrt } from './utils/fileHelpers';
import { QueueItem } from './types';

const App: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleFilesSelect = (files: File[]) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      status: 'idle'
    }));
    
    setQueue(prev => [...prev, ...newItems]);
    // Automatically select the first new item if nothing is selected
    if (!selectedItemId && newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
    }
  };

  // Automatic Queue Processing
  useEffect(() => {
    const processNextItem = async () => {
      // If already processing or no items in queue, return
      if (isProcessing) return;

      // Find the next idle item
      const nextItem = queue.find(item => item.status === 'idle');
      if (!nextItem) return;

      setIsProcessing(true);

      // 1. Mark as processing
      setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'processing' } : q));

      try {
        const base64 = await fileToBase64(nextItem.file);
        const generatedText = await generateSubtitles(base64, nextItem.file.type);

        // 2. Mark as completed
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { 
          ...q, 
          status: 'completed', 
          subtitles: generatedText 
        } : q));

      } catch (error: any) {
        // 3. Mark as error
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { 
          ...q, 
          status: 'error', 
          error: error.message || 'Processing failed' 
        } : q));
      } finally {
        setIsProcessing(false);
      }
    };

    processNextItem();
  }, [queue, isProcessing]);

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueue(prev => prev.filter(q => q.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleRetry = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Reset status to idle so the useEffect picks it up again
    setQueue(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: 'idle', error: undefined, subtitles: undefined };
      }
      return q;
    }));
  };

  const reset = () => {
    // If processing, we might want to prevent clear, or handle cancel. 
    // For simplicity, we just clear, and the current process will finish but its result won't find the item.
    setQueue([]);
    setSelectedItemId(null);
    setIsProcessing(false);
  };

  const handleDownloadAll = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.subtitles);
    if (completedItems.length === 0) return;

    const filesToZip: {name: string, content: string}[] = [];

    completedItems.forEach(item => {
      // Robust way to get filename without extension
      const lastDotIndex = item.file.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? item.file.name.substring(0, lastDotIndex) : item.file.name;
      
      if (item.subtitles) {
        // Convert VTT to SRT for the download
        const srtContent = vttToSrt(item.subtitles);
        
        // Push only the .srt file as requested
        filesToZip.push({
          name: `${baseName}.srt`,
          content: srtContent
        });
      }
    });

    await downloadAsZip(filesToZip, "subtitles_srt.zip");
  };

  const activeItem = queue.find(q => q.id === selectedItemId);
  const completedCount = queue.filter(q => q.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Intro / Empty State */}
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
             <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Batch Audio to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Subtitles</span>
              </h2>
              <p className="text-lg text-slate-400">
                Upload a folder of audio files. We'll automatically process them one by one.
              </p>
            </div>
            <div className="w-full max-w-xl">
              <FileUploader onFilesSelect={handleFilesSelect} disabled={isProcessing} />
            </div>
          </div>
        ) : (
          /* Main Content - Split View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            
            {/* Left Sidebar: Queue List */}
            <div className="lg:col-span-4 flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
                <div>
                   <h3 className="font-semibold text-white">Queue ({queue.length})</h3>
                   <p className="text-xs text-slate-500">
                     {completedCount} completed 
                     {isProcessing && ' • Processing...'}
                   </p>
                </div>
                <div className="flex gap-2">
                   {completedCount > 0 && (
                     <button 
                       onClick={handleDownloadAll}
                       className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all text-xs font-medium border border-indigo-500/20 hover:border-indigo-500"
                       title="Download all as .srt (ZIP)"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l3 3m0 0l3-3m-3 3v-7.5" />
                       </svg>
                       Download All (.srt)
                     </button>
                   )}
                   <button 
                     onClick={reset}
                     className="text-xs text-slate-400 hover:text-white disabled:opacity-50 ml-1 px-2"
                   >
                     Clear
                   </button>
                </div>
              </div>
              
              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {queue.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`
                      group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                      ${selectedItemId === item.id 
                        ? 'bg-indigo-600/10 border-indigo-500/50' 
                        : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700'}
                    `}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {item.status === 'idle' && (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600" title="Waiting"></div>
                      )}
                      {item.status === 'processing' && (
                        <svg className="animate-spin w-5 h-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {item.status === 'completed' && (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {item.status === 'error' && (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedItemId === item.id ? 'text-white' : 'text-slate-300'}`}>
                        {item.file.name}
                      </p>
                      <p className="text-xs text-slate-500">{formatFileSize(item.file.size)}</p>
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Retry Button - Only for error or completed */}
                      {(item.status === 'error' || item.status === 'completed') && (
                        <button
                          onClick={(e) => handleRetry(item.id, e)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 transition-all"
                          title="Thử lại"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                      )}

                      {/* Remove Action (only if not processing this specific one) */}
                      {item.status !== 'processing' && (
                        <button 
                          onClick={(e) => removeItem(item.id, e)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-all"
                          title="Remove from queue"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ 
                        width: `${queue.length > 0 ? (queue.filter(q => q.status === 'completed' || q.status === 'error').length / queue.length) * 100 : 0}%` 
                      }}
                    ></div>
                 </div>
                 <p className="text-center text-xs text-slate-500 mt-2">
                   {queue.every(q => q.status === 'completed' || q.status === 'error') 
                     ? "All files processed" 
                     : "Processing queue automatically..."}
                 </p>
              </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full">
               {activeItem ? (
                 <div className="flex flex-col h-full">
                    {/* Detail Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/80">
                      <h2 className="text-lg font-semibold text-white truncate">{activeItem.file.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`text-xs px-2 py-0.5 rounded-full border 
                           ${activeItem.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                             activeItem.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                             activeItem.status === 'processing' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                             'bg-slate-800 border-slate-700 text-slate-400'
                           }
                         `}>
                           {activeItem.status.toUpperCase()}
                         </span>
                      </div>
                    </div>
                    
                    {/* Detail Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                       {activeItem.status === 'completed' && activeItem.subtitles ? (
                         // Using Key to force re-mount when switching items, resetting internal state like audio player
                         <SubtitleViewer key={activeItem.id} subtitles={activeItem.subtitles} audioFile={activeItem.file} />
                       ) : activeItem.status === 'error' ? (
                         <div className="flex flex-col items-center justify-center h-full text-red-400">
                            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-medium">Processing Failed</p>
                            <p className="text-sm opacity-70 mt-1 max-w-md text-center">{activeItem.error}</p>
                            
                            <button 
                              onClick={() => handleRetry(activeItem.id)}
                              className="mt-6 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                              Retry
                            </button>
                         </div>
                       ) : activeItem.status === 'processing' ? (
                         <div className="flex flex-col items-center justify-center h-full text-indigo-400">
                             <div className="relative w-16 h-16 mb-4">
                               <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
                               <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                             </div>
                             <p className="font-medium animate-pulse">Transcribing Audio...</p>
                             <p className="text-xs text-slate-500 mt-2">This may take a minute depending on file size.</p>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Queued for processing...</p>
                         </div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <p>Select a file from the queue to view details.</p>
                 </div>
               )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;