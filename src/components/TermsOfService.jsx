import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const BASE_TITLE = 'Jivanaut Test Prep'

export default function TermsOfService() {
  useEffect(() => {
    document.title = `Terms of Service | ${BASE_TITLE}`
    window.scrollTo(0, 0)
    return () => { document.title = BASE_TITLE }
  }, [])

  return (
    <article className="active" style={{ padding: '30px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '28px', borderBottom: '1px solid var(--jet, rgba(255,255,255,0.1))', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="h2 article-title" style={{ margin: 0 }}>Terms of Service</h2>
          <Link to="/" className="hero-cta-btn secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px' }}>
            <ion-icon name="arrow-back-outline"></ion-icon>
            <span>Back to Home</span>
          </Link>
        </div>
        <p style={{ color: 'var(--light-gray-70, #aaa)', fontSize: '13px', marginTop: '8px' }}>
          Last Updated &amp; Effective Date: October 12, 2026
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', color: 'var(--light-gray, #ccc)', fontSize: '14.5px' }}>
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            1. Agreement to Terms
          </h3>
          <p>
            By accessing or using the services provided by <strong>Jivanaut Test Prep</strong> at{' '}
            <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>
              https://www.jivanauttestprep.com
            </a> (including our tutoring sessions, student records portal, and Google Classroom integration), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our site or services.
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            2. Tutoring Services &amp; Educational Scope
          </h3>
          <p>
            Jivanaut Test Prep provides 1-on-1 and small group academic tutoring, enrichment mentoring, and test preparation for subjects including AP Biology, AP Environmental Science, AP Psychology, and USABO (USA Biolympiad).
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Tutoring sessions are conducted live online via authorized video conferencing tools.</li>
            <li>We do not guarantee specific numerical exam scores or college admissions outcomes, but commit to dedicated pedagogical mentorship and curriculum alignment.</li>
          </ul>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            3. Google Classroom Integration &amp; Authentication
          </h3>
          <p>
            Students and educators may connect their official Google Classroom accounts to review assignments, track completion, and access homework feedback.
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Users are responsible for maintaining the confidentiality of their Google credentials.</li>
            <li>Users agree to access only classrooms and student records they are legitimately enrolled in or authorized to instruct.</li>
            <li>We reserve the right to restrict or terminate portal access for users who attempt unauthorized access to other students&rsquo; records.</li>
          </ul>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            4. Academic Integrity &amp; Conduct
          </h3>
          <p>
            We strictly uphold high standards of academic honesty:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Tutors assist students in understanding concepts, solving practice problems, and learning scientific reasoning. Tutors do not complete graded high school examinations or take tests on behalf of students.</li>
            <li>All participants must maintain respectful, professional communication at all times.</li>
          </ul>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            5. Intellectual Property
          </h3>
          <p>
            All custom notes, practice worksheets, curriculum materials, branding, and website content provided by Jivanaut Test Prep are the proprietary intellectual property of Jivanaut Test Prep, protected by copyright and intellectual property laws. They are licensed solely for the personal educational use of enrolled students and may not be distributed or sold commercially.
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            6. Limitation of Liability
          </h3>
          <p>
            To the maximum extent permitted by applicable law, Jivanaut Test Prep and its educators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of our educational services, website downtime, or third-party service interruptions (such as Google APIs).
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            7. Contact Information
          </h3>
          <p>
            For questions concerning these Terms of Service:
          </p>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Organization:</strong> Jivanaut Test Prep</div>
            <div><strong>Support Email:</strong> <a href="mailto:subarshan195@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>subarshan195@gmail.com</a></div>
            <div><strong>General Contact:</strong> <a href="mailto:jivanauttestprep@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>jivanauttestprep@gmail.com</a></div>
            <div><strong>Website:</strong> <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>https://www.jivanauttestprep.com</a></div>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--jet, rgba(255,255,255,0.08))', textAlign: 'center', color: 'var(--light-gray-70, #888)', fontSize: '12px' }}>
        <p>&copy; 2026 Jivanaut Test Prep. All rights reserved. | <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</Link></p>
      </footer>
    </article>
  )
}
