import { useState } from 'react'
import { Link } from 'react-router-dom'

function Sidebar() {
  const [isActive, setIsActive] = useState(false)

  return (
    <aside className={`sidebar${isActive ? ' active' : ''}`} data-sidebar>

      <div className="sidebar-info">

        <figure className="avatar-box" style={{ background: 'transparent', boxShadow: 'none' }}>
          <img
            src={`${import.meta.env.BASE_URL}assets/images/logo-image.png`}
            alt="Jivanaut Test Prep"
            style={{ borderRadius: '24px', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)', objectFit: 'contain' }}
          />
        </figure>

        <div className="info-content">
          <h1 className="name" title="Steena Antony">Steena Antony</h1>
          <p className="title">
            <span className="status-dot"></span> AP Biology &amp; USABO Tutor
          </p>
        </div>

        <button
          className="info_more-btn"
          data-sidebar-btn
          onClick={() => setIsActive(!isActive)}
        >
          <span>Show Contacts</span>
          <ion-icon name="chevron-down"></ion-icon>
        </button>

      </div>

      <div className="sidebar-info_more">

        <div className="separator"></div>

        <ul className="contacts-list">

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Consultation</p>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSc615afQFRpiaWyfpmTKWOBSGzOYmZDcg95rZZ9u3HKvBbT8g/viewform" target="_blank" rel="noopener noreferrer" className="contact-link">Book Free 20-min Call</a>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="mail-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Email</p>
              <a href="mailto:jivanautprep@gmail.com" className="contact-link">jivanautprep@gmail.com</a>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="logo-whatsapp"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">WhatsApp</p>
              <a href="https://wa.me/919995800949" target="_blank" rel="noopener noreferrer" className="contact-link">+91 99958 00949</a>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Hours &amp; Zones</p>
              <address>Sessions in ET · CT · MT · PT</address>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="ribbon-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Credentials</p>
              <span className="contact-link" style={{ cursor: 'default' }}>M.Sc. Zoology · M.Sc. Env. Science · B.Ed.</span>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="school-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Experience</p>
              <span className="contact-link" style={{ cursor: 'default' }}>11+ Years Teaching</span>
            </div>
          </li>

        </ul>

        <div className="separator"></div>

        <ul className="social-list">
          <li className="social-item">
            <a href="mailto:jivanautprep@gmail.com" className="social-link" title="Email">
              <ion-icon name="mail-outline"></ion-icon>
            </a>
          </li>
          <li className="social-item">
            <a href="https://wa.me/919995800949" className="social-link" title="WhatsApp">
              <ion-icon name="logo-whatsapp"></ion-icon>
            </a>
          </li>
          <li className="social-item">
            <a href="#" className="social-link" title="LinkedIn">
              <ion-icon name="logo-linkedin"></ion-icon>
            </a>
          </li>
        </ul>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '11px', color: 'var(--light-gray-70, #888)' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
        </div>

      </div>

    </aside>
  )
}

export default Sidebar