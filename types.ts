export interface SubtitleResponse {
  rawText: string;
  format: 'vtt' | 'srt';
}

export interface QueueItem {
  id: string;
  file: File;
  status: 'idle' | 'processing' | 'completed' | 'error';
  subtitles?: string;
  error?: string;
}

export type AudioFile = File | null;