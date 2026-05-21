export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private currentNotes: OscillatorNode[] = [];
  private sequence: NodeJS.Timeout | null = null;

  constructor() {}

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.15; // Increased volume slightly
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public async toggleMusic() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.init();
      if (this.ctx && this.ctx.state !== 'running') {
        await this.ctx.resume();
      }
      this.isPlaying = true;
      this.playRPGTheme();
    }
    return this.isPlaying;
  }

  private stop() {
    this.isPlaying = false;
    if (this.sequence) clearTimeout(this.sequence);
    this.currentNotes.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    this.currentNotes = [];
  }

  private playNote(freq: number, type: OscillatorType, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    
    // Prevent scheduling in the past
    if (time < this.ctx.currentTime) {
      time = this.ctx.currentTime + 0.05;
    }

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    
    const attackTime = Math.min(0.05, duration / 2);
    const attackEnd = time + attackTime;
    const releaseStart = time + duration - attackTime;
    
    gain.gain.linearRampToValueAtTime(1, attackEnd); // Attack
    gain.gain.setValueAtTime(1, releaseStart);
    gain.gain.linearRampToValueAtTime(0, time + duration); // Release

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
    
    this.currentNotes.push(osc);
    setTimeout(() => {
      this.currentNotes = this.currentNotes.filter(o => o !== osc);
    }, (duration + 1) * 1000);
  }

  private playRPGTheme() {
    if (!this.ctx || !this.isPlaying) return;

    const tempo = 120; // BPM
    const beatLen = 60 / tempo;
    
    // Simple 8-bit RPG progression
    // C minor / Eb Major feel
    const notes = [
      { f: 261.63, d: 0.5 }, // C4
      { f: 311.13, d: 0.5 }, // Eb4
      { f: 392.00, d: 2 },   // G4
      { f: 311.13, d: 0.5 }, // Eb4
      { f: 261.63, d: 0.5 }, // C4
      { f: 466.16, d: 2 },   // Bb4
      
      { f: 261.63, d: 0.5 }, // C4
      { f: 311.13, d: 0.5 }, // Eb4
      { f: 392.00, d: 1 },   // G4
      { f: 466.16, d: 1 },   // Bb4
      { f: 523.25, d: 1.5 }, // C5
      { f: 466.16, d: 0.5 }, // Bb4
      { f: 392.00, d: 2 },   // G4
    ];

    let startTime = this.ctx.currentTime + 0.1;
    let totalDuration = 0;

    notes.forEach((n) => {
      this.playNote(n.f, 'square', startTime, n.d * beatLen);
      startTime += n.d * beatLen;
      totalDuration += n.d * beatLen;
    });

    let bassTime = this.ctx.currentTime + 0.1;
    const bassNotes = [
      { f: 130.81, d: 4 }, // C3
      { f: 116.54, d: 4 }, // Bb2
      { f: 103.83, d: 4 }, // Ab2
      { f: 130.81, d: 4 }, // C3
    ];
    bassNotes.forEach((n) => {
      const loopCount = Math.floor(totalDuration / (n.d * beatLen));
      for(let i=0; i < loopCount; i++) {
         this.playNote(n.f, 'triangle', bassTime, n.d * beatLen - 0.1);
         bassTime += n.d * beatLen;
      }
    });

    this.sequence = setTimeout(() => {
      if (this.isPlaying) this.playRPGTheme();
    }, totalDuration * 1000);
  }
}

export const soundEngine = new SoundEngine();
