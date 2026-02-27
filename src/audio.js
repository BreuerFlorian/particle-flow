// Generates a pleasant, ambient monotone loop using Web Audio API
// The loop is 20 seconds and uses pentatonic scale tones with soft pads

const LOOP_DURATION = 20
const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.running = false
    this.muted = false
    this.timers = []
  }

  start() {
    if (this.running) return
    this.running = true
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.15
    this.masterGain.connect(this.ctx.destination)

    this._scheduleLoop()
  }

  _scheduleLoop() {
    if (!this.running) return
    this._playSequence()
    const timer = setTimeout(() => this._scheduleLoop(), LOOP_DURATION * 1000)
    this.timers.push(timer)
  }

  _playSequence() {
    if (!this.ctx || !this.running) return

    // Drone pad — a low, warm base tone
    this._playPad(130.81, 0, LOOP_DURATION, 0.08)      // C3
    this._playPad(196.00, 0, LOOP_DURATION, 0.05)      // G3 (fifth)

    // Melodic notes scattered throughout the 20s loop
    const noteCount = 10 + Math.floor(Math.random() * 6)
    for (let i = 0; i < noteCount; i++) {
      const time = (i / noteCount) * LOOP_DURATION + Math.random() * 1.5
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      const duration = 1.5 + Math.random() * 2.5
      const volume = 0.03 + Math.random() * 0.04
      this._playTone(freq, time, duration, volume)
    }
  }

  _playTone(freq, startDelay, duration, volume) {
    if (!this.ctx || !this.running) return
    const now = this.ctx.currentTime + startDelay

    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    // Slight detune for warmth
    const osc2 = this.ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 1.002

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.3)
    gain.gain.setValueAtTime(volume, now + duration - 0.5)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration + 0.1)
    osc2.start(now)
    osc2.stop(now + duration + 0.1)
  }

  _playPad(freq, startDelay, duration, volume) {
    if (!this.ctx || !this.running) return
    const now = this.ctx.currentTime + startDelay

    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    const osc2 = this.ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.value = freq * 1.001

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 2)
    gain.gain.setValueAtTime(volume, now + duration - 2)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration + 0.1)
    osc2.start(now)
    osc2.stop(now + duration + 0.1)
  }

  mute() {
    this.muted = true
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1)
    }
  }

  unmute() {
    this.muted = false
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1)
    }
  }

  toggleMute() {
    if (this.muted) this.unmute()
    else this.mute()
    return this.muted
  }

  stop() {
    this.running = false
    this.timers.forEach(t => clearTimeout(t))
    this.timers = []
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
