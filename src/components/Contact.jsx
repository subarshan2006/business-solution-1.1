function Contact({ activePage }) {
  return (
    <article className={`contact${activePage === 'contact' ? ' active' : ''}`} data-page="contact">

      <header>
        <h2 className="h2 article-title">Get in Touch</h2>
      </header>

      <section className="contact-intro">
        <h3 className="h3" style={{ marginBottom: '15px' }}>
          Let's help your child build confidence in math.
        </h3>
        <p className="contact-intro-text">
          Reach out to schedule a session, ask about pricing, or check current
          availability for your time zone.
        </p>
      </section>

      {/* CTA Buttons */}
      <section className="contact-cta-section">
        <ul className="contact-cta-grid">
          <li>
            <a href="mailto:kavitha.nextsteptutoring@gmail.com" className="contact-cta-card">
              <div className="contact-cta-icon">
                <ion-icon name="mail-outline"></ion-icon>
              </div>
              <h4 className="h4 contact-cta-title">Email Me</h4>
              <p className="contact-cta-text">kavitha.nextsteptutoring@gmail.com</p>
            </a>
          </li>
          <li>
            <a href="https://wa.me/918610933559" className="contact-cta-card" target="_blank" rel="noopener noreferrer">
              <div className="contact-cta-icon">
                <ion-icon name="logo-whatsapp"></ion-icon>
              </div>
              <h4 className="h4 contact-cta-title">WhatsApp Me</h4>
              <p className="contact-cta-text">+91 86109 33559</p>
            </a>
          </li>
        </ul>
      </section>

      {/* Availability info */}
      <section className="availability-section">
        <h3 className="h3" style={{ marginBottom: '15px' }}>Availability</h3>
        <div className="content-card availability-card" style={{ paddingTop: '25px', cursor: 'default' }}>
          <ul className="availability-list">
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="time-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">Time Zones</h5>
                <p className="availability-text">EST · CST · PST — flexible scheduling</p>
              </div>
            </li>
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="calendar-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">First Session</h5>
                <p className="availability-text">Introductory session to assess fit &amp; goals</p>
              </div>
            </li>
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="laptop-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">100% Online</h5>
                <p className="availability-text">All you need is a stable internet connection</p>
              </div>
            </li>
          </ul>
          
          <ul className="social-list" style={{ justifyContent: 'center', marginTop: '30px' }}>
            <li className="social-item">
              <a href="https://wa.me/918610933559" className="social-link" style={{ fontSize: '1.5rem' }}>
                <ion-icon name="logo-whatsapp"></ion-icon>
              </a>
            </li>
            <li className="social-item">
              <a href="#" className="social-link" style={{ fontSize: '1.5rem' }}>
                <ion-icon name="logo-instagram"></ion-icon>
              </a>
            </li>
            <li className="social-item">
              <a href="#" className="social-link" style={{ fontSize: '1.5rem' }}>
                <ion-icon name="logo-linkedin"></ion-icon>
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* Advertisement Banner */}
      <section className="ad-banner">
        <img src="/assets/images/image.png" alt="Advertisement" className="ad-banner-img" />
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <p>© 2026 Kavitha JR — Online Math Tutor. All rights reserved.</p>
      </footer>

    </article>
  )
}

export default Contact
