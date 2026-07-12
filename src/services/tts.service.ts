/**
 * Text-to-Speech Service using Web Speech API
 */

class TextToSpeechService {
    private synth: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;
    private voice: SpeechSynthesisVoice | null = null;

    constructor() {
        this.synth = window.speechSynthesis;
        this.loadVoices();
    }

    /**
     * Load available voices
     */
    private loadVoices() {
        const voices = this.synth.getVoices();
        // Prefer high-quality English voices
        this.voice = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    /**
     * Speak text out loud
     */
    speak(text: string, options?: {
        rate?: number;
        pitch?: number;
        volume?: number;
        onEnd?: () => void;
        onStart?: () => void;
    }): void {
        // Stop any ongoing speech
        this.stop();

        this.utterance = new SpeechSynthesisUtterance(text);

        // Set voice
        if (this.voice) {
            this.utterance.voice = this.voice;
        }

        // Set options
        this.utterance.rate = options?.rate || 1.0;
        this.utterance.pitch = options?.pitch || 1.0;
        this.utterance.volume = options?.volume || 1.0;

        // Event listeners
        if (options?.onStart) {
            this.utterance.onstart = options.onStart;
        }
        if (options?.onEnd) {
            this.utterance.onend = options.onEnd;
        }

        // Speak
        this.synth.speak(this.utterance);
    }

    /**
     * Stop current speech
     */
    stop(): void {
        this.synth.cancel();
    }

    /**
     * Pause current speech
     */
    pause(): void {
        this.synth.pause();
    }

    /**
     * Resume paused speech
     */
    resume(): void {
        this.synth.resume();
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synth.speaking;
    }

    /**
     * Get available voices
     */
    getVoices(): SpeechSynthesisVoice[] {
        return this.synth.getVoices();
    }

    /**
     * Set specific voice
     */
    setVoice(voiceName: string): void {
        const voices = this.getVoices();
        this.voice = voices.find(v => v.name === voiceName) || this.voice;
    }
}

// Export singleton instance
export const ttsService = new TextToSpeechService();

// Reload voices when they become available (async in some browsers)
if (typeof window !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => {
        ttsService['loadVoices']();
    };
}
