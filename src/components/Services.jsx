function Services({ activePage, setActivePage }) {
  return (
    <article className={`services${activePage === 'services' ? ' active' : ''}`} data-page="services">

      <header>
        <h2 className="h2 article-title">Services</h2>
      </header>

      <p className="page-subtitle">
        Tutoring designed around how your child actually learns.
      </p>

      {/* What I Offer */}
      <section className="service">
        <h3 className="h3 service-title">What I Offer</h3>

        <p className="section-intro-text">
          All sessions are one-on-one and fully online, so lessons can move at exactly the pace
          your child needs — no rushing to keep up with a group, and no waiting around either.
          I work with students across all grade levels, from elementary through high school.
        </p>

        <ul className="service-list">

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="flag-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">US Curriculum</h4>
              <p className="service-item-text">
                Math support aligned with US grade-level standards — from foundational arithmetic
                through algebra, geometry, and beyond.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="globe-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Canadian Curriculum</h4>
              <p className="service-item-text">
                Tailored support aligned with provincial math curricula, helping students stay
                confident and on track with coursework.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="document-text-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Homework &amp; Exam Support</h4>
              <p className="service-item-text">
                Focused help with homework, test preparation, and clearing specific doubts as they come up.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="bulb-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Concept Building</h4>
              <p className="service-item-text">
                For students who want to strengthen fundamentals, not just get through the next test.
              </p>
            </div>
          </li>

          <li className="service-item service-item--addon">
            <div className="service-icon-box">
              <ion-icon name="alarm-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                <h4 className="h4 service-item-title" style={{ marginBottom: 0 }}>
                  Exam Revision Sessions
                </h4>
              </div>
              <p className="service-item-text">
                Early morning sessions before a test to revise key topics and clear last-minute
                doubts — booked separately, as needed.
              </p>
            </div>
          </li>

           <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="bulb-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">No Advanced Payment</h4>
              <p className="service-item-text">
                "Trust is gained when actions meet words." - Chris Butler Our no-advance payment policy bestows priority on classes rather than payments. Make the payment at the end of the month just for. the sessions attended. No admission fee! No pre-cancellation fee! No post-cancellation fee!
              </p>
            </div>
          </li>

         

        </ul>
      </section>

      {/* How Sessions Work */}
      <section className="sessions-info">
        <h3 className="h3 sessions-info-title">How Sessions Work</h3>

        <div className="sessions-table-wrapper content-card" style={{ paddingTop: '20px', cursor: 'default' }}>
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="person-outline"></ion-icon>
                    <span>Session Type</span>
                  </div>
                </td>
                <td>One-on-one, fully online</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="videocam-outline"></ion-icon>
                    <span>Platform</span>
                  </div>
                </td>
                <td>Zoom / Google Meet / Teams (whichever works best for you)</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="globe-outline"></ion-icon>
                    <span>Time Zones Served</span>
                  </div>
                </td>
                <td>EST, CST, and PST</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>Scheduling</span>
                  </div>
                </td>
                <td>Flexible, based on availability — contact to check current openings</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="stats-chart-outline"></ion-icon>
                    <span>Progress Updates</span>
                  </div>
                </td>
                <td>Regular updates shared directly with parents</td>
              </tr>
            </tbody>
          </table>

          <p className="pricing-note">
            <ion-icon name="information-circle-outline"></ion-icon>
            <span>
              Pricing is shared directly on request — reach out via email or WhatsApp for current rates.
            </span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="services-cta">
        <div className="services-cta-card content-card" style={{ paddingTop: '25px', cursor: 'default', textAlign: 'center' }}>
          <h3 className="h3" style={{ marginBottom: '10px' }}>Have a question about fit or scheduling?</h3>
          <p className="services-cta-text">
            I'm happy to talk through your child's needs before we begin.
          </p>
          <a
            className="hero-cta-btn primary services-cta-btn"
            href="https://docs.google.com/forms/d/e/1FAIpQLScQ5j02hoEAjPNSjb7SOhjNzGnXARnFZ281JZst6DHF7nOWWA/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Check Availability</span>
          </a>
          
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

      <footer className="site-footer">
        <p>© 2026 Kavitha JR — Online Math Tutor. All rights reserved.</p>
      </footer>

    </article>
  )
}

export default Services
