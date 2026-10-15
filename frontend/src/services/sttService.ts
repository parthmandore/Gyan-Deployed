/**
 * Purpose: Robust Speech-to-Text (STT) Client Service.
 *          In Gyan Standalone Offline Deployment, speech recognition is intentionally
 *          disabled to eliminate remote Whisper dependencies and ensure 100% offline reliability.
 * Module: Services
 * Folder: frontend/src/services
 */

export type STTErrorType =
  | 'NONE'
  | 'CONNECTION_REFUSED'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export interface TranscribeResponse {
  success: boolean;
  recognized_text: string;
  language_used: string;
  is_empty: boolean;
  latency_ms: number;
  error_type: STTErrorType;
  status_code?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error' | 'offline';
  model_loaded: boolean;
  model_name?: string;
  supported_languages?: string[];
  version?: string;
  error?: string;
}

/**
 * Checks if the Speech AI backend is reachable.
 * In standalone deployment, returns offline immediately without making network calls.
 */
export const checkSTTHealth = async (): Promise<HealthResponse> => {
  return {
    status: 'offline',
    model_loaded: false,
    error: 'Speech recognition disabled in standalone offline deployment',
  };
};

/**
 * Transcribes audio.
 * In standalone deployment, returns offline response immediately without network calls.
 */
export const transcribeAudio = async (
  _audioData: Blob | string,
  language: 'en' | 'hi' | 'mr' = 'en',
  _timeoutMs: number = 0,
  _retryCount: number = 0
): Promise<TranscribeResponse> => {
  return {
    success: false,
    recognized_text: '',
    language_used: language,
    is_empty: true,
    latency_ms: 0,
    error_type: 'NONE',
    error: 'Speech recognition is disabled in offline standalone mode',
  };
};
