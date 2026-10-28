function WhatsAppFab() {
  return (
    <a
      className="whatsapp-fab"
      href="https://wa.me/919995800949"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message on WhatsApp"
      title="Message on WhatsApp"
    >
      <span className="whatsapp-fab-pulse" aria-hidden="true"></span>
      <span className="whatsapp-fab-pulse whatsapp-fab-pulse-delay" aria-hidden="true"></span>
      <span className="whatsapp-fab-ring" aria-hidden="true"></span>
      <span className="whatsapp-fab-icon-box" aria-hidden="true">
        <ion-icon name="logo-whatsapp"></ion-icon>
        <span className="whatsapp-fab-shine"></span>
      </span>
      <span className="whatsapp-fab-label">Ask a question</span>
    </a>
  )
}

export default WhatsAppFab
