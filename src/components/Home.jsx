import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CourseModal from './CourseModal'

const feedbacks = [
  {
    text: "For over 2 years, Mrs. Steena has fueled my daughter's passion for science by sharing fascinating medical insights and personal experiences. She is a deeply supportive mentor who makes mastering AP Biology feel effortless.",
    author: "— Archana, Parent, Texas"
  },
  {
    text: "Based on my kid's AP score of 5, I highly recommend Steena for AP Biology tutoring. Personalized 1:1 tutoring with no upfront fee commitment, and she offers a trial class. Excellent test prep coaching and materials.",
    author: "— Sudha, Parent, Cupertino, California"
  },
  {
    text: "Without Ms. Steena's guidance and support, I would not have truly appreciated taking AP Biology as much as I did. She explained the content at a pace that fit my learning and provided examples that gave me a better understanding. She was incredibly patient when it came to practicing and reviewing for in-class quizzes and exams. Each session left me feeling more confident in my abilities, deepening my love for AP Bio and strengthening my interest in pursuing a career in medicine. I will forever be grateful for the love and dedication shown by Ms. Steena during my AP Biology journey and beyond.",
    author: "— Christina, Student, San Mateo, California"
  },
  {
    text: "Ms. Steena is a thoughtful, highly experienced educator. She is able to efficiently cover the curriculum and dedicates class time to practice questions in order to reinforce information and identify misunderstandings or gaps in knowledge. I took AP Biology outside of school, and without Ms. Steena as my teacher, I would not have achieved a score of 5. Difficult concepts are explained well and she is quick to catch areas you may be struggling in. 100% recommend!",
    author: "— Rhythm Ramkumar, Student, Cupertino, California"
  }
]

const FAQ_ITEMS = [
  {
    q: "What format are the 1-on-1 tutoring sessions conducted in?",
    a: "Sessions are conducted live via high-definition video (Google Meet or Zoom) with interactive digital whiteboarding. We diagram cellular pathways, annotate College Board FRQ prompt texts, and run live calculations in real time. Students receive complete annotated PDF session notes immediately after class."
  },
  {
    q: "What time zones and hours do you support?",
    a: "We work directly with US middle and high school students across all four continental time zones: Eastern (ET), Central (CT), Mountain (MT), and Pacific (PT). Sessions are scheduled during weekday afternoons/evenings and throughout weekend mornings and afternoons."
  },
  {
    q: "What learning materials, textbooks, and past papers are provided?",
    a: "Curricula are anchored on Campbell Biology (11th/12th ed.), official College Board released free-response questions from 1999–2025, curated stimulus-based MCQ banks, custom diagnostic problem sets, and unit-by-unit review sheets. All materials are provided at no extra charge."
  },
  {
    q: "How does homework evaluation and assignment submission work?",
    a: "Students submit homework through our integrated Google Classroom portal. Each FRQ submission is scored against official College Board rubrics with line-by-line feedback, error analysis, and actionable revision notes before our next class."
  },
  {
    q: "What is your rescheduling and cancellation policy?",
    a: "We understand that student schedules are demanding with extracurriculars and sports. Sessions can be rescheduled with at least 24 hours advance notice at zero penalty. Emergency makeup sessions are coordinated based on mutual calendar availability."
  },
  {
    q: "How do parents stay informed on academic progress?",
    a: "Parents receive regular milestone briefings detailing syllabus coverage, test readiness scores, and assignment completion rates. In addition, parents can access our online portal anytime to view coursework completion and teacher notes."
  }
]

const ANIMATED_SUBTITLE = "taught one-on-one."
const TYPING_SPEED = 32
const INITIAL_DELAY = 200

const ENROLL_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSc615afQFRpiaWyfpmTKWOBSGzOYmZDcg95rZZ9u3HKvBbT8g/viewform'

function Home({ activePage }) {
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const [expanded, setExpanded] = useState({})
  const [overflow, setOverflow] = useState({})
  const marqueeRef = useRef(null)
  const textRefs = useRef([])

  // Typewriter effect: once per session, de-looped, zero CLS, hides cursor on completion
  const [typedText, setTypedText] = useState(() => {
    if (typeof window !== 'undefined') {
      const alreadyTyped = sessionStorage.getItem('jivanaut_hero_typed')
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (alreadyTyped || prefersReduced) {
        return ANIMATED_SUBTITLE
      }
    }
    return ''
  })
  const [typingComplete, setTypingComplete] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem('jivanaut_hero_typed') || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
    return false
  })

  useEffect(() => {
    if (typingComplete) return

    let currentIndex = 0
    let intervalId

    const timer = setTimeout(() => {
      intervalId = setInterval(() => {
        currentIndex += 1
        setTypedText(ANIMATED_SUBTITLE.slice(0, currentIndex))
        if (currentIndex >= ANIMATED_SUBTITLE.length) {
          clearInterval(intervalId)
          setTypingComplete(true)
          try {
            sessionStorage.setItem('jivanaut_hero_typed', 'true')
          } catch {}
        }
      }, TYPING_SPEED)
    }, INITIAL_DELAY)

    return () => {
      clearTimeout(timer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [typingComplete])

  useEffect(() => {
    textRefs.current.forEach((el, i) => {
      if (el) {
        setOverflow(prev => ({ ...prev, [i]: el.scrollHeight > el.clientHeight }))
      }
    })
  }, [])

  const toggleExpand = useCallback((index) => {
    setExpanded(prev => {
      const next = { ...prev }
      if (next[index]) {
        delete next[index]
      } else {
        next[index] = true
      }
      const anyExpanded = Object.keys(next).length > 0
      if (marqueeRef.current) {
        marqueeRef.current.style.animationPlayState = anyExpanded ? 'paused' : 'running'
      }
      return next
    })
  }, [])

  const toggleFaq = (index) => {
    setOpenFaqIndex(prev => (prev === index ? null : index))
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <article className={`home${activePage === 'home' ? ' active' : ''}`} data-page="home">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: HERO (Above the Fold)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="hero-section hero-scrim home-section">
        <div className="hero-split">
          <div className="hero-content-col">
            {/* Mono Eyebrow */}
            <div className="hero-eyebrow" aria-label="Schedule and coverage">
              <ion-icon name="school-outline"></ion-icon>
              <span>1:1 ONLINE TUTORING · ET · CT · MT · PT</span>
            </div>

            {/* H1 Value Proposition */}
            <h1 className="hero-h1" aria-label="AP LifeScience, taught one-on-one.">
              <span className="hero-h1-static">AP LifeScience,</span>{' '}
              <span className="hero-h1-highlight">
                {typedText}
                {!typingComplete && <span className="typewriter-cursor">|</span>}
              </span>
            </h1>

            {/* Subject Chips */}
            <div className="hero-course-chips" aria-label="Target Subjects">
              <button type="button" onClick={() => setSelectedCourseId('ap-biology')} className="hero-course-chip">
                <ion-icon name="leaf-outline"></ion-icon>
                <span>AP Biology</span>
              </button>
              <button type="button" onClick={() => setSelectedCourseId('apes')} className="hero-course-chip">
                <ion-icon name="earth-outline"></ion-icon>
                <span>APES</span>
              </button>
              <button type="button" onClick={() => setSelectedCourseId('ap-psychology')} className="hero-course-chip">
                <ion-icon name="bulb-outline"></ion-icon>
                <span>AP Psychology</span>
              </button>
              <button type="button" onClick={() => setSelectedCourseId('usabo')} className="hero-course-chip">
                <ion-icon name="trophy-outline"></ion-icon>
                <span>USABO</span>
              </button>
            </div>

            {/* Subline */}
            <p className="hero-subline">
              Diagnostic-first coaching built around your target exam date and score gaps. Master cellular energetics, molecular genetics, and experimental design FRQs with confidence.
            </p>

            {/* Dual CTAs above the fold */}
            <div className="hero-cta-wrapper">
              <a
                className="hero-cta-btn primary"
                href={ENROLL_FORM}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Book a free 20-min consult</span>
              </a>
              <button
                className="hero-cta-btn secondary"
                onClick={() => scrollTo('courses')}
              >
                <ion-icon name="book-outline"></ion-icon>
                <span>See courses</span>
              </button>
            </div>

            {/* Hero Proof Strip */}
            <div className="hero-proof-strip" aria-label="Key qualifications">
              <span className="proof-item"><strong>11+</strong> yrs teaching</span>
              <span className="proof-dot">·</span>
              <span className="proof-item"><strong>Scores of 4 &amp; 5</strong></span>
              <span className="proof-dot">·</span>
              <span className="proof-item"><strong>100% custom</strong> FRQ prep</span>
              <span className="proof-dot">·</span>
              <span className="proof-item"><strong>ET · CT · MT · PT</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: COURSES & PROGRAM CARDS (with Modal Triggers)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="courses" className="home-section">
        <header className="home-section-header">
          <span className="section-eyebrow">
            <ion-icon name="albums-outline"></ion-icon>
            Structured Curricula
          </span>
          <h2 className="section-title">Courses &amp; Targeted Programs</h2>
          <p className="section-subtitle">
            Every course combines conceptual inquiry, experimental design, and rubric-calibrated College Board FRQ drills.
          </p>
        </header>

        <div className="course-card-grid">
          
          {/* AP Biology */}
          <div className="course-feature-card">
            <div>
              <div className="course-card-badge-row">
                <span className="course-unit-pill">Units 1–8 · Signature</span>
                <span style={{ fontSize: '11px', color: 'var(--amber, #F5B83D)', fontWeight: 700 }}>Most Popular</span>
              </div>
              <h3 className="course-card-title">AP Biology</h3>
              <p className="course-card-target">For 9th–12th graders targeting a 4 or 5</p>
              <p className="course-card-desc">
                Complete mastery of chemistry of life, cellular energetics, gene regulation, and heredity. Weekly line-by-line FRQ rubric evaluations and experimental design questions.
              </p>
            </div>
            <button
              type="button"
              className="course-card-btn"
              onClick={() => setSelectedCourseId('ap-biology')}
            >
              <span>View full syllabus &amp; outcomes</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>

          {/* APES */}
          <div className="course-feature-card">
            <div>
              <div className="course-card-badge-row">
                <span className="course-unit-pill">Units 1–9 · Full Prep</span>
              </div>
              <h3 className="course-card-title">AP Environmental Science</h3>
              <p className="course-card-target">For students targeting top scores in APES</p>
              <p className="course-card-desc">
                Interdisciplinary science combining ecology, atmospheric pollution, water resources, and energy calculations. Dedicated drills on dimensional analysis and environmental legislation.
              </p>
            </div>
            <button
              type="button"
              className="course-card-btn"
              onClick={() => setSelectedCourseId('apes')}
            >
              <span>View full syllabus &amp; outcomes</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>

          {/* AP Psychology */}
          <div className="course-feature-card">
            <div>
              <div className="course-card-badge-row">
                <span className="course-unit-pill">High-Yield Core</span>
              </div>
              <h3 className="course-card-title">AP Psychology</h3>
              <p className="course-card-target">For students seeking 5s through mechanism-first learning</p>
              <p className="course-card-desc">
                Transform memorization into structural clarity. Biological bases of behavior, cognition, developmental stages, and empirical research design FRQ mastery.
              </p>
            </div>
            <button
              type="button"
              className="course-card-btn"
              onClick={() => setSelectedCourseId('ap-psychology')}
            >
              <span>View full syllabus &amp; outcomes</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>

          {/* USABO */}
          <div className="course-feature-card">
            <div>
              <div className="course-card-badge-row">
                <span className="course-unit-pill">Campbell Deep-Dive · Olympiad</span>
              </div>
              <h3 className="course-card-title">USA Biology Olympiad (USABO)</h3>
              <p className="course-card-target">For competitive students targeting Semifinalist qualification</p>
              <p className="course-card-desc">
                University-level biological systems, advanced plant and animal physiology, pedigree probability, and timed competitive round problem-solving from Campbell Biology.
              </p>
            </div>
            <button
              type="button"
              className="course-card-btn"
              onClick={() => setSelectedCourseId('usabo')}
            >
              <span>View full syllabus &amp; outcomes</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: HOW IT WORKS (3-Step Roadmap)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="home-section">
        <header className="home-section-header">
          <span className="section-eyebrow">
            <ion-icon name="git-branch-outline"></ion-icon>
            The Jivanaut Method
          </span>
          <h2 className="section-title">How It Works: 3 Steps to a 5</h2>
          <p className="section-subtitle">
            A structured, diagnostic-first framework designed around how the College Board actually tests life science.
          </p>
        </header>

        <div className="how-it-works-grid">
          
          <div className="how-step-card">
            <span className="step-num-watermark">01</span>
            <div className="step-icon-wrap">
              <ion-icon name="analytics-outline"></ion-icon>
            </div>
            <h3 className="step-title">Diagnostic Evaluation &amp; Gap Mapping</h3>
            <p className="step-desc">
              We assess your current knowledge across all units, identify high-frequency trap areas, and evaluate baseline FRQ writing habits to map an exact weekly study plan.
            </p>
          </div>

          <div className="how-step-card">
            <span className="step-num-watermark">02</span>
            <div className="step-icon-wrap">
              <ion-icon name="easel-outline"></ion-icon>
            </div>
            <h3 className="step-title">Tailored 1-on-1 Instruction &amp; Whiteboarding</h3>
            <p className="step-desc">
              Weekly private sessions pacing with your school syllabus. We annotate complex mechanisms live on digital whiteboards, turning abstract diagrams into intuitive mental models.
            </p>
          </div>

          <div className="how-step-card">
            <span className="step-num-watermark">03</span>
            <div className="step-icon-wrap">
              <ion-icon name="checkbox-outline"></ion-icon>
            </div>
            <h3 className="step-title">Rubric-Aligned FRQ Writing Lab &amp; Drills</h3>
            <p className="step-desc">
              Students practice authentic College Board free response prompts with line-by-line grading. You learn exactly what words AP readers award points for — and what loses points.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: TUTOR BIO & PHILOSOPHY (Steena Antony)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="about-tutor" className="home-section">
        <header className="home-section-header">
          <span className="section-eyebrow">
            <ion-icon name="person-outline"></ion-icon>
            Educator &amp; Mentor
          </span>
          <h2 className="section-title">Meet Your Tutor: Steena Antony</h2>
        </header>

        <div className="tutor-bio-card">
          <div className="tutor-bio-header">
            <div className="tutor-bio-identity">
              <h3 className="tutor-bio-name">Steena Antony</h3>
              <span className="tutor-bio-badge">
                <ion-icon name="ribbon-outline"></ion-icon>
                <span>11+ Years Teaching Life Science</span>
              </span>
            </div>

            <div className="tutor-credentials-chips">
              <span className="tutor-credential-chip">M.Sc. Zoology</span>
              <span className="tutor-credential-chip">M.Sc. Environmental Science</span>
              <span className="tutor-credential-chip">Bachelor of Education (B.Ed.)</span>
              <span className="tutor-credential-chip">Diploma in Psychology &amp; Counseling</span>
            </div>
          </div>

          <div className="tutor-bio-body">
            <p className="tutor-bio-lead">
              With over 11 years of experience teaching high school life science and preparing competitive test-takers across the United States, I focus on the cognitive bridge between classroom theory and AP exam performance.
            </p>

            <p className="tutor-bio-secondary">
              Having earned dual Master’s degrees in Zoology and Environmental Science alongside a Bachelor of Education, my pedagogy integrates scientific rigor with compassionate, student-centered pacing. We replace the stress of passive memorization with the clarity of biological inquiry.
            </p>

            <div className="tutor-quote-box">
              &ldquo;Biology is not a catalog of facts to memorize before test day. It is an interconnected web of living systems. When a student grasps the underlying mechanism, the correct answer on an FRQ is simply the logical conclusion.&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 5: RESULTS & VERIFIED TESTIMONIALS
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="results" className="home-section">
        <header className="home-section-header">
          <span className="section-eyebrow">
            <ion-icon name="trophy-outline"></ion-icon>
            Demonstrated Outcomes
          </span>
          <h2 className="section-title">Verified Results &amp; Student Success</h2>
          <p className="section-subtitle">
            Our students consistently outperform national AP score distributions and gain acceptance into top biomedical university tracks.
          </p>
        </header>

        {/* Outcomes Metric Strip */}
        <div className="outcomes-stats-strip">
          <div className="outcome-stat-box">
            <div className="outcome-stat-number">88%</div>
            <div className="outcome-stat-label">Scored 4 or 5 on AP Biology</div>
          </div>
          <div className="outcome-stat-box">
            <div className="outcome-stat-number">11+</div>
            <div className="outcome-stat-label">Years Dedicated Life Science Teaching</div>
          </div>
          <div className="outcome-stat-box">
            <div className="outcome-stat-number">4</div>
            <div className="outcome-stat-label">US Time Zones (ET · CT · MT · PT)</div>
          </div>
          <div className="outcome-stat-box">
            <div className="outcome-stat-number">100%</div>
            <div className="outcome-stat-label">Personalized 1-on-1 Instruction</div>
          </div>
        </div>

        {/* Testimonials Marquee */}
        <div style={{ overflow: 'hidden', marginTop: '32px' }}>
          <div className="marquee-wrapper" style={{ display: 'flex', overflow: 'hidden', paddingBottom: '12px' }}>
            <div className="marquee-content" ref={marqueeRef} style={{ display: 'flex', gap: '20px', animation: 'marquee 40s linear infinite', width: 'max-content' }}>
              {[...feedbacks, ...feedbacks].map((fb, i) => (
                <div key={i} className={`feedback-card${expanded[i] ? ' expanded' : ''}`}>
                  <div className="feedback-text-wrapper" ref={el => textRefs.current[i] = el}>
                    <p>"{fb.text}"</p>
                    {!expanded[i] && overflow[i] && <div className="feedback-fade" />}
                  </div>
                  <div className="feedback-footer">
                    <h5>{fb.author}</h5>
                    {overflow[i] && (
                      <button className="feedback-toggle" onClick={() => toggleExpand(i)}>
                        <ion-icon name={expanded[i] ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
                        <span>{expanded[i] ? 'Close' : 'View all'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 7: FREQUENTLY ASKED QUESTIONS (Accordion)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="home-section">
        <header className="home-section-header">
          <span className="section-eyebrow">
            <ion-icon name="help-circle-outline"></ion-icon>
            Common Inquiries
          </span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about scheduling, technology, and learning materials.
          </p>
        </header>

        <div className="faq-accordion-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className={`faq-accordion-item${openFaqIndex === idx ? ' open' : ''}`}
            >
              <button
                type="button"
                className="faq-question-btn"
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaqIndex === idx}
              >
                <span>{item.q}</span>
                <ion-icon name="chevron-down-outline" className="faq-chevron"></ion-icon>
              </button>
              {openFaqIndex === idx && (
                <div className="faq-answer-body">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 8: FINAL CTA BAND & TRUST FOOTER
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="final-cta-banner">
          <span className="section-eyebrow" style={{ justifyContent: 'center', marginBottom: '10px' }}>
            <ion-icon name="sparkles-outline"></ion-icon>
            Targeted 1-on-1 Coaching
          </span>
          <h2 className="final-cta-h2">Ready to Master AP Biology with Confidence?</h2>
          <p className="final-cta-subtitle">
            Book a free 20-minute diagnostic call with Steena Antony to review your syllabus, pinpoint your score gaps, and build your personalized roadmap to a 5.
          </p>
          <div className="final-cta-btn-row">
            <a
              href={ENROLL_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-btn primary"
              style={{ textDecoration: 'none' }}
            >
              <ion-icon name="calendar-outline"></ion-icon>
              <span>Book a free 20-min consult</span>
            </a>
            <a
              href="https://wa.me/919995800949"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-btn secondary"
              style={{ textDecoration: 'none' }}
            >
              <ion-icon name="logo-whatsapp"></ion-icon>
              <span>Message on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Trust & Legal Footer */}
      <footer className="site-footer-trust">
        <div className="footer-nav-links">
          <button type="button" onClick={() => scrollTo('courses')} className="footer-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Courses</button>
          <span>&bull;</span>
          <button type="button" onClick={() => scrollTo('how-it-works')} className="footer-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>How it Works</button>
          <span>&bull;</span>
          <button type="button" onClick={() => scrollTo('results')} className="footer-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Results</button>
          <span>&bull;</span>
          <button type="button" onClick={() => scrollTo('faq')} className="footer-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>FAQ</button>
          <span>&bull;</span>
          <Link to="/classroom" className="footer-nav-link">Student Login</Link>
          <span>&bull;</span>
          <Link to="/privacy" className="footer-nav-link">Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms" className="footer-nav-link">Terms of Service</Link>
        </div>

        <p className="footer-disclaimer">
          AP® is a registered trademark of the College Board, which is not affiliated with and does not endorse Jivanaut Test Prep. USA Biology Olympiad (USABO) is a program administered by the Center for Excellence in Education (CEE).
        </p>

        <div>
          &copy; 2026 Jivanaut Test Prep &mdash; Explore life science. All rights reserved. Primary contact: <a href="mailto:jivanautprep@gmail.com" style={{ color: 'var(--mint-hi, #90a955)', textDecoration: 'underline' }}>jivanautprep@gmail.com</a>
        </div>
      </footer>

      {/* Course Syllabus Modal */}
      {selectedCourseId && (
        <CourseModal
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

    </article>
  )
}

export default Home