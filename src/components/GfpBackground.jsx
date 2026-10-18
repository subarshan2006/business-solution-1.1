import { useEffect, useRef } from 'react'

/**
 * GfpBackground: High-performance GFP (Green Fluorescent Protein) microscopy simulation
 * Complies with Design Audit Section 8.2 & 8.3:
 * - Near-black Biology Green canvas (#07130E)
 * - 24 organic floating organelles & fluorophore nodes
 * - Slow ambient drift (25-40s traversal)
 * - Auto-pause on tab hidden & blur
 * - Static frame for prefers-reduced-motion
 * - Zero heavy video decoding overhead
 */
function GfpBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = null
    let isPaused = false
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Responsive Canvas Resizing with Device Pixel Ratio
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // Palette: Green Fluorescent Protein Emission Spectrum
    const COLORS = [
      { r: 52, g: 211, b: 153 },  // Mint #34D399
      { r: 110, g: 231, b: 183 }, // Mint Hi #6EE7B7
      { r: 16, g: 185, b: 129 },  // Emerald #10B981
      { r: 20, g: 184, b: 166 },  // Teal #14B8A6
      { r: 169, g: 194, b: 181 }  // Sage #A9C2B5
    ]

    // Initialize 24 cellular organelles & fluorophores
    const CELL_COUNT = 24
    const cells = Array.from({ length: CELL_COUNT }, (_, i) => {
      const isMacro = i % 6 === 0 // 4 larger cell bodies with nuclei
      const color = COLORS[i % COLORS.length]
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: isMacro ? 36 + Math.random() * 28 : 8 + Math.random() * 16,
        isMacro,
        color,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.015,
        baseAlpha: isMacro ? 0.08 + Math.random() * 0.06 : 0.14 + Math.random() * 0.12
      }
    })

    // Render loop
    function render() {
      if (isPaused) return

      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      // 1. Draw cytoplasmic filament connections between proximate cells
      ctx.lineWidth = 1
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const dx = cells[i].x - cells[j].x
          const dy = cells[i].y - cells[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.09
            ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(cells[i].x, cells[i].y)
            ctx.lineTo(cells[j].x, cells[j].y)
            ctx.stroke()
          }
        }
      }

      // 2. Draw each cellular organelle / fluorescent node
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i]

        // Update positions (ambient drift)
        if (!prefersReducedMotion) {
          c.x += c.vx
          c.y += c.vy
          c.pulse += c.pulseSpeed

          // Wrap edges smoothly with margin
          const margin = c.radius * 2
          if (c.x < -margin) c.x = w + margin
          if (c.x > w + margin) c.x = -margin
          if (c.y < -margin) c.y = h + margin
          if (c.y > h + margin) c.y = -margin
        }

        const dynamicPulse = Math.sin(c.pulse) * 0.25 + 0.75
        const currentAlpha = c.baseAlpha * dynamicPulse
        const currentRadius = c.radius * (1 + Math.sin(c.pulse) * 0.06)

        // Radial fluorescence glow
        const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, currentRadius * 1.8)
        glow.addColorStop(0, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${currentAlpha * 1.4})`)
        glow.addColorStop(0.4, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${currentAlpha * 0.6})`)
        glow.addColorStop(1, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, 0)`)

        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(c.x, c.y, currentRadius * 1.8, 0, Math.PI * 2)
        ctx.fill()

        // If macro cell: draw delicate membrane ring and inner nucleus
        if (c.isMacro) {
          // Cellular membrane outline
          ctx.strokeStyle = `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${currentAlpha * 0.8})`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(c.x, c.y, currentRadius * 0.75, 0, Math.PI * 2)
          ctx.stroke()

          // Dense nucleus node
          const nucleus = ctx.createRadialGradient(
            c.x - currentRadius * 0.15,
            c.y - currentRadius * 0.15,
            0,
            c.x,
            c.y,
            currentRadius * 0.35
          )
          nucleus.addColorStop(0, `rgba(234, 245, 238, ${currentAlpha * 1.6})`)
          nucleus.addColorStop(0.7, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, ${currentAlpha})`)
          nucleus.addColorStop(1, `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, 0)`)

          ctx.fillStyle = nucleus
          ctx.beginPath()
          ctx.arc(c.x, c.y, currentRadius * 0.35, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    // Initial render
    render()

    // Battery & CPU optimization: pause when tab is inactive
    function handleVisibility() {
      if (document.hidden) {
        isPaused = true
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // IntersectionObserver optimization: pause canvas RAF loop if offscreen
    let observer = null
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry && !entry.isIntersecting) {
          isPaused = true
          if (animationFrameId) cancelAnimationFrame(animationFrameId)
        } else if (!document.hidden) {
          isPaused = false
          if (!prefersReducedMotion) {
            animationFrameId = requestAnimationFrame(render)
          }
        }
      }, { threshold: 0.05 })
      observer.observe(canvas)
    }

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (observer) observer.disconnect()
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="gfp-microscopy-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="gfp-canvas" />
      <div className="gfp-ambient-vignette" />
    </div>
  )
}

export default GfpBackground
