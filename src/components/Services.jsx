const ENROLL_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLScQ5j02hoEAjPNSjb7SOhjNzGnXARnFZ281JZst6DHF7nOWWA/viewform'

function Services({ activePage }) {
  return (
    <article className={`services${activePage === 'services' ? ' active' : ''}`} data-page="services">
 <br /><br />
      <header>
        <h2 className="h2 article-title">Courses</h2>
      </header>

      <p className="page-subtitle">
        Structured curricula &amp; instructional offerings.
      </p>

      {/* What I Offer */}
      <section className="service">
        <h3 className="h3 service-title">Academic Programs</h3>

        <p className="section-intro-text">
          Every session is 100% online, one-on-one private live instruction delivered via
          Google Meet with an interactive digital board. Each programme is paced to your student's
          exact school syllabus, unit tests, midterms, and May College Board exam deadlines.
        </p>

        <ul className="service-list">

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="leaf-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Biology <span style={{ color: 'var(--orange-yellow-crayola)', fontSize: 'var(--fs-8)' }}>Signature Program</span></h4>
              <p className="service-item-text">
                <strong>Scope:</strong> Full College Board Units 1–8 coverage — biochemistry,
                energetics, heredity, gene regulation, and ecology.
              </p>
              <p className="service-item-text" style={{ marginTop: '8px' }}>
                <strong>Strategy:</strong> Mastery of stimulus-based MCQs, experimental design
                hypotheses, chi-square statistical analysis, and dedicated FRQ rubric drills.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="earth-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Environmental Science (APES)</h4>
              <p className="service-item-text">
                <strong>Scope:</strong> Earth systems, population biology, renewable and
                non-renewable resource management, pollution, and global climatic trends.
              </p>
              <p className="service-item-text" style={{ marginTop: '8px' }}>
                <strong>Strategy:</strong> Integrating interdisciplinary science with quantitative
                mathematical calculations and policy critique.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="bulb-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Psychology</h4>
              <p className="service-item-text">
                <strong>Scope:</strong> Biological bases of behavior, cognition, developmental
                milestones, clinical psychology, and social interactions.
              </p>
              <p className="service-item-text" style={{ marginTop: '8px' }}>
                <strong>Strategy:</strong> Emphasis on research methodology, ethical testing
                principles, and contextual concept-application questions.
              </p>
            </div>
          </li>

          <li className="service-item">
            <div className="service-icon-box">
              <ion-icon name="school-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Honors Biology &amp; General Science</h4>
              <p className="service-item-text">
                <strong>Scope:</strong> Middle and early high school life sciences and physical
                sciences.
              </p>
              <p className="service-item-text" style={{ marginTop: '8px' }}>
                <strong>Strategy:</strong> Establishing rigorous scientific vocabulary, deductive
                reasoning, and study systems ahead of high school AP pathways.
              </p>
            </div>
          </li>

          <li className="service-item service-item--addon">
            <div className="service-icon-box">
              <ion-icon name="trophy-outline" style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            </div>
            <div className="service-content-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                <h4 className="h4 service-item-title" style={{ marginBottom: 0 }}>
                  USA Biology Olympiad (USABO)
                </h4>
                <span className="hero-badge" style={{ marginBottom: 0, padding: '3px 10px' }}>
                  <span>Competitive Enrichment</span>
                </span>
              </div>
              <p className="service-item-text">
                <strong>Strategic Scope:</strong> A specialised offering tailored for ambitious high
                school students embarking on competition-level biology.
              </p>
              <p className="service-item-text" style={{ marginTop: '8px' }}>
                <strong>Focus:</strong> In-depth study of advanced biological systems and Campbell
                Biology topics, building the foundational data interpretation and problem solving
                required for Olympiad-level challenges.
              </p>
            </div>
          </li>

        </ul>
      </section>

      {/* Delivery Logistics */}
      <section className="sessions-info">
        <h3 className="h3 sessions-info-title">Delivery Logistics</h3>

        <div className="sessions-table-wrapper content-card" style={{ paddingTop: '20px', cursor: 'default' }}>
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Operational Dimension</th>
                <th>Implementation Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="person-outline"></ion-icon>
                    <span>Session Format</span>
                  </div>
                </td>
                <td>100% online, 1-on-1 private live instruction via Google Meet with interactive digital board</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="globe-outline"></ion-icon>
                    <span>Time Zone Scheduling</span>
                  </div>
                </td>
                <td>Direct accommodation for US time zones — EST, CST, MST, PST — plus flexible slots for international students</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>Diagnostic &amp; Pace</span>
                  </div>
                </td>
                <td>Paced to the student's exact school syllabus, unit tests, midterms, and May College Board exam deadlines</td>
              </tr>
              <tr>
                <td>
                  <div className="table-label">
                    <ion-icon name="stats-chart-outline"></ion-icon>
                    <span>Reporting &amp; Feedback</span>
                  </div>
                </td>
                <td>Reporting
Mandatory session updates shared via email and Google Classroom, with continuous feedback and active parent communication on WhatsApp</td>
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
            href={ENROLL_FORM}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Book Diagnostic Consultation</span>
          </a>

          <ul className="social-list" style={{ justifyContent: 'center', marginTop: '30px' }}>
            <li className="social-item">
              <a href="https://wa.me/919995800949" className="social-link" style={{ fontSize: '1.5rem' }}>
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
        <p>© 2026 Jivanaut Test Prep — Explorer of Life Science. All rights reserved.</p>
      </footer>

    </article>
  )
}

export default Services