import GfpBackground from './GfpBackground'

/**
 * BackgroundVideo component updated to render GFP (Green Fluorescent Protein) microscopy canvas
 * per Design Audit Section 8.2 & 8.3, replacing high-overhead red blood cell video loop.
 */
function BackgroundVideo() {
  return <GfpBackground />
}

export default BackgroundVideo