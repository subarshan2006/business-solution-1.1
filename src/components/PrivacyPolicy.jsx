import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const BASE_TITLE = 'Jivanaut Test Prep'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = `Privacy Policy | ${BASE_TITLE}`
    window.scrollTo(0, 0)
    return () => { document.title = BASE_TITLE }
  }, [])

  return (
    <article className="active" style={{ padding: '30px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '28px', borderBottom: '1px solid var(--jet, rgba(255,255,255,0.1))', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="h2 article-title" style={{ margin: 0 }}>Privacy Policy</h2>
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
            1. Overview &amp; Introduction
          </h3>
          <p>
            Welcome to <strong>Jivanaut Test Prep</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), operating via{' '}
            <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>
              https://www.jivanauttestprep.com
            </a>. We provide premium 1-on-1 online tutoring in AP Biology, AP Environmental Science, AP Psychology, and USABO enrichment for students globally.
          </p>
          <p style={{ marginTop: '8px' }}>
            We take student privacy and data security with utmost seriousness. This Privacy Policy details how we collect, use, process, and safeguard information when students and educators visit our website or connect through our Google Classroom integration portal.
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            2. Google Classroom API &amp; Google User Data
          </h3>
          <p>
            Our web application integrates with the <strong>Google Classroom API</strong> via Google Identity Services (OAuth 2.0) to give students and authorized tutors access to their classroom coursework, homework submissions, and feedback.
          </p>
          <div style={{ background: 'var(--border-gradient-onyx, rgba(255,255,255,0.03))', border: '1px solid var(--jet, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
            <h4 style={{ color: 'var(--white-1, #fff)', marginBottom: '8px', fontSize: '15px' }}>Information We Access via Google OAuth:</h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Basic Profile &amp; Identity:</strong> Google account email address, full name, and avatar/profile photo to authenticate and distinguish student and tutor sessions.</li>
              <li><strong>Course Information:</strong> Enrolled Google Classroom course titles, descriptions, and IDs.</li>
              <li><strong>Coursework &amp; Assignments:</strong> Assignment titles, descriptions, due dates, and instructions assigned to the student.</li>
              <li><strong>Submissions &amp; Grades:</strong> Homework submission state (Turned In, Assigned, Graded), assigned scores, and educator feedback comments.</li>
              <li><strong>Course Rosters &amp; Announcements:</strong> Classroom student and teacher rosters and class stream announcements.</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            3. How We Use Google User Data
          </h3>
          <p>
            Information obtained through Google Classroom APIs is used strictly to provide the core educational functionality requested by the user:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Displaying personalized homework tasks, upcoming deadlines, and submission statuses directly to the enrolled student.</li>
            <li>Enabling authorized tutors to review submissions, assign marks, and provide pedagogical feedback.</li>
            <li>Rendering academic progress analytics and monthly report cards for parents and learners.</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(71, 175, 229, 0.08)', border: '1px solid rgba(71, 175, 229, 0.3)', borderRadius: '12px', padding: '20px' }}>
          <h3 className="h3" style={{ color: 'var(--color-brand-blue, #47afe5)', marginBottom: '10px', fontSize: '17px' }}>
            4. Google API Services User Data Policy &amp; Limited Use Disclosure
          </h3>
          <p style={{ fontWeight: 500, color: 'var(--white-1, #fff)' }}>
            Jivanaut Test Prep&rsquo;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-brand-blue, #47afe5)', textDecoration: 'underline' }}
            >
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
            <li>We do <strong>not</strong> transfer Google user data to third parties, unless necessary to provide or improve these educational features, comply with applicable law, or as part of a merger/acquisition.</li>
            <li>We do <strong>not</strong> use or transfer Google user data for serving advertisements, including personalized, re-targeted, or interest-based advertising.</li>
            <li>We do <strong>not</strong> allow humans to read user data unless we have obtained the user&rsquo;s affirmative agreement for specific messages, doing so is necessary for security purposes (such as investigating a bug or abuse), to comply with applicable law, or the data is aggregated and anonymized for internal operations.</li>
            <li>We do <strong>not</strong> use Google user data to train or fine-tune artificial intelligence (AI) or machine learning (ML) models.</li>
          </ul>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            5. Data Storage, Security &amp; Retention
          </h3>
          <p>
            <strong>Zero Backend Architecture:</strong> Jivanaut Test Prep operates as a client-side web application. Google OAuth access tokens are stored ephemerally in browser session storage (<code>sessionStorage</code>) and exist solely in the user&rsquo;s browser memory during the active session.
          </p>
          <p style={{ marginTop: '8px' }}>
            We do <strong>not</strong> transmit, copy, or maintain copies of your Google passwords, account tokens, or classroom materials on remote databases or third-party servers. When you close your browser or click &ldquo;Sign Out,&rdquo; all active tokens are immediately purged.
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            6. User Control &amp; Data Revocation
          </h3>
          <p>
            You have full control over your Google Classroom authorization:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Sign Out in App:</strong> Click the &ldquo;Sign Out&rdquo; or &ldquo;Disconnect&rdquo; button in the Classroom Portal at any time to clear local session tokens and revoke browser access.</li>
            <li><strong>Google Account Permissions:</strong> You can permanently revoke access at any time directly through your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-brand-blue, #47afe5)' }}
              >
                Google Account Security Settings
              </a>.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            7. Student Privacy (FERPA &amp; COPPA Principles)
          </h3>
          <p>
            We strictly protect the educational records of students. Student coursework and progress records are only accessible to the individual student enrolled in that course and authorized Jivanaut Test Prep educators. Student information is never sold, publicly published, or used for commercial marketing.
          </p>
        </div>

        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            8. Contact Us
          </h3>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us directly:
          </p>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Organization:</strong> Jivanaut Test Prep</div>
            <div><strong>Developer &amp; Privacy Officer:</strong> Subarshan</div>
            <div><strong>Support Email:</strong> <a href="mailto:subarshan195@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>subarshan195@gmail.com</a></div>
            <div><strong>General Inquiries:</strong> <a href="mailto:jivanauttestprep@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>jivanauttestprep@gmail.com</a></div>
            <div><strong>Website:</strong> <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>https://www.jivanauttestprep.com</a></div>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--jet, rgba(255,255,255,0.08))', textAlign: 'center', color: 'var(--light-gray-70, #888)', fontSize: '12px' }}>
        <p>&copy; 2026 Jivanaut Test Prep. All rights reserved. | <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link></p>
      </footer>
    </article>
  )
}
