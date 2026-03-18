// Lightweight WebAudio-based SFX + music playback (MP3 from URLs)
class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxMuted = false
  private musicMuted = true
  private volume = 0.8
  private musicVolume = 0.5
  private musicEl: HTMLAudioElement | null = null

  /** Legacy: sets both SFX and music muted for backward compatibility. */
  setMuted(muted: boolean) {
    this.sfxMuted = muted
    this.musicMuted = muted
    this.updateMusicVolume()
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.masterGain) {
      this.masterGain.gain.value = this.sfxMuted ? 0 : this.volume
    }
  }

  setSfxMuted(muted: boolean) {
    this.sfxMuted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume
    }
  }

  setMusicMuted(_muted: boolean) {
    this.musicMuted = true // Music off at all times; use _muted to respect settings again
    this.updateMusicVolume()
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v))
    this.updateMusicVolume()
  }

  private updateMusicVolume() {
    if (!this.musicEl) return
    this.musicEl.volume = this.musicMuted ? 0 : this.musicVolume
  }

  /** Play background music from URL (looped). Pass empty string to stop. */
  playMusic(url: string) {
    if (this.musicEl) {
      this.musicEl.pause()
      this.musicEl.src = ''
      this.musicEl = null
    }
    if (!url || url.trim() === '') return
    const el = new Audio(url)
    el.loop = true
    el.volume = this.musicMuted ? 0 : this.musicVolume
    el.play().catch(() => {})
    this.musicEl = el
  }

  stopMusic() {
    this.playMusic('')
  }

  private ensureContext() {
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      if (!Ctx) return
      this.ctx = new Ctx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.sfxMuted ? 0 : this.volume
      this.masterGain.connect(this.ctx.destination)
      if (this.ctx.state === 'suspended') {
        const resume = () => {
          this.ctx && this.ctx.resume()
          window.removeEventListener('pointerdown', resume)
          window.removeEventListener('keydown', resume)
        }
        window.addEventListener('pointerdown', resume)
        window.addEventListener('keydown', resume)
      }
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

  playSwish(volume = 0.6) {
    if (this.sfxMuted) return
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

  playClank(volume = 0.7) {
    if (this.sfxMuted) return
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

  playWhistle(volume = 0.35, duration = 0.6) {
    if (this.sfxMuted) return
    this.ensureContext()
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const g = ctx.createGain()
    g.gain.value = 0
    osc.connect(g).connect(this.masterGain)
    const t = ctx.currentTime
    const base = 1200
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 6
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 20
    lfo.connect(lfoGain).connect(osc.frequency)
    osc.frequency.setValueAtTime(base, t)
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
