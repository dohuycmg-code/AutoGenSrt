import React, { useEffect, useState, useRef } from 'react';
import { downloadTextFile, vttToSrt } from '../utils/fileHelpers';

interface SubtitleViewerProps {
  subtitles: string;
  audioFile: File | null;
}

export const SubtitleViewer: React.FC<SubtitleViewerProps> = ({ subtitles, audioFile }) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'raw'>('raw');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate Audio URL
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioFile]);

  // Generate VTT URL for track element
  useEffect(() => {
    if (subtitles) {
      const blob = new Blob([subtitles], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setVttUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setVttUrl(null);
    }
  }, [subtitles]);

  const handleDownloadVtt = () => {
    const fileName = audioFile ? `${audioFile.name.split('.')[0]}.vtt` : 'subtitles.vtt';
    downloadTextFile(subtitles, fileName, 'text/vtt');
  };

  const handleDownloadSrt = () => {
    const srtContent = vttToSrt(subtitles);
    const fileName = audioFile ? `${audioFile.name.split('.')[0]}.srt` : 'subtitles.srt';
    downloadTextFile(srtContent, fileName, 'text/plain');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(subtitles);
    alert('Copied VTT to clipboard!');
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Audio Preview with Captions */}
      {audioUrl && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
           <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Preview
           </h3>
           <audio 
             ref={audioRef} 
             controls 
             className="w-full h-10 rounded-lg accent-indigo-500" 
             src={audioUrl}
             crossOrigin="anonymous"
           >
             {vttUrl && <track kind="captions" src={vttUrl} srcLang="en" label="English" default />}
             Your browser does not support the audio element.
           </audio>
        </div>
      )}

      {/* Editor/Viewer */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col h-[500px]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900/50 shrink-0">
           <div className="flex space-x-2">
            //  <button 
            //    onClick={() => setActiveTab('preview')}
            //    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            //  >
            //    Pretty View
            //  </button>
             <button 
               onClick={() => setActiveTab('raw')}
               className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${activeTab === 'raw' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               Raw WebVTT
             </button>
           </div>
           <div className="flex items-center space-x-1">
              <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Copy to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              </button>
              
              {/* Divider */}
              <div className="w-px h-4 bg-slate-700 mx-1"></div>

              <button onClick={handleDownloadVtt} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-700" title="Download .vtt">
                VTT
              </button>
              <button onClick={handleDownloadSrt} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors rounded hover:bg-indigo-500/10" title="Download .srt">
                SRT
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l3 3m0 0l3-3m-3 3v-7.5" />
                </svg>
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'raw' ? (
             <textarea 
               className="w-full h-full bg-slate-900/50 p-4 text-slate-300 font-mono text-sm focus:outline-none resize-none"
               value={subtitles}
               readOnly
             />
          ) : (
            <div className="w-full h-full bg-slate-900/50 overflow-y-auto p-4 space-y-4">
               {subtitles.split('\n\n').map((block, index) => {
                   // Basic parsing for display: [WEBVTT line ignored], [time] [text]
                   if (block.trim() === 'WEBVTT') return null;
                   const lines = block.split('\n');
                   const time = lines.find(l => l.includes('-->'));
                   const textLines = lines.filter(l => !l.includes('-->') && l.trim() !== 'WEBVTT' && /^\d/.test(l) === false);
                   
                   if (!time) return null;

                   return (
                       <div key={index} className="flex gap-4 group hover:bg-slate-800/50 p-2 rounded transition-colors">
                           <div className="w-28 flex-shrink-0 pt-1">
                               <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded select-all whitespace-nowrap">{time}</span>
                           </div>
                           <div className="flex-1 text-slate-300 text-sm group-hover:text-white transition-colors">
                               {textLines.map((l, i) => <p key={i}>{l}</p>)}
                           </div>
                       </div>
                   )
               })}
               {subtitles.length === 0 && <p className="text-slate-500 text-center mt-10">No content available.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};