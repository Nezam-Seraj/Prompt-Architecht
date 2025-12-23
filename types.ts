
export enum PromptCategory {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  SEO = 'SEO',
  MEDIA_ANALYSIS = 'MEDIA_ANALYSIS'
}

export interface PromptArchitectResponse {
  analysis: string;
  optimizedPrompt: string;
  proTip: string;
}

export interface MediaData {
  base64: string;
  mimeType: string;
  fileName: string;
  type: 'image' | 'video';
}
