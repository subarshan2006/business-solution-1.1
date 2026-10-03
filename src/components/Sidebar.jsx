import { useState } from 'react'

function Sidebar() {
  const [isActive, setIsActive] = useState(false)

  return (
    <aside className={`sidebar${isActive ? ' active' : ''}`} data-sidebar>

      <div className="sidebar-info">

        <figure className="avatar-box">
          <img src={`${import.meta.env.BASE_URL}assets/images/avatar-3.png`} alt="Kavitha JR" width="80" />
        </figure>

        <div className="info-content">
          <h1 className="name" title="Kavitha JR">Kavitha JR</h1>
          <p className="title">
            <span className="status-dot"></span> Online Math Tutor
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
              <ion-icon name="mail-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Email</p>
              <a href="mailto:kavitha.nextsteptutoring@gmail.com" className="contact-link">kavitha.nextsteptutoring@gmail.com</a>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="logo-whatsapp"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">WhatsApp</p>
              <a href="https://wa.me/918610933559" className="contact-link">+91 86109 33559</a>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="ribbon-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Experience</p>
              <span className="contact-link" style={{ cursor: 'default' }}>11+ Years Teaching</span>
            </div>
          </li>

          <li className="contact-item">
            <div className="icon-box">
              <ion-icon name="location-outline"></ion-icon>
            </div>
            <div className="contact-info">
              <p className="contact-title">Location</p>
              <address>Online — US &amp; Canada</address>
            </div>
          </li>

        </ul>

        <div className="separator"></div>

        <ul className="social-list">
          <li className="social-item">
            <a href="mailto:kavitha.nextsteptutoring@gmail.com" className="social-link" title="Email">
              <ion-icon name="mail-outline"></ion-icon>
            </a>
          </li>
          <li className="social-item">
            <a href="https://wa.me/918610933559" className="social-link" title="WhatsApp">
              <ion-icon name="logo-whatsapp"></ion-icon>
            </a>
          </li>
          <li className="social-item">
            <a href="#" className="social-link" title="LinkedIn">
              <ion-icon name="logo-linkedin"></ion-icon>
            </a>
          </li>
        </ul>

      </div>

    </aside>
  )
}

export default Sidebar
