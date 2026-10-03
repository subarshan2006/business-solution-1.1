const ENROLL_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLScQ5j02hoEAjPNSjb7SOhjNzGnXARnFZ281JZst6DHF7nOWWA/viewform'

const intakeFields = [
  'Parent & Student Name',
  'Student Grade Level (Middle School / 9th–12th)',
  'Target Subject (AP Bio, APES, AP Psych, General Bio, USABO)',
  'School Curriculum & Location (State / Country)',
  'Current Time Zone (PST, EST, CST, Other)',
  'Primary Goal (May AP Exam, School Grade Boost)',
  'Preferred Session Days & Times',
  'Direct Contact (WhatsApp / Email)',
]

function Contact({ activePage }) {
  return (
    <article className={`contact${activePage === 'contact' ? ' active' : ''}`} data-page="contact">

      <header>
        <h2 className="h2 article-title">Contact</h2>
      </header>

      <section className="contact-intro">
        <h3 className="h3" style={{ marginBottom: '15px' }}>
          Schedule a Consultation — Take the Next Step in Life Sciences
        </h3>
        <p className="contact-intro-text">
          Connect directly to evaluate your child's syllabus, diagnose current learning gaps, and
          structure an individualized study roadmap.
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
          <li>
            <a
              href={ENROLL_FORM}
              className="contact-cta-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="contact-cta-icon">
                <ion-icon name="calendar-outline"></ion-icon>
              </div>
              <h4 className="h4 contact-cta-title">Book Consultation</h4>
              <p className="contact-cta-text">Complete the parent intake form</p>
            </a>
          </li>
        </ul>
      </section>

      {/* Intake Fields */}
      <section className="availability-section">
        <h3 className="h3" style={{ marginBottom: '15px' }}>Student Intake Details</h3>
        <div className="content-card availability-card" style={{ paddingTop: '25px', cursor: 'default' }}>
          <p className="about-text" style={{ marginBottom: '20px' }}>
            The consultation form captures the following so I can prepare a diagnostic roadmap
            before our first call:
          </p>

          <ul className="availability-list">
            {intakeFields.map((field) => (
              <li className="availability-item" key={field}>
                <div className="icon-box">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                </div>
                <div>
                  <h5 className="h5">{field}</h5>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
            <a
              href={ENROLL_FORM}
              className="hero-cta-btn primary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ion-icon name="document-text-outline"></ion-icon>
              <span>Open Intake Form</span>
            </a>
            <a
              href="https://wa.me/918610933559"
              className="hero-cta-btn secondary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ion-icon name="logo-whatsapp"></ion-icon>
              <span>Message on WhatsApp</span>
            </a>
          </div>
        </div>
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
                <p className="availability-text">EST · CST · MST · PST — plus flexible international slots</p>
              </div>
            </li>
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="calendar-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">First Session</h5>
                <p className="availability-text">Diagnostic consultation to assess fit, gaps &amp; goals</p>
              </div>
            </li>
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="laptop-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">100% Online</h5>
                <p className="availability-text">Zoom or Google Meet with an interactive digital board</p>
              </div>
            </li>
            <li className="availability-item">
              <div className="icon-box">
                <ion-icon name="document-text-outline"></ion-icon>
              </div>
              <div>
                <h5 className="h5">Reporting</h5>
                <p className="availability-text">Regular post-session briefings for parents on request</p>
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
        <img src={`${import.meta.env.BASE_URL}assets/images/image.png`} alt="Advertisement" className="ad-banner-img" />
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <p>© 2026 Jivanaut Test Prep — Explorers of Life Science. All rights reserved.</p>
      </footer>

    </article>
  )
}

export default Contact