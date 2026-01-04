/**
 * Voice Input Service
 * Wrapper for Web Speech API (SpeechRecognition)
 */

// Type definitions for Web Speech API
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message: string;
}

// Get SpeechRecognition constructor (browser-specific)
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export interface VoiceInputCallbacks {
    onStart?: () => void;
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
}

export interface VoiceInputController {
    start: () => void;
    stop: () => void;
    isSupported: boolean;
}

/**
 * Check if Web Speech API is supported
 */
export function isVoiceInputSupported(): boolean {
    return !!SpeechRecognition;
}

/**
 * Create a voice input controller
 */
export function createVoiceInput(callbacks: VoiceInputCallbacks): VoiceInputController {
    if (!SpeechRecognition) {
        return {
            start: () => callbacks.onError?.('Browser tidak mendukung input suara'),
            stop: () => { },
            isSupported: false
        };
    }

    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.lang = 'id-ID'; // Indonesian
    recognition.continuous = false; // Stop after one result
    recognition.interimResults = true; // Get intermediate results
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
        callbacks.onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        callbacks.onResult?.(transcript, isFinal);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Terjadi kesalahan';
        switch (event.error) {
            case 'not-allowed':
            case 'permission-denied':
                errorMessage = 'Izin mikrofon ditolak. Silakan izinkan akses mikrofon.';
                break;
            case 'no-speech':
                errorMessage = 'Tidak ada suara terdeteksi. Coba lagi.';
                break;
            case 'audio-capture':
                errorMessage = 'Mikrofon tidak ditemukan.';
                break;
            case 'network':
                errorMessage = 'Masalah koneksi. Pastikan internet stabil & akses via HTTPS.';
                break;
            case 'aborted':
                errorMessage = 'Input suara dibatalkan.';
                break;
        }
        callbacks.onError?.(errorMessage);
    };

    recognition.onend = () => {
        callbacks.onEnd?.();
    };

    return {
        start: () => {
            try {
                recognition.start();
            } catch (e) {
                callbacks.onError?.('Gagal memulai pengenalan suara');
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        },
        isSupported: true
    };
}
