// Simple Procedural Audio Manager (Retro Style)
// Uses Web Audio API to generate sounds on the fly. No assets needed.

class AudioController {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    musicOscillators: OscillatorNode[] = [];
    isMuted: boolean = false;

    constructor() {
        // Init on user interaction usually, handled safely
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    // Ensure context is running (browsers block auto-play)
    resume = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    };

    // --- SFX ---

    // Helper for simple tones
    public playTone = (frequency: number, type: OscillatorType, duration: number, delay: number = 0, volume: number = 0.5) => {
        if (!this.ctx || !this.masterGain) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime + delay);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    };

    playShoot = () => {
        // Original implementation:
        // if (!this.ctx || !this.masterGain) return;
        // this.resume();

        // const osc = this.ctx.createOscillator();
        // const gain = this.ctx.createGain();

        // osc.connect(gain);
        // gain.connect(this.masterGain);

        // // Retro Pew: Sawtooth wave, pitch drop
        // osc.type = 'sawtooth';
        // osc.frequency.setValueAtTime(880, this.ctx.currentTime); // Start High
        // osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15); // Drop Fast

        // gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        // gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        // osc.start();
        // osc.stop(this.ctx.currentTime + 0.15);

        // New simplified implementation using playTone
        this.playTone(440, 'square', 0.1);
        this.playTone(220, 'sawtooth', 0.1, 0.05);
    };

    playExplosion = () => {
        if (!this.ctx || !this.masterGain) return;
        this.resume();

        // White Noise for Explosion
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s duration
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        noise.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        // Lowpass filter to make it "boomy"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        noise.disconnect();
        noise.connect(filter);
        filter.connect(gain);

        noise.start();
    };

    playHit = () => {
        if (!this.ctx || !this.masterGain) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    };

    playPowerUp = () => {
        this.playTone(660, 'sine', 0.3);
        this.playTone(880, 'sine', 0.3, 0.1);
    };

    // --- MUSIC (Simple Loop) ---
    // A simple bassline loop
    startMusic = () => {
        if (!this.ctx || !this.masterGain || this.musicOscillators.length > 0) return;
        this.resume();

        const bpm = 120;
        const beatDur = 60 / bpm;

        // Simple Bass Sequence
        const notes = [110, 110, 130, 110, 97, 97, 110, 130]; // Hz frequencies
        let noteIndex = 0;

        const playNextNote = () => {
            if (!this.ctx || !this.masterGain) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'triangle';
            osc.frequency.value = notes[noteIndex];

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + beatDur - 0.05);

            osc.start();
            osc.stop(this.ctx.currentTime + beatDur);

            noteIndex = (noteIndex + 1) % notes.length;

            // Schedule next loop
            setTimeout(playNextNote, beatDur * 1000);
        };

        playNextNote();
    };
}

export const audioManager = new AudioController();
