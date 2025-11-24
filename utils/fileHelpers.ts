import JSZip from 'jszip';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadTextFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const vttToSrt = (vtt: string): string => {
  if (!vtt) return '';
  
  // 1. Remove WEBVTT header (and any metadata headers usually followed by a blank line)
  // We remove the first line if it is WEBVTT, and any subsequent blank lines at start
  const cleanVtt = vtt.replace(/^WEBVTT\s*(\r\n|\n)+/, '');
  
  const blocks = cleanVtt.split(/\n\n+/);
  
  return blocks.map((block) => {
      const lines = block.split('\n');
      
      // Find timestamp line (e.g. 00:00:00.000 --> 00:00:04.000)
      const timeIdx = lines.findIndex(l => l.includes('-->'));
      if (timeIdx === -1) return '';
      
      // Fix timestamps: replace dots with commas for SRT format (e.g. 00:00.000 -> 00:00,000)
      lines[timeIdx] = lines[timeIdx].replace(/\./g, ',');
      
      // JOIN lines directly. We do NOT add the index number (${index + 1}) as requested.
      return `${lines.join('\n')}`;
  }).filter(b => b.trim() !== '').join('\n\n');
};

export const downloadAsZip = async (files: {name: string, content: string}[], zipFilename: string = "subtitles.zip") => {
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.name, file.content);
  });

  const content = await zip.generateAsync({type: "blob"});
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};