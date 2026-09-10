/** Short two-tone chime for new orders (no audio file required). */
export function playNewOrderSound() {
  playChime(880, 1174.66);
}

/** Distinct chime for waiter / bill requests. */
export function playTableRequestSound() {
  playChime(523.25, 783.99);
}

function playChime(first: number, second: number) {
  try {
    const ctx = new AudioContext();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    const t = ctx.currentTime;
    playTone(first, t, 0.15);
    playTone(second, t + 0.18, 0.22);
    setTimeout(() => void ctx.close(), 500);
  } catch {
    // Autoplay may be blocked until user interacts with the page
  }
}
