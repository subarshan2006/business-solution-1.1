import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { revokeEphemeralBlob } from '../services/ephemeralImageService'

function WatermarkedDiagramCanvas({ src, watermarkText = '', alt = 'Question Diagram', maxWidth = 800 }) {
  const canvasRef = useRef(null)
  const zoomCanvasRef = useRef(null)
  const viewportRef = useRef(null)
  const imgRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  // Interactive Zoom & Pan States
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Refs for tracking active gestures without React render lags
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  scaleRef.current = scale
  panRef.current = pan

  const pinchStartDistRef = useRef(0)
  const pinchStartScaleRef = useRef(1)
  const pinchStartPanRef = useRef({ x: 0, y: 0 })
  const pinchStartCenterRef = useRef({ x: 0, y: 0 })
  const isPinchingRef = useRef(false)

  const isDraggingTouchRef = useRef(false)
  const panStartTouchRef = useRef({ x: 0, y: 0 })
  const panStartOffsetRef = useRef({ x: 0, y: 0 })

  const isDraggingMouseRef = useRef(false)
  const mouseStartRef = useRef({ x: 0, y: 0 })

  const lastTapTimeRef = useRef(0)
  const lastTapPosRef = useRef(null)

  // Lock background scroll and support Escape key when zoomed
  useEffect(() => {
    if (!isZoomed) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsZoomed(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isZoomed])

  // Load and render base diagram on mount or when src changes
  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Support high-DPI displays
      const dpr = window.devicePixelRatio || 1
      const displayWidth = Math.min(img.width, maxWidth)
      const displayHeight = (img.height / img.width) * displayWidth

      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      ctx.scale(dpr, dpr)

      // Draw diagram
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

      setLoading(false)
    }

    img.onerror = () => {
      setError(true)
      setLoading(false)
    }

    const currentCanvas = canvasRef.current

    // Cleanup: Zero canvas memory when image changes or unmounts
    return () => {
      imgRef.current = null
      if (currentCanvas) {
        const ctx = currentCanvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
      }
      if (src && src.startsWith('blob:')) {
        revokeEphemeralBlob(src)
      }
    }
  }, [src, watermarkText, maxWidth])

  // Draw full-resolution diagram on the zoom modal canvas
  useEffect(() => {
    if (!isZoomed) return

    const drawZoom = () => {
      const zoomCanvas = zoomCanvasRef.current
      const source = imgRef.current || canvasRef.current
      if (!zoomCanvas || !source) return

      const naturalW = source.naturalWidth || source.width || 800
      const naturalH = source.naturalHeight || source.height || 600

      zoomCanvas.width = naturalW
      zoomCanvas.height = naturalH
      const ctx = zoomCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, naturalW, naturalH)
        ctx.drawImage(source, 0, 0, naturalW, naturalH)
      }
    }

    drawZoom()
  }, [isZoomed])

  // Clamp pan so zoomed canvas never disappears off-screen
  const clampPan = useCallback((px, py, currentScale) => {
    if (currentScale <= 1) return { x: 0, y: 0 }
    const viewport = viewportRef.current
    if (!viewport) return { x: px, y: py }
    const rect = viewport.getBoundingClientRect()
    const maxPanX = Math.max((rect.width * (currentScale - 1)) / 2 + 60, 60)
    const maxPanY = Math.max((rect.height * (currentScale - 1)) / 2 + 60, 60)
    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, px)),
      y: Math.min(maxPanY, Math.max(-maxPanY, py)),
    }
  }, [])

  // Two-Finger Pinch & One-Finger Pan Touch Listeners (attached with passive: false)
  useEffect(() => {
    if (!isZoomed) return
    const viewport = viewportRef.current
    if (!viewport) return

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // TWO FINGERS: Pinch gesture
        e.preventDefault()
        isPinchingRef.current = true
        isDraggingTouchRef.current = false

        const t1 = e.touches[0]
        const t2 = e.touches[1]
        pinchStartDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        pinchStartScaleRef.current = scaleRef.current
        pinchStartPanRef.current = { ...panRef.current }
        pinchStartCenterRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        }
      } else if (e.touches.length === 1) {
        // SINGLE FINGER: Pan gesture (if zoomed) or tap
        const t = e.touches[0]
        panStartTouchRef.current = { x: t.clientX, y: t.clientY }
        panStartOffsetRef.current = { ...panRef.current }
        isDraggingTouchRef.current = scaleRef.current > 1
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && isPinchingRef.current) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        if (pinchStartDistRef.current > 0) {
          const factor = dist / pinchStartDistRef.current
          const targetScale = Math.min(5, Math.max(1, pinchStartScaleRef.current * factor))

          const center = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          }
          const dx = center.x - pinchStartCenterRef.current.x
          const dy = center.y - pinchStartCenterRef.current.y

          const rect = viewport.getBoundingClientRect()
          const originX = pinchStartCenterRef.current.x - (rect.left + rect.width / 2)
          const originY = pinchStartCenterRef.current.y - (rect.top + rect.height / 2)

          const scaleRatio = targetScale / pinchStartScaleRef.current
          const newPanX = pinchStartPanRef.current.x + dx - originX * (scaleRatio - 1)
          const newPanY = pinchStartPanRef.current.y + dy - originY * (scaleRatio - 1)

          setScale(targetScale)
          setPan(clampPan(newPanX, newPanY, targetScale))
        }
      } else if (e.touches.length === 1 && isDraggingTouchRef.current && scaleRef.current > 1) {
        e.preventDefault()
        const t = e.touches[0]
        const dx = t.clientX - panStartTouchRef.current.x
        const dy = t.clientY - panStartTouchRef.current.y
        const nextX = panStartOffsetRef.current.x + dx
        const nextY = panStartOffsetRef.current.y + dy
        setPan(clampPan(nextX, nextY, scaleRef.current))
      }
    }

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false
      }
      if (e.touches.length === 0) {
        isDraggingTouchRef.current = false

        // Double tap detection
        const now = Date.now()
        if (now - lastTapTimeRef.current < 280) {
          if (scaleRef.current > 1.1) {
            setScale(1)
            setPan({ x: 0, y: 0 })
          } else {
            const targetScale = 2.5
            const rect = viewport.getBoundingClientRect()
            if (lastTapPosRef.current && rect) {
              const tapX = lastTapPosRef.current.x - (rect.left + rect.width / 2)
              const tapY = lastTapPosRef.current.y - (rect.top + rect.height / 2)
              setScale(targetScale)
              setPan(clampPan(-tapX * (targetScale - 1), -tapY * (targetScale - 1), targetScale))
            } else {
              setScale(targetScale)
            }
          }
          lastTapTimeRef.current = 0
        } else if (e.changedTouches?.[0]) {
          lastTapTimeRef.current = now
          lastTapPosRef.current = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          }
        }

        // Snap back if released very close to 1x
        if (scaleRef.current <= 1.05) {
          setScale(1)
          setPan({ x: 0, y: 0 })
        }
      }
    }

    // Laptop trackpad pinch & mouse wheel zoom
    const onWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const isPinch = e.ctrlKey
      const zoomDelta = -e.deltaY * (isPinch ? 0.015 : 0.002)
      const currentScale = scaleRef.current
      const targetScale = Math.min(5, Math.max(1, currentScale * (1 + zoomDelta)))

      if (targetScale <= 1.02) {
        setScale(1)
        setPan({ x: 0, y: 0 })
        return
      }

      const rect = viewport.getBoundingClientRect()
      const cursorX = e.clientX - (rect.left + rect.width / 2)
      const cursorY = e.clientY - (rect.top + rect.height / 2)
      const ratio = targetScale / currentScale

      const currentPan = panRef.current
      const newPanX = currentPan.x - cursorX * (ratio - 1)
      const newPanY = currentPan.y - cursorY * (ratio - 1)

      setScale(targetScale)
      setPan(clampPan(newPanX, newPanY, targetScale))
    }

    viewport.addEventListener('touchstart', onTouchStart, { passive: false })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    viewport.addEventListener('touchend', onTouchEnd, { passive: false })
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: false })
    viewport.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      viewport.removeEventListener('touchend', onTouchEnd)
      viewport.removeEventListener('touchcancel', onTouchEnd)
      viewport.removeEventListener('wheel', onWheel)
    }
  }, [isZoomed, clampPan])

  // Mouse Drag Listeners on Window for Smooth Laptop Panning
  useEffect(() => {
    if (!isZoomed) return

    const handleMouseMove = (e) => {
      if (!isDraggingMouseRef.current) return
      e.preventDefault()
      const dx = e.clientX - mouseStartRef.current.x
      const dy = e.clientY - mouseStartRef.current.y
      setPan(clampPan(panStartOffsetRef.current.x + dx, panStartOffsetRef.current.y + dy, scaleRef.current))
    }

    const handleMouseUp = () => {
      isDraggingMouseRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isZoomed, clampPan])

  const handleMouseDown = (e) => {
    if (scaleRef.current <= 1 || e.button !== 0) return
    e.preventDefault()
    isDraggingMouseRef.current = true
    mouseStartRef.current = { x: e.clientX, y: e.clientY }
    panStartOffsetRef.current = { ...panRef.current }
  }

  const handleDoubleClick = (e) => {
    if (scaleRef.current > 1.1) {
      setScale(1)
      setPan({ x: 0, y: 0 })
    } else {
      const targetScale = 2.5
      const viewport = viewportRef.current
      if (viewport) {
        const rect = viewport.getBoundingClientRect()
        const tapX = e.clientX - (rect.left + rect.width / 2)
        const tapY = e.clientY - (rect.top + rect.height / 2)
        setScale(targetScale)
        setPan(clampPan(-tapX * (targetScale - 1), -tapY * (targetScale - 1), targetScale))
      } else {
        setScale(targetScale)
      }
    }
  }

  const handleZoomIn = () => {
    const next = Math.min(5, Math.round((scaleRef.current + 0.5) * 10) / 10)
    setScale(next)
  }

  const handleZoomOut = () => {
    const next = Math.max(1, Math.round((scaleRef.current - 0.5) * 10) / 10)
    setScale(next)
    if (next === 1) setPan({ x: 0, y: 0 })
  }

  const handleResetZoom = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  if (!src) return null

  return (
    <div className="qb-diagram-wrapper">
      <div
        className="qb-diagram-container"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => {
          setScale(1)
          setPan({ x: 0, y: 0 })
          setIsZoomed(true)
        }}
        title="Click to zoom diagram"
      >
        {loading && <div className="qb-diagram-loading">Loading secure question diagram...</div>}
        {error && (
          <div className="qb-diagram-error">
            <ion-icon name="image-outline"></ion-icon>
            <span>Diagram could not be loaded or has expired.</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="qb-diagram-canvas"
          aria-label={alt}
          style={{ display: loading || error ? 'none' : 'block' }}
        />
        <div className="qb-diagram-zoom-hint">
          <ion-icon name="scan-outline"></ion-icon>
          <span>Click to Enlarge</span>
        </div>
      </div>

      {/* Lightbox Zoom Modal rendered at root viewport level */}
      {isZoomed &&
        createPortal(
          <div
            className="qb-diagram-lightbox"
            onClick={() => setIsZoomed(false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="qb-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="qb-lightbox-header">
                <div className="qb-lightbox-title-box">
                  <span className="qb-lightbox-title">{alt}</span>
                  <span className="qb-zoom-badge">{Math.round(scale * 100)}%</span>
                </div>

                <div className="qb-zoom-toolbar">
                  <button
                    type="button"
                    className="qb-zoom-btn"
                    onClick={handleZoomOut}
                    disabled={scale <= 1}
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <ion-icon name="remove-outline"></ion-icon>
                  </button>
                  <button
                    type="button"
                    className="qb-zoom-btn qb-zoom-btn-reset"
                    onClick={handleResetZoom}
                    disabled={scale === 1}
                    title="Reset to 100%"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="qb-zoom-btn"
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <ion-icon name="add-outline"></ion-icon>
                  </button>
                  <button
                    type="button"
                    className="qb-modal-close-btn"
                    onClick={() => setIsZoomed(false)}
                    title="Close (Esc)"
                    aria-label="Close"
                  >
                    <ion-icon name="close-outline"></ion-icon>
                  </button>
                </div>
              </div>

              <div className="qb-lightbox-body">
                <div
                  ref={viewportRef}
                  className="qb-lightbox-viewport"
                  onMouseDown={handleMouseDown}
                  onDoubleClick={handleDoubleClick}
                  style={{
                    cursor: scale > 1 ? (isDraggingMouseRef.current ? 'grabbing' : 'grab') : 'default',
                  }}
                >
                  <div
                    className="qb-lightbox-transform-layer"
                    style={{
                      transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
                      transformOrigin: 'center center',
                      transition: isPinchingRef.current || isDraggingTouchRef.current || isDraggingMouseRef.current ? 'none' : 'transform 0.15s ease-out',
                    }}
                  >
                    <canvas
                      ref={zoomCanvasRef}
                      className="qb-zoom-canvas"
                      aria-label={alt}
                    />
                  </div>

                  <div className={`qb-lightbox-hint-pill${scale > 1 ? ' active' : ''}`}>
                    <ion-icon name="finger-print-outline"></ion-icon>
                    <span>Pinch with 2 fingers or scroll to zoom • Drag to pan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default WatermarkedDiagramCanvas
