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
    <article className="active" style={{ padding: '30px 24px', maxWidth: '980px', margin: '0 auto' }}>
      <header style={{ marginBottom: '28px', borderBottom: '1px solid var(--jet, rgba(255,255,255,0.1))', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-brand-blue, #47afe5)' }}>
              Legal &amp; Compliance Center
            </span>
            <h2 className="h2 article-title" style={{ margin: '4px 0 0 0' }}>Privacy Policy</h2>
          </div>
          <Link to="/" className="hero-cta-btn secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px' }}>
            <ion-icon name="arrow-back-outline"></ion-icon>
            <span>Back to Home</span>
          </Link>
        </div>
        <p style={{ color: 'var(--light-gray-70, #aaa)', fontSize: '13px', marginTop: '10px' }}>
          <strong>Last Updated &amp; Effective Date:</strong> October 15, 2026 &bull; <strong>Application:</strong> Jivanaut Test Prep &bull; <strong>Domain:</strong>{' '}
          <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>
            https://www.jivanauttestprep.com
          </a>
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: '1.75', color: 'var(--light-gray, #ccc)', fontSize: '14.5px' }}>
        
        {/* SECTION 1 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            1. Overview &amp; Organization Identity
          </h3>
          <p>
            Welcome to <strong>Jivanaut Test Prep</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), operating via our verified domain{' '}
            <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>
              https://www.jivanauttestprep.com
            </a>. We provide premium 1-on-1 and small group academic tutoring, enrichment mentoring, and test preparation for students in AP Biology, AP Environmental Science, AP Psychology, and the USA Biolympiad (USABO).
          </p>
          <p style={{ marginTop: '10px' }}>
            We take student privacy and data protection with the utmost seriousness. This Privacy Policy comprehensively discloses how we access, collect, process, protect, retain, and delete user data when students, parents, and authorized educators visit our website or authenticate through our Google Classroom integration portal.
          </p>
        </div>

        {/* SECTION 2 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            2. Google Classroom API &amp; Google User Data Accessed
          </h3>
          <p>
            Our web application integrates with the <strong>Google Classroom API</strong> via Google Identity Services (OAuth 2.0). When users choose to authenticate using Google, we request authorization to access specific educational information to deliver core portal functionality:
          </p>

          <div style={{ background: 'var(--border-gradient-onyx, rgba(255,255,255,0.03))', border: '1px solid var(--jet, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '18px', marginTop: '14px' }}>
            <h4 style={{ color: 'var(--white-1, #fff)', marginBottom: '10px', fontSize: '15px' }}>
              Categories of Google User Data We Access:
            </h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Basic Profile &amp; Authentication Identity:</strong> User Google account email address, verified display name, and avatar/photo URL. Used to authenticate sessions, verify identity, and differentiate student, parent, and educator interfaces.
              </li>
              <li>
                <strong>Google Classroom Courses (<code>.../auth/classroom.courses.readonly</code>):</strong> Course titles, IDs, section names, and course descriptions for classrooms in which the user is actively enrolled or authorized.
              </li>
              <li>
                <strong>Coursework &amp; Assignments (<code>.../auth/classroom.coursework.me</code> &amp; <code>.../auth/classroom.coursework.students</code>):</strong> Assignment titles, descriptions, due dates, maximum points, and instructional attachments assigned to the student.
              </li>
              <li>
                <strong>Student Submissions &amp; Academic Grades (<code>.../auth/classroom.student-submissions.me.readonly</code> &amp; <code>.../auth/classroom.student-submissions.students.readonly</code>):</strong> Homework submission states (Turned In, Assigned, Graded), submitted attachments, assigned scores, and qualitative educator remarks.
              </li>
              <li>
                <strong>Classroom Rosters &amp; Stream Announcements (<code>.../auth/classroom.rosters.readonly</code> &amp; <code>.../auth/classroom.announcements.readonly</code>):</strong> Teacher and student names enrolled in the specific classroom and public course stream announcements.
              </li>
            </ul>
          </div>
        </div>

        {/* SECTION 3 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            3. How We Use Google User Data (Purpose Limitation)
          </h3>
          <p>
            Information obtained through Google Classroom APIs is used <strong>strictly and exclusively</strong> to provide and improve the educational features requested by the user:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Personalized Homework Dashboard:</strong> Allowing enrolled students to view upcoming deadlines, inspect task instructions, and monitor assignment submission statuses.</li>
            <li><strong>Educator Feedback &amp; Marks Review:</strong> Allowing authorized tutors and students to inspect returned marks, score breakdowns, and qualitative pedagogical comments.</li>
            <li><strong>Executive Parent Analytics &amp; Monthly Report Cards:</strong> Enabling verified parents (authenticated via 4-digit PIN verification) to view their child&rsquo;s academic progress KPIs, subject mastery metrics, and printable monthly report card summaries.</li>
            <li><strong>Lesson Planning &amp; Announcements:</strong> Enabling educators to draft classroom announcements and schedule mentoring session reminders.</li>
          </ul>
          <p style={{ marginTop: '12px', fontWeight: 500, color: 'var(--white-1, #fff)' }}>
            We strictly prohibit secondary, non-educational uses of Google user data:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>We do <strong>not</strong> use Google user data for advertising, marketing, profiling, or monetization.</li>
            <li>We do <strong>not</strong> use Google user data to train, fine-tune, or develop artificial intelligence (AI) or machine learning (ML) models.</li>
            <li>We do <strong>not</strong> use Google user data for any purposes other than providing the core educational tutoring and progress tracking features of Jivanaut Test Prep.</li>
          </ul>
        </div>

        {/* SECTION 4 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            4. Third-Party Sharing, Transfer, and Disclosure Restrictions
          </h3>
          <p>
            Jivanaut Test Prep maintains strict data non-disclosure and transfer policies regarding Google user data:
          </p>
          <div style={{ background: 'var(--border-gradient-onyx, rgba(255,255,255,0.03))', border: '1px solid var(--jet, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>No Sale or Commercial Transfer:</strong> We do <strong>not</strong> sell, rent, lease, trade, or transfer Google user data or sensitive student information to any third parties, data brokers, or commercial entities under any circumstances.
              </li>
              <li>
                <strong>No Third-Party Advertising:</strong> We do <strong>not</strong> transfer or disclose Google user data to advertising networks, re-targeting providers, or market research organizations.
              </li>
              <li>
                <strong>No External Server Transfers:</strong> Google OAuth tokens and classroom data are processed entirely within the user&rsquo;s local client web browser and are never transmitted to third-party servers.
              </li>
              <li>
                <strong>Legal Compliance Narrow Exception:</strong> We will only disclose information if required to do so by applicable law, regulation, subpoena, or lawful court order, and only to the minimum extent necessary to comply.
              </li>
            </ul>
          </div>
        </div>

        {/* SECTION 5 - TARGETED REMEDIATION */}
        <div style={{ background: 'rgba(117, 209, 180, 0.08)', border: '1px solid rgba(117, 209, 180, 0.35)', borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ion-icon name="shield-checkmark" style={{ fontSize: '24px', color: '#75d1b4' }}></ion-icon>
            <h3 className="h3" style={{ color: '#75d1b4', margin: 0, fontSize: '19px' }}>
              5. Data Protection Mechanisms for Sensitive Data
            </h3>
          </div>
          <p style={{ marginTop: '8px' }}>
            Jivanaut Test Prep implements robust technical, administrative, and organizational safeguards to ensure the confidentiality, integrity, and security of sensitive student information and Google user data:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #75d1b4' }}>
              <h4 style={{ color: 'var(--white-1, #fff)', fontSize: '15px', marginBottom: '4px' }}>
                A. Encryption in Transit (HTTPS / TLS 1.2 &amp; TLS 1.3)
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--light-gray, #ccc)' }}>
                All network communications between the user&rsquo;s browser, our web application, and Google API servers are strictly encrypted in transit using industry-standard <strong>Transport Layer Security (TLS 1.2 and TLS 1.3) protocols over HTTPS</strong>. We enforce HTTP Strict Transport Security (HSTS) across all endpoints on <code>https://www.jivanauttestprep.com</code>. Insecure HTTP connections are automatically rejected and redirected to secure HTTPS.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #75d1b4' }}>
              <h4 style={{ color: 'var(--white-1, #fff)', fontSize: '15px', marginBottom: '4px' }}>
                B. Zero-Backend Architecture &amp; In-Memory Ephemeral Storage
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--light-gray, #ccc)' }}>
                Jivanaut Test Prep operates on a <strong>zero-backend client architecture</strong>. We do not operate remote databases, intermediary proxy servers, or third-party storage infrastructure that stores Google user data. Google OAuth 2.0 access tokens and coursework records are held ephemerally within the user&rsquo;s browser memory (<code>sessionStorage</code> and RAM) solely during the active session. Sensitive Google data is never written to remote disks or external servers.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #75d1b4' }}>
              <h4 style={{ color: 'var(--white-1, #fff)', fontSize: '15px', marginBottom: '4px' }}>
                C. Strict Role-Based Access Control (RBAC) &amp; Least Privilege
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--light-gray, #ccc)' }}>
                Access to classroom records within the portal strictly enforces the principle of least privilege:
              </p>
              <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Students:</strong> Restricted strictly to courses, assignments, and submissions where their Google account is actively enrolled.</li>
                <li><strong>Parents:</strong> Gated via pre-OAuth 4-digit PIN challenge. Parents access read-only progress analytics and monthly report cards with zero access to student workspace submissions.</li>
                <li><strong>Educators:</strong> Limited exclusively to authorized 1-on-1 tutoring classrooms under their direct instruction.</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #75d1b4' }}>
              <h4 style={{ color: 'var(--white-1, #fff)', fontSize: '15px', marginBottom: '4px' }}>
                D. Secure Credential &amp; Token Lifecycle Management
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--light-gray, #ccc)' }}>
                Google OAuth tokens are short-lived (expiring automatically after 60 minutes). We do not request, receive, or store user Google passwords or offline refresh tokens. All active session credentials are immediately flushed from memory upon user sign-out, session disconnect, or browser window termination.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #75d1b4' }}>
              <h4 style={{ color: 'var(--white-1, #fff)', fontSize: '15px', marginBottom: '4px' }}>
                E. Administrative &amp; Organizational Controls
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--light-gray, #ccc)' }}>
                We maintain strict code review standards, dependency vulnerability scanning, automated static analysis (linting), Content Security Policy (CSP) headers, and origin domain isolation to safeguard our client-side application against cross-site scripting (XSS), credential interception, and unauthorized data leakage.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 6 - RETENTION & DELETION */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            6. Data Retention and Deletion Policy
          </h3>
          <p>
            Jivanaut Test Prep adheres to strict data minimization principles. We retain data only for the minimum duration necessary to fulfill the educational services requested:
          </p>

          <div style={{ background: 'var(--border-gradient-onyx, rgba(255,255,255,0.03))', border: '1px solid var(--jet, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
            <h4 style={{ color: 'var(--white-1, #fff)', marginBottom: '8px', fontSize: '15px' }}>
              Retention Timelines &amp; Criteria:
            </h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <li><strong>Remote Server Retention:</strong> <strong>0 days.</strong> We do not store, copy, or back up Google Classroom data, student submissions, or OAuth tokens on any remote databases or cloud servers.</li>
              <li><strong>Client-Side Session Retention:</strong> OAuth access tokens and cached classroom records exist in browser memory for the duration of the active session only (maximum 60 minutes before expiration).</li>
              <li><strong>Client UI Preferences:</strong> Local browser storage preferences (such as dark/light theme setting or educator custom report card remarks saved locally) remain in the user&rsquo;s browser sandbox until manually cleared by the user.</li>
            </ul>
          </div>

          <h4 style={{ color: 'var(--white-1, #fff)', marginTop: '16px', marginBottom: '8px', fontSize: '15px' }}>
            User Deletion &amp; Access Revocation Procedures:
          </h4>
          <p>
            Users retain complete, unilateral control over their data at all times through multiple immediate mechanisms:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Immediate In-App Disconnect:</strong> Clicking the &ldquo;Disconnect&rdquo; or &ldquo;Sign Out&rdquo; button in the Classroom Portal immediately flushes all Google OAuth tokens, profile details, and cached classroom records from <code>sessionStorage</code> and browser memory.
            </li>
            <li>
              <strong>Permanent Google Account Revocation:</strong> You can permanently revoke Jivanaut Test Prep&rsquo;s access to your Google account at any time with a single click via{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-brand-blue, #47afe5)', textDecoration: 'underline' }}
              >
                Google Account Security Permissions
              </a>. Once revoked, our portal cannot query or refresh your Google Classroom data.
            </li>
            <li>
              <strong>Data Deletion Request:</strong> If you wish to confirm complete deletion of any stored preferences or records, email our Data Protection team at{' '}
              <a href="mailto:subarshan195@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>
                subarshan195@gmail.com
              </a>{' '}
              with the subject line &ldquo;Data Deletion Request&rdquo;. We verify and confirm all requests within 24 to 48 hours without fee.
            </li>
          </ul>
        </div>

        {/* SECTION 7 - GOOGLE LIMITED USE */}
        <div style={{ background: 'rgba(71, 175, 229, 0.08)', border: '1px solid rgba(71, 175, 229, 0.35)', borderRadius: '14px', padding: '22px' }}>
          <h3 className="h3" style={{ color: 'var(--color-brand-blue, #47afe5)', marginBottom: '10px', fontSize: '18px' }}>
            7. Google API Services User Data Policy &amp; Limited Use Disclosure
          </h3>
          <p style={{ fontWeight: 600, color: 'var(--white-1, #fff)', fontSize: '15px' }}>
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
          <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
            <li>We do <strong>not</strong> transfer Google user data to third parties, unless necessary to provide or improve these educational features, comply with applicable law, or as part of a merger or acquisition.</li>
            <li>We do <strong>not</strong> use or transfer Google user data for serving advertisements, including personalized, re-targeted, or interest-based advertising.</li>
            <li>We do <strong>not</strong> allow humans to read user data unless we have obtained the user&rsquo;s affirmative agreement for specific messages, doing so is necessary for security purposes (such as investigating a bug or abuse), to comply with applicable law, or the data is aggregated and anonymized for internal operations.</li>
            <li>We do <strong>not</strong> use Google user data to train or fine-tune artificial intelligence (AI) or machine learning (ML) models.</li>
          </ul>
        </div>

        {/* SECTION 8 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            8. Student Privacy &amp; Educational Compliance (FERPA &amp; COPPA Principles)
          </h3>
          <p>
            We strictly safeguard the educational privacy of students in alignment with the Family Educational Rights and Privacy Act (FERPA) and Children&rsquo;s Online Privacy Protection Act (COPPA) standards:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Student educational records and assignments are accessible solely to the enrolled student and their designated Jivanaut Test Prep mentor.</li>
            <li>We do not create behavioral advertising profiles of students or track student activities across third-party websites.</li>
            <li>Parents and legal guardians maintain the right to inspect student academic progress analytics upon verified PIN authorization.</li>
          </ul>
        </div>

        {/* SECTION 9 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            9. Notification of Changes to this Policy
          </h3>
          <p>
            We may update this Privacy Policy from time to time to reflect technological improvements, legal requirements, or adjustments to our educational services. If we make material changes to how we access, use, or store Google user data, we will notify users through:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Updating the &ldquo;Last Updated &amp; Effective Date&rdquo; prominently displayed at the top of this Privacy Policy.</li>
            <li>Publishing an in-product notification banner within the Classroom Portal interface.</li>
            <li>Direct email notification to active tutoring families where applicable.</li>
          </ul>
        </div>

        {/* SECTION 10 */}
        <div>
          <h3 className="h3" style={{ color: 'var(--white-2, #fff)', marginBottom: '8px', fontSize: '18px' }}>
            10. Contact Information &amp; Data Protection Officer
          </h3>
          <p>
            If you have questions, inquiries, concerns, or requests regarding this Privacy Policy, our data protection mechanisms, or your Google Classroom integration, please contact our designated Data Protection Officer:
          </p>
          <div style={{ marginTop: '12px', background: 'var(--border-gradient-onyx, rgba(255,255,255,0.03))', border: '1px solid var(--jet, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
            <div><strong>Organization:</strong> Jivanaut Test Prep</div>
            <div><strong>Founder &amp; Data Protection Officer:</strong> Subarshan</div>
            <div><strong>Direct Security &amp; Compliance Email:</strong> <a href="mailto:subarshan195@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>subarshan195@gmail.com</a></div>
            <div><strong>General Support Inquiries:</strong> <a href="mailto:jivanauttestprep@gmail.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>jivanauttestprep@gmail.com</a></div>
            <div><strong>Official Verified Domain:</strong> <a href="https://www.jivanauttestprep.com" style={{ color: 'var(--color-brand-blue, #47afe5)' }}>https://www.jivanauttestprep.com</a></div>
          </div>
        </div>

      </section>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--jet, rgba(255,255,255,0.08))', textAlign: 'center', color: 'var(--light-gray-70, #888)', fontSize: '12px' }}>
        <p>&copy; 2026 Jivanaut Test Prep. All rights reserved. | <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link> | <Link to="/classroom" style={{ color: 'inherit', textDecoration: 'underline' }}>Classroom Portal</Link></p>
      </footer>
    </article>
  )
}
