/**
 * Vietnamese Folk Remix (Dân Gian Remix) & EDM Fever Mode Web Audio Synthesizer.
 * Uses pure Web Audio API oscillators and noise buffers so it runs 100% offline with zero external audio fetches.
 */

// Vietnamese Pentatonic (Ngũ Cung - D minor / Điệu Lý festival feel)
const PENTATONIC_HZ = [
  293.66, // D4
  349.23, // F4
  392.0,  // G4
  440.0,  // A4
  523.25, // C5
  587.33, // D5
  698.46, // F5
  783.99, // G5
  880.0,  // A5
];

// Catchy 16-step Folk Đàn Tranh pattern (indices into PENTATONIC_HZ, -1 = rest)
const FOLK_MELODY = [0, -1, 3, 2, 4, -1, 3, 1, 2, -1, 5, 4, 3, 2, 1, -1];
const FOLK_BASS = [0, -1, -1, 0, 2, -1, 1, -1, 0, -1, -1, 0, 3, -1, 2, -1];

// High-energy 16-step Lên Mây EDM Remix arpeggio lead
const FEVER_LEAD = [5, 7, 8, 7, 5, 4, 5, 7, 8, 7, 5, 4, 3, 5, 7, 8];
const FEVER_BASS = [0, 0, -1, 0, 1, 1, -1, 2, 3, 3, -1, 2, 1, -1, 2, 3];

export class FolkRemixAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private isPlayingMusic = false;
  private isPaused = false;
  private isFever = false;
  private currentWave = 1;
  private stepIndex = 0;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.72;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.34;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.78;
        this.sfxGain.connect(this.masterGain);

        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      } catch {
        this.ctx = null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  public setMusicState(params: { playing: boolean; fever?: boolean; wave?: number; paused?: boolean }): void {
    if (typeof params.fever === 'boolean') this.isFever = params.fever;
    if (typeof params.wave === 'number') this.currentWave = params.wave;
    if (typeof params.paused === 'boolean') this.isPaused = params.paused;

    if (params.playing && !this.isPlayingMusic) {
      this.isPlayingMusic = true;
      this.startScheduler();
    } else if (!params.playing && this.isPlayingMusic) {
      this.isPlayingMusic = false;
      this.stopScheduler();
    }
  }

  private startScheduler(): void {
    this.stopScheduler();
    if (typeof window === 'undefined') return;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.schedulerId = window.setInterval(() => this.tickScheduler(), 45);
  }

  private stopScheduler(): void {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private tickScheduler(): void {
    if (!this.isPlayingMusic || this.isPaused || this.muted || !this.ctx || !this.musicGain) return;
    if (this.ctx.state !== 'running') return;

    const bpm = this.isFever ? 142 : 114 + (this.currentWave - 1) * 7;
    const stepDur = 60 / bpm / 4; // 16th note

    if (this.nextNoteTime < this.ctx.currentTime - 0.15) {
      this.nextNoteTime = this.ctx.currentTime + 0.03;
    }

    while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
      this.scheduleStep(this.stepIndex % 16, this.nextNoteTime, stepDur);
      this.nextNoteTime += stepDur;
      this.stepIndex = (this.stepIndex + 1) % 64;
    }
  }

  private scheduleStep(step: number, time: number, stepDur: number): void {
    if (!this.ctx || !this.musicGain) return;

    if (this.isFever) {
      // EDM LÊN MÂY REMIX BEAT
      if (step % 4 === 0) {
        this.playKick(time, 0.52, true);
      }
      if (step === 4 || step === 12) {
        this.playSnareClap(time, 0.28);
      }
      if (step % 2 === 1 || step === 14 || step === 15) {
        this.playHiHat(time, step % 4 === 2 ? 0.13 : 0.08);
      }

      const leadIdx = FEVER_LEAD[step];
      if (leadIdx >= 0) {
        this.playSupersawPluck(PENTATONIC_HZ[leadIdx], time, stepDur * 1.4, 0.17);
      }

      const bassIdx = FEVER_BASS[step];
      if (bassIdx >= 0) {
        this.playSubBass(PENTATONIC_HZ[bassIdx] / 4, time, stepDur * 1.8, 0.34);
      }
    } else {
      // DÂN GIAN REMIX GROOVE (Đàn Tranh + Trống Chầu + Modern Beat)
      if (step === 0 || step === 6 || step === 10) {
        this.playKick(time, 0.38, false);
      }
      // Trống chầu / phách woodblock syncopation
      if (step === 4 || step === 12 || step === 14) {
        this.playWoodblock(time, step === 14 ? 0.14 : 0.22, step === 4 ? 860 : 1020);
      }
      if (step % 4 === 2) {
        this.playHiHat(time, 0.05);
      }

      // Đàn Tranh pentatonic melody
      const noteIdx = FOLK_MELODY[step];
      if (noteIdx >= 0) {
        const octaveBoost = this.stepIndex >= 32 && step % 4 === 0 ? 1 : 0;
        const hz = PENTATONIC_HZ[Math.min(PENTATONIC_HZ.length - 1, noteIdx + octaveBoost)];
        this.playDanTranh(hz, time, 0.28, 0.22);
      }

      // Warm sub-folk bass
      const bIdx = FOLK_BASS[step];
      if (bIdx >= 0) {
        this.playSubBass(PENTATONIC_HZ[bIdx] / 4, time, stepDur * 2.2, 0.24);
      }
    }
  }

  private playDanTranh(freq: number, time: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Subtle Vietnamese vibrato/pitch-bend ornament
    osc.frequency.exponentialRampToValueAtTime(freq * 1.012, time + 0.045);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.11);
    osc2.frequency.setValueAtTime(freq * 2, time);

    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(gainAmt, time + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(g);
    osc2.connect(g);
    g.connect(this.musicGain);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + dur + 0.02);
    osc2.stop(time + dur + 0.02);
  }

  private playSupersawPluck(freq: number, time: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.006, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, time);
    filter.frequency.exponentialRampToValueAtTime(880, time + dur);

    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(gainAmt, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.02);
    osc2.stop(time + dur + 0.02);
  }

  private playSubBass(freq: number, time: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(gainAmt, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private playKick(time: number, gainAmt: number, edmPunch: boolean): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(edmPunch ? 165 : 132, time);
    osc.frequency.exponentialRampToValueAtTime(edmPunch ? 40 : 54, time + 0.12);

    g.gain.setValueAtTime(gainAmt, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.17);
  }

  private playWoodblock(time: number, gainAmt: number, pitch: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.72, time + 0.045);

    g.gain.setValueAtTime(gainAmt, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  private playHiHat(time: number, gainAmt: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7500, time);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainAmt, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.04);
  }

  private playSnareClap(time: number, gainAmt: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1600, time);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainAmt, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.12);
  }

  // ---- WEIGHT-SCALED SFX ----

  public playCloudPickup(combo = 0): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const idx = Math.min(PENTATONIC_HZ.length - 1, 3 + (combo % 6));
    const jitter = 0.96 + Math.random() * 0.08;
    const freq = PENTATONIC_HZ[idx] * jitter;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.09);

    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playHealSegment(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [587.33, 783.99, 880.0, 1174.66]; // D5 - G5 - A5 - D6 uplifting chime
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.055;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.001, st);
      g.gain.linearRampToValueAtTime(0.24, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.3);
    });
  }

  public playDash(): void {
    if (this.muted || !this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.14);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.24, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.17);
  }

  public playWhipActivate(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(1420, t + 0.09);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.22);

    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.24, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playWhipStun(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Heavy Trống Chầu impact
    const drum = this.ctx.createOscillator();
    const dg = this.ctx.createGain();
    drum.type = 'sine';
    drum.frequency.setValueAtTime(220, t);
    drum.frequency.exponentialRampToValueAtTime(52, t + 0.22);
    dg.gain.setValueAtTime(0.55, t);
    dg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    drum.connect(dg);
    dg.connect(this.sfxGain);
    drum.start(t);
    drum.stop(t + 0.27);

    // Sparkling pentatonic stun chime
    [587.33, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.045;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.22, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.24);
    });
  }

  public playSegmentBreak(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.28);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playTelegraphWarn(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.16);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playFeverStart(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Festival Gong + Ascending Dragon Arpeggio
    const gong = this.ctx.createOscillator();
    const gg = this.ctx.createGain();
    gong.type = 'triangle';
    gong.frequency.setValueAtTime(146.83, t);
    gong.frequency.exponentialRampToValueAtTime(138, t + 0.7);
    gg.gain.setValueAtTime(0.5, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    gong.connect(gg);
    gg.connect(this.sfxGain);
    gong.start(t);
    gong.stop(t + 0.78);

    [293.66, 392.0, 523.25, 587.33, 880.0].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      const st = t + i * 0.055;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.2, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.32);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.34);
    });
  }

  public playFeverRam(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    g.gain.setValueAtTime(0.38, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playXinKhucBell(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [392.0, 587.33].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.24, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.68);
    });
  }

  public playVictory(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [293.66, 392.0, 440.0, 587.33, 783.99, 880.0];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.085;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.28, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.45);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.48);
    });
  }

  public playGameOver(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [440.0, 392.0, 349.23, 293.66];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.13;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.26, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.38);
    });
  }

  public destroy(): void {
    this.stopScheduler();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const audioManager = new FolkRemixAudio();
