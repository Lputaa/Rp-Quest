import { useAppStore } from './store';

let musicOsc: OscillatorNode | null = null;
let musicGain: GainNode | null = null;
let musicCtx: AudioContext | null = null;

export const setMusicState = (enabled: boolean) => {
  if (enabled) {
    if (musicOsc) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      musicCtx = new AudioContext();
      musicOsc = musicCtx.createOscillator();
      musicGain = musicCtx.createGain();
      
      musicOsc.type = 'sine';
      musicOsc.frequency.setValueAtTime(120, musicCtx.currentTime); // Low hum
      
      // Simple LFO for ambient feel (we will just manually modulate the gain a bit, or keep it simple)
      musicGain.gain.setValueAtTime(0, musicCtx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0.05, musicCtx.currentTime + 2); // fade in
      
      musicOsc.connect(musicGain);
      musicGain.connect(musicCtx.destination);
      musicOsc.start();
    } catch (e) {
      console.error('Music error:', e);
    }
  } else {
    if (musicOsc && musicGain && musicCtx) {
      musicGain.gain.linearRampToValueAtTime(0, musicCtx.currentTime + 1); // fade out
      setTimeout(() => {
        if (musicOsc) {
          musicOsc.stop();
          musicOsc.disconnect();
          musicOsc = null;
        }
        if (musicGain) {
          musicGain.disconnect();
          musicGain = null;
        }
      }, 1000);
    }
  }
};

export const playSFX = (type: 'coin' | 'hit' | 'levelUp' | 'click' | 'questComplete' | 'error') => {
  if (!useAppStore.getState().sfxEnabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    switch (type) {
      case 'coin':
        // Short high-pitched beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.1); // E6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'hit':
        // Noisy deeper thud
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'click':
        // Very short blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'levelUp':
        // Arpeggio
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        osc.frequency.setValueAtTime(880, now + 0.3); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'questComplete':
        // Fanfare
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      case 'error':
        // Low double buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(164.81, now); // E3
        osc.frequency.setValueAtTime(155.56, now + 0.1); // D#3
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  } catch (e) {
    console.error('SFX error:', e);
  }
};
