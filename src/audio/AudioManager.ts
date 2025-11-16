// Lightweight WebAudio-based SFX to avoid asset files
class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private isMuted = false
  private volume = 0.8

  setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume
    }
  }
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      if (!Ctx) return
      this.ctx = new Ctx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume
      this.masterGain.connect(this.ctx.destination)
      // resume on user gesture if suspended
      if (this.ctx.state === 'suspended') {
        const resume = () => {
          this.ctx && this.ctx.resume()
          window.removeEventListener('pointerdown', resume)
          window.removeEventListener('keydown', resume)
        }
        window.addEventListener('pointerdown', resume)
        window.addEventListener('keydown', resume)
      }
      // pause sounds when tab hidden
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return
        if (document.hidden && this.ctx.state === 'running') {
          this.ctx.suspend()
        } else if (!document.hidden && this.ctx.state === 'suspended') {
          this.ctx.resume()
        }
      })
    }
  }

  // Swish: short filtered noise burst with fast decay
  playSwish(volume = 0.6) {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const bufferSize = 0.25 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12))
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 0.8
    const g = ctx.createGain()
    g.gain.value = volume
    src.connect(bp).connect(g).connect(this.masterGain)
    src.start()
  }

  // Clank: two metallic pings with quick decay
  playClank(volume = 0.7) {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const makePing = (freq: number, startDelay: number, vol: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = 0
      osc.connect(g).connect(this.masterGain!)
      const t = ctx.currentTime + startDelay
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      osc.start(t)
      osc.stop(t + 0.18)
    }
    makePing(1200, 0, volume * 0.8)
    makePing(800, 0.02, volume * 0.6)
  }

  // Whistle: short sine with slight vibrato
  playWhistle(volume = 0.35, duration = 0.6) {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const g = ctx.createGain()
    g.gain.value = 0
    osc.connect(g).connect(this.masterGain)
    const t = ctx.currentTime
    // base frequency and vibrato
    const base = 1200
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 6
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 20
    lfo.connect(lfoGain).connect(osc.frequency)
    osc.frequency.setValueAtTime(base, t)
    // attack/decay
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(volume, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.start(t)
    lfo.start(t)
    osc.stop(t + duration + 0.02)
    lfo.stop(t + duration + 0.02)
  }
}

export const audioManager = new AudioManager()


