import React, { useRef, useState } from 'react';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (fileList: File[]) => {
    const validFiles: File[] = [];
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB

    fileList.forEach(file => {
      // Check for audio/video types OR common extensions if mime type is generic/missing
      const isAudioVideoType = file.type.startsWith('audio/') || file.type.startsWith('video/');
      const hasValidExtension = /\.(mp3|wav|m4a|mp4|mpeg|webm|ogg|flac|aac|wma|mov|mkv)$/i.test(file.name);

      if (isAudioVideoType || hasValidExtension) {
        // Check size limit (100MB)
        if (file.size <= maxSizeBytes) {
          validFiles.push(file);
        } else {
          console.warn(`Skipped ${file.name}: exceeds 100MB limit.`);
        }
      }
    });

    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    } else {
      // Only alert if the user actually tried to upload something but nothing was valid
      if (fileList.length > 0) {
        alert('No valid audio/video files found under 100MB in the selection.');
      }
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
          ${isDragOver 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {/* Helper for directory selection */}
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          // @ts-ignore - React doesn't fully support webkitdirectory typing yet
          webkitdirectory=""
          mozdirectory=""
          directory=""
          multiple
          onChange={handleInputChange}
          disabled={disabled}
        />
        
        <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className={`p-4 rounded-full ${isDragOver ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'} transition-colors`}>
            {/* Folder Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Upload Folder</h3>
            <p className="text-slate-400 mt-2">Click to select a folder or drop files here.</p>
            <p className="text-slate-500 text-sm mt-1">Files are processed automatically. Max 100MB per file.</p>
          </div>
        </div>
      </div>
    </div>
  );
};