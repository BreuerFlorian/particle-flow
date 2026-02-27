import { useRef, useEffect, useCallback, useState } from 'react'
import { createParticles, updateParticles, drawParticles, handleInteraction } from './particles'
import { AudioEngine } from './audio'

const PARTICLE_COUNT = 60

export default function App() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    particlesRef.current = createParticles(PARTICLE_COUNT, canvas.width, canvas.height)

    const loop = () => {
      updateParticles(particlesRef.current, canvas.width, canvas.height)
      drawParticles(ctx, particlesRef.current, canvas.width, canvas.height)
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      audioRef.current?.stop()
    }
  }, [])

  const onInteract = useCallback((e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const touches = e.changedTouches
      ? Array.from(e.changedTouches).map(t => ({ x: t.clientX - rect.left, y: t.clientY - rect.top }))
      : [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]

    for (const point of touches) {
      handleInteraction(particlesRef.current, point.x, point.y)
    }
  }, [])

  const toggleMute = useCallback((e) => {
    e.stopPropagation()
    if (!audioRef.current) {
      audioRef.current = new AudioEngine()
      audioRef.current.start()
      setMuted(false)
      return
    }
    const nowMuted = audioRef.current.toggleMute()
    setMuted(nowMuted)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
        onClick={onInteract}
        onTouchStart={onInteract}
      />
      <button
        onClick={toggleMute}
        onTouchEnd={(e) => { e.preventDefault(); toggleMute(e) }}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, border-color 0.2s',
          zIndex: 10,
        }}
        onPointerEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.8)" />
          {muted ? (
            <>
              <line x1="16" y1="9" x2="22" y2="15" />
              <line x1="22" y1="9" x2="16" y2="15" />
            </>
          ) : (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
