import { useEffect, useRef, useState } from 'react'
import { revokeEphemeralBlob } from '../services/ephemeralImageService'

function WatermarkedDiagramCanvas({ src, watermarkText = '', alt = 'Question Diagram', maxWidth = 800 }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

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

      // Apply dynamic anti-piracy forensic watermark (subtle slate visible on light & dark)
      if (watermarkText) {
        ctx.save()
        ctx.rotate((-25 * Math.PI) / 180)
        ctx.font = '600 12px Inter, sans-serif'
        ctx.fillStyle = 'rgba(71, 85, 105, 0.22)'
        ctx.textAlign = 'center'

        const text = watermarkText
        const stepX = 220
        const stepY = 90

        for (let x = -displayWidth; x < displayWidth * 2; x += stepX) {
          for (let y = -displayHeight; y < displayHeight * 2; y += stepY) {
            ctx.fillText(text, x, y)
          }
        }
        ctx.restore()
      }

      setLoading(false)
    }

    img.onerror = () => {
      setError(true)
      setLoading(false)
    }

    const currentCanvas = canvasRef.current

    // Cleanup: Zero canvas memory when image changes or unmounts
    return () => {
      if (currentCanvas) {
        const ctx = currentCanvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
      }
      if (src && src.startsWith('blob:')) {
        revokeEphemeralBlob(src)
      }
    }
  }, [src, watermarkText, maxWidth])

  if (!src) return null

  return (
    <div className="qb-diagram-wrapper">
      <div
        className="qb-diagram-container"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => setIsZoomed(true)}
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

      {/* Lightbox Zoom Modal */}
      {isZoomed && (
        <div
          className="qb-diagram-lightbox"
          onClick={() => setIsZoomed(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="qb-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="qb-lightbox-header">
              <span>{alt}</span>
              <button
                type="button"
                className="qb-modal-close-btn"
                onClick={() => setIsZoomed(false)}
              >
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
            <div className="qb-lightbox-body">
              <canvas
                ref={(zoomCanvas) => {
                  if (!zoomCanvas || !canvasRef.current) return
                  const ctx = zoomCanvas.getContext('2d')
                  if (!ctx) return
                  zoomCanvas.width = canvasRef.current.width
                  zoomCanvas.height = canvasRef.current.height
                  zoomCanvas.style.width = '100%'
                  zoomCanvas.style.height = 'auto'
                  ctx.drawImage(canvasRef.current, 0, 0)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WatermarkedDiagramCanvas
