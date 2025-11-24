
// Simple Web Audio API Synthesizer for UI Sounds
// No external assets required.

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playSound = (type: 'click' | 'flip' | 'reveal' | 'chime' | 'slide') => {
  try {
    initAudio();
    if (!audioCtx) return;

    const t = audioCtx.currentTime;

    switch (type) {
        case 'click': {
            // Wood block sound (High pitch, short decay)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
        }

        case 'flip': {
            // Paper sliding sound (Filtered noise simulation via Triangle)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;
        }
        
        case 'slide': {
            // Longer paper sound
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, t);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        }

        case 'reveal': {
            // Mystical shimmer
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.3);
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1);
            osc.start(t);
            osc.stop(t + 1);
            break;
        }

        case 'chime': {
            // Temple Bell (Additive Synthesis)
            const fund = 523.25; // C5
            const ratios = [1, 1.5, 2, 2.6, 3, 4.2];
            const gains = [0.3, 0.15, 0.15, 0.1, 0.05, 0.02];

            ratios.forEach((ratio, i) => {
                const osc = audioCtx!.createOscillator();
                const gain = audioCtx!.createGain();
                osc.connect(gain);
                gain.connect(audioCtx!.destination);
                
                osc.frequency.value = fund * ratio;
                osc.type = 'sine';
                
                // Attack
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(gains[i], t + 0.02);
                // Decay
                gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5 + (Math.random() * 0.5));
                
                osc.start(t);
                osc.stop(t + 3.0);
            });
            break;
        }
    }
  } catch (e) {
    console.error("Audio Engine Error:", e);
  }
};
