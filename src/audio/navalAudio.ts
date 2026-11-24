export type MusicCondition = 'title' | 'cruising' | 'combat' | 'storm';

const CHORD_PROGRESSIONS: Record<MusicCondition, number[][]> = {
  // D minor Dorian sea shanty theme (melancholy twilight)
  title: [
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
    [116.54, 146.83, 174.61, 220.0], // Bbmaj7
    [110.0, 138.59, 164.81, 220.0],  // A7
  ],
  // Brisk open-water adventurous Dorian theme
  cruising: [
    [146.83, 220.0, 261.63, 329.63], // Dm9
    [196.0, 246.94, 293.66, 349.23], // G7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [130.81, 196.0, 246.94, 293.66], // Cmaj9
  ],
  // Urgent minor-key naval broadside pulse
  combat: [
    [146.83, 174.61, 220.0, 293.66], // Dm
    [116.54, 146.83, 174.61, 233.08], // Bb
    [130.81, 164.81, 196.0, 261.63], // C
    [110.0, 146.83, 164.81, 220.0],  // Asus4/A
  ],
  // Heavy tempest swells & low brass swells
  storm: [
    [110.0, 130.81, 164.81, 220.0],  // Am
    [98.0, 123.47, 146.83, 196.0],   // G
    [87.31, 110.0, 130.81, 174.61],  // F
    [82.41, 103.83, 123.47, 164.81], // E
  ],
};

const MELODY_INTERVALS: Record<MusicCondition, number[]> = {
  title: [0, 2, 3, 2, 1, 2, 0, -1],
  cruising: [0, 1, 2, 3, 2, 1, 3, 2],
  combat: [0, 3, 1, 3, 2, 3, 0, 2],
  storm: [0, 1, 0, 2, 3, 1, 0, 2],
};

export class NavalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private seaGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private volumeLevel = 0.72;
  private lastHoverAt = 0;
  private lastRustleAt = 0;
  private condition: MusicCondition = 'title';
  private stepIdx = 0;
  private musicTimer: number | null = null;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volumeLevel;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.24;
      this.musicGain.connect(this.masterGain);

      this.startSeaBed();
      this.startAdaptiveMusicLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volumeLevel, this.ctx.currentTime, 0.06);
    }
  }

  public setMasterVolume(vol: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : 0.72));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volumeLevel, this.ctx.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicCondition(cond: MusicCondition): void {
    if (this.condition === cond) return;
    this.condition = cond;
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.06, now + 0.55);
      this.musicGain.gain.linearRampToValueAtTime(0.24, now + 2.0);
    }
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.startAdaptiveMusicLoop();
    }
  }

  private startSeaBed(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 2.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    this.seaGain = this.ctx.createGain();
    this.seaGain.gain.value = 0.14;

    noise.connect(filter);
    filter.connect(this.seaGain);
    this.seaGain.connect(this.masterGain);
    noise.start();
  }

  private startAdaptiveMusicLoop(): void {
    if (typeof window === 'undefined' || !this.ctx) return;
    const tempoMs =
      this.condition === 'combat'
        ? 380
        : this.condition === 'storm'
          ? 440
          : this.condition === 'cruising'
            ? 520
            : 680;

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.muted || this.ctx.state !== 'running') return;
      const chords = CHORD_PROGRESSIONS[this.condition];
      const pattern = MELODY_INTERVALS[this.condition];
      const bar = Math.floor(this.stepIdx / 4) % chords.length;
      const beat = this.stepIdx % 4;
      const chord = chords[bar];
      const now = this.ctx.currentTime;

      // Pad/strings swell on downbeat
      if (beat === 0) {
        for (let i = 0; i < 3; i += 1) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          const f = this.ctx.createBiquadFilter();
          osc.type = this.condition === 'storm' || this.condition === 'combat' ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(chord[i], now);
          f.type = 'lowpass';
          f.frequency.setValueAtTime(this.condition === 'combat' ? 950 : 620, now);

          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(0.045, now + 0.14);
          g.gain.exponentialRampToValueAtTime(0.0001, now + (tempoMs * 3.8) / 1000);

          osc.connect(f);
          f.connect(g);
          g.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + (tempoMs * 3.9) / 1000);
        }
      }

      // Plucked lute / hurdy-gurdy melody arpeggio
      const notePick = pattern[this.stepIdx % pattern.length];
      if (notePick >= 0) {
        const freq = chord[notePick % chord.length] * (this.condition === 'cruising' ? 2 : 1.5);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = this.condition === 'combat' ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(1400, now);
        filt.frequency.exponentialRampToValueAtTime(380, now + 0.34);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(this.condition === 'combat' ? 0.052 : 0.06, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(filt);
        filt.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      // War drum pulse during combat/storm
      if ((this.condition === 'combat' || this.condition === 'storm') && (beat === 0 || beat === 2)) {
        const kick = this.ctx.createOscillator();
        const kg = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(beat === 0 ? 115 : 88, now);
        kick.frequency.exponentialRampToValueAtTime(34, now + 0.18);
        kg.gain.setValueAtTime(beat === 0 ? 0.16 : 0.09, now);
        kg.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        kick.connect(kg);
        kg.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.24);
      }

      this.stepIdx += 1;
    }, tempoMs);
  }

  public playCannon(crestBoosted: boolean): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const thump = this.ctx.createOscillator();
    const tg = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(crestBoosted ? 160 : 120, now);
    thump.frequency.exponentialRampToValueAtTime(32, now + 0.32);
    tg.gain.setValueAtTime(crestBoosted ? 0.45 : 0.32, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    thump.connect(tg);
    tg.connect(this.masterGain);
    thump.start(now);
    thump.stop(now + 0.36);

    const len = Math.floor(this.ctx.sampleRate * 0.28);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = crestBoosted ? 760 : 520;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.32, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
  }

  public playHit(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCollision(heavy: boolean): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const thud = this.ctx.createOscillator();
    const tg = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(heavy ? 118 : 94, now);
    thud.frequency.exponentialRampToValueAtTime(28, now + 0.34);
    tg.gain.setValueAtTime(heavy ? 0.38 : 0.24, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    thud.connect(tg);
    tg.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.38);

    const len = Math.floor(this.ctx.sampleRate * 0.24);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.26));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = heavy ? 420 : 320;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(heavy ? 0.3 : 0.18, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
  }

  public playSplash(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.22);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 950;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start(now);
  }

  public playSurge(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.42);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playUiClick(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.05);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playUiHover(): void {
    if (!this.ctx || !this.masterGain || this.muted || this.ctx.state !== 'running') return;
    const t = performance.now();
    if (t - this.lastHoverAt < 65) return;
    this.lastHoverAt = t;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.028);
    g.gain.setValueAtTime(0.028, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.032);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.036);
  }

  public playSliderRustle(): void {
    if (!this.ctx || !this.masterGain || this.muted || this.ctx.state !== 'running') return;
    const t = performance.now();
    if (t - this.lastRustleAt < 50) return;
    this.lastRustleAt = t;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.025);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1850;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.035, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start(now);
  }

  public playBoarding(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 440, 587.33];
    notes.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 1800;
      g.gain.setValueAtTime(0.001, now + idx * 0.07);
      g.gain.linearRampToValueAtTime(0.14, now + idx * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  public playPickup(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);
      g.gain.setValueAtTime(0.11, now + idx * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.2);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.22);
    });
  }

  public playExplosion(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.65);
    sg.gain.setValueAtTime(0.5, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
    sub.connect(sg);
    sg.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.7);

    const len = Math.floor(this.ctx.sampleRate * 0.55);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.32));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 650;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.36, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
  }

  public playThunder(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 1.1);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 260;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.28, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
  }

  public playBossHorn(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    for (const freq of [73.42, 110.0]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.96, now + 1.1);
      filt.type = 'lowpass';
      filt.frequency.value = 420;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.18, now + 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    }
  }

  public playHarpoon(reelSnap = false): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    // Metallic chain clink & heavy launch thump
    const clinkFreqs = reelSnap ? [880, 1174, 1568] : [640, 960];
    clinkFreqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + idx * 0.04 + 0.14);
      g.gain.setValueAtTime(0.16, now + idx * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.18);
    });
  }

  public playSmoke(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const len = Math.floor(this.ctx.sampleRate * 0.55);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.48));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1100, now);
    filt.frequency.exponentialRampToValueAtTime(320, now + 0.5);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.28, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.54);
    noise.connect(filt);
    filt.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);

    const chime = this.ctx.createOscillator();
    const cg = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(392, now);
    chime.frequency.exponentialRampToValueAtTime(246.94, now + 0.45);
    cg.gain.setValueAtTime(0.12, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    chime.connect(cg);
    cg.connect(this.masterGain);
    chime.start(now);
    chime.stop(now + 0.48);
  }

  public playStormWake(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const chord = [146.83, 220.0, 293.66, 440.0];
    chord.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx < 2 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, now + 0.42);
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 1800;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  }

  public playFireShot(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.36);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.34));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.setValueAtTime(1150, now);
    nf.frequency.exponentialRampToValueAtTime(420, now + 0.34);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
  }

  public playMineDrop(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(86, now + 0.16);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
    this.playSplash();
  }

  public playKrakenRoar(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    for (const f of [58, 86]) {
      const osc = this.ctx.createOscillator();
      const filt = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f * 1.15, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.72, now + 1.25);
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(340, now);
      filt.frequency.exponentialRampToValueAtTime(120, now + 1.25);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.24, now + 0.16);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.35);
    }
  }

  public dispose(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
