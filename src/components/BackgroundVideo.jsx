import { useEffect, useRef } from 'react'

const VIDEO_SRC = '/assets/videos/bg-loop.mp4'
const POSTER_SRC = '/assets/videos/bg-poster.jpg'

function BackgroundVideo() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Some browsers throttle offscreen video; nudge playback so the loop never stalls.
    function handleVisibility() {
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch(() => {})
      }
    }

    // If playback ever ends unexpectedly, restart it immediately.
    function handleEnded() {
      video.currentTime = 0
      video.play().catch(() => {})
    }

    document.addEventListener('visibilitychange', handleVisibility)
    video.addEventListener('ended', handleEnded)

    const playPromise = video.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div className="body-bg-video" aria-hidden="true">
      <video
        ref={videoRef}
        className="body-bg-video-media"
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      />
      <div className="body-bg-video-tint" />
    </div>
  )
}

export default BackgroundVideo