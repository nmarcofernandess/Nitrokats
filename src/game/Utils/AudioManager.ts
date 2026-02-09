// Procedural audio manager using the Web Audio API.

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicIntervalId: number | null = null;
  private musicNoteIndex = 0;
  private readonly notes = [110, 110, 130, 110, 97, 97, 110, 130];

  private isMuted = false;

  constructor() {
    try {
      const AudioContextClass =
        window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Web Audio API not available');
      }

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch (error) {
      // Keep app functional even when audio cannot be initialized.
      console.error('Web Audio API not supported', error);
    }
  }

  private resume = () => {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  };

  setMuted = (muted: boolean) => {
    this.isMuted = muted;
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = muted ? 0 : 0.3;
  };

  playTone = (
    frequency: number,
    type: OscillatorType,
    duration: number,
    delay = 0,
    volume = 0.5,
  ) => {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      return;
    }

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
    if (!this.ctx || !this.masterGain || this.isMuted) {
      return;
    }

    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  };

  playExplosion = () => {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      return;
    }

    this.resume();

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.start();
  };

  playHit = () => {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      return;
    }

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

  private playMusicStep = () => {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      return;
    }

    const bpm = 120;
    const beatDur = 60 / bpm;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle';
    osc.frequency.value = this.notes[this.musicNoteIndex];

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + beatDur - 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + beatDur);

    this.musicNoteIndex = (this.musicNoteIndex + 1) % this.notes.length;
  };

  startMusic = () => {
    if (!this.ctx || !this.masterGain || this.musicIntervalId !== null || this.isMuted) {
      return;
    }

    this.resume();

    const bpm = 120;
    const beatDurMs = (60 / bpm) * 1000;

    this.playMusicStep();
    this.musicIntervalId = window.setInterval(this.playMusicStep, beatDurMs);
  };

  stopMusic = () => {
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }

    this.musicNoteIndex = 0;
  };
}

export const audioManager = new AudioController();
