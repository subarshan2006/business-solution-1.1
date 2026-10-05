import { useState, useCallback, useRef, useEffect } from 'react'

const feedbacks = [
  {
    text: "For over 2 years, Mrs. Steena has fueled my daughter's passion for science by sharing fascinating medical insights and personal experiences. She is a deeply supportive mentor who makes mastering AP Biology feel effortless.",
    author: "— Archana, Texas"
  },
  {
    text: "Based on my kid's AP score of 5, I highly recommend Steena for AP Biology tutoring. Personalized 1:1 tutoring with no upfront fee commitment, and she offers a trial class. Excellent test prep coaching and materials.",
    author: "— Sudha, Cupertino, California"
  },
  {
    text: "Without Ms. Steena's guidance and support, I would not have truly appreciated taking AP Biology as much as I did. She explained the content at a pace that fit my learning and provided examples that gave me a better understanding. She was incredibly patient when it came to practicing and reviewing for in-class quizzes and exams. Each session left me feeling more confident in my abilities, deepening my love for AP Bio and strengthening my interest in pursuing a career in medicine. I will forever be grateful for the love and dedication shown by Ms. Steena during my AP Biology journey and beyond.",
    author: "— Christina, San Mateo, California"
  },
  {
    text: "Ms. Steena is a thoughtful, highly experienced educator. She is able to efficiently cover the curriculum and dedicates class time to practice questions in order to reinforce information and identify misunderstandings or gaps in knowledge. I took AP Biology outside of school, and without Ms. Steena as my teacher, I would not have achieved a score of 5. Difficult concepts are explained well and she is quick to catch areas you may be struggling in. 100% recommend!",
    author: "— Rhythm Ramkumar, Cupertino, California"
  }
]

const TYPEWRITER_TEXT = "JIVANAUT TEST PREP"
const TYPING_SPEED = 100
const DELETING_SPEED = 60
const PAUSE_AFTER_TYPING = 2000
const PAUSE_AFTER_DELETING = 800

const ENROLL_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSc615afQFRpiaWyfpmTKWOBSGzOYmZDcg95rZZ9u3HKvBbT8g/viewform?usp=publish-editor'

const SectionDivider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />
)

function Home({ activePage }) {
  const [expanded, setExpanded] = useState({})
  const [overflow, setOverflow] = useState({})
  const marqueeRef = useRef(null)
  const textRefs = useRef([])
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Typewriter effect
  useEffect(() => {
    let timeout
    if (isTyping) {
      if (displayedText.length < TYPEWRITER_TEXT.length) {
        timeout = setTimeout(() => {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, displayedText.length + 1))
        }, TYPING_SPEED)
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false)
        }, PAUSE_AFTER_TYPING)
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, displayedText.length - 1))
        }, DELETING_SPEED)
      } else {
        timeout = setTimeout(() => {
          setIsTyping(true)
        }, PAUSE_AFTER_DELETING)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayedText, isTyping])

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

  const renderLetters = (text, startIndex = 0) => {
    return text.split('').map((char, i) => (
      <span key={startIndex + i} className="typewriter-letter">
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  return (
    <article className={`home${activePage === 'home' ? ' active' : ''}`} data-page="home">

      <header>
        <h2 className="h2 article-title">Home</h2>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="brand-title typewriter-text">
          {displayedText.length <= 8
            ? <>{renderLetters(displayedText)}<span className="typewriter-cursor">|</span></>
            : <>{renderLetters(displayedText.slice(0, 8))}<br className="mobile-break" />{renderLetters(displayedText.slice(8), 8)}<span className="typewriter-cursor">|</span></>
          }
        </h1>

        <div className="hero-badge">
          <ion-icon name="school-outline"></ion-icon>
          <span>Global 1:1 Online Mentorship | US Curricula (EST · CST · PST) &amp; Global</span>
        </div>

        <div className="curriculum-flags">
          <div className="curriculum-flag" title="US Time Zones">
            <span className="flag-emoji">🇺🇸</span>
          </div>
          <div className="curriculum-flag" title="AP Biology">
            <span className="flag-emoji">🧬</span>
          </div>
          <div className="curriculum-flag" title="AP Environmental Science">
            <span className="flag-emoji">🌍</span>
          </div>
          <div className="curriculum-flag" title="AP Psychology">
            <span className="flag-emoji">🧠</span>
          </div>
          <div className="curriculum-flag" title="USABO">
            <span className="flag-emoji">🥇</span>
          </div>
        </div>

        <h3 className="hero-title">
          Empowering the Next Generation of<br />
          <span className="hero-highlight">Life Science Explorers.</span>
        </h3>

        <p className="hero-text">
          Master complex biological mechanisms, environmental systems, and advanced scientific
          inquiry through tailored, one-on-one digital mentoring. Guided by an educator with a
          MSc Zoology, MSc Environmental Science, B.Ed. and Diploma in Psychology &amp; Counseling, with 11+ years of proven academic outcomes.
        </p>

        <div className="hero-cta-wrapper">
          <a
            className="hero-cta-btn primary"
            href={ENROLL_FORM}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Schedule 1:1 Consultation</span>
          </a>
          <button
            className="hero-cta-btn secondary"
            onClick={() => {
              document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ion-icon name="arrow-down-outline"></ion-icon>
            <span>Explore Academic Courses</span>
          </button>
        </div>
      </section>

      <SectionDivider />

      {/* Methodology Section */}
      <section id="methodology">
        <header>
          <h3 className="h3">The Jivanaut Methodology</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Jiva (Life) + Naut (Explorer)</p>
        </header>
        <p className="about-text" style={{ marginTop: '15px' }}>
          Science is never about rote memorization — it is about systematic inquiry. At Jivanaut
          Test Prep, we demystify multi-layered scientific pathways, train students to decode
          rigorous College Board Free Response Questions (FRQs), and build lasting conceptual
          autonomy for high school and university tracks.
        </p>

        <ul className="stats-list" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <li className="stat-card">
            <h4 className="stat-number">11+</h4>
            <p className="stat-text">Years Experience</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.4rem' }}>MSc Zoology</h4>
            <p className="stat-text">&amp; MSc Environmental Science, B.Ed.</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.8rem' }}>1-on-1</h4>
            <p className="stat-text">Personalized Focus</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.3rem' }}>Global</h4>
            <p className="stat-text">US (EST–PST) &amp; World</p>
          </li>
        </ul>
      </section>

      <SectionDivider />

      {/* Courses Section */}
      <section id="courses">
        <header>
          <h3 className="h3">Courses &amp; Programs</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Structured curricula &amp; instructional offerings</p>
        </header>

        <ul className="services-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '25px' }}>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Biology <span style={{ color: 'var(--orange-yellow-crayola)', fontSize: 'var(--fs-8)' }}>Signature Program</span></h4>
              <p className="service-item-text">Full College Board Units 1–8: biochemistry, energetics, heredity, gene regulation, and ecology — with stimulus-based MCQs, experimental design, chi-square analysis, and dedicated FRQ rubric drills.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Environmental Science</h4>
              <p className="service-item-text">Earth systems, population biology, renewable and non-renewable resource management, pollution, and global climatic trends — integrating interdisciplinary science with quantitative calculation and policy critique.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">AP Psychology</h4>
              <p className="service-item-text">Biological bases of behavior, cognition, developmental milestones, clinical psychology, and social interactions — with emphasis on research methodology and ethical testing principles.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Honors Biology &amp; General Science</h4>
              <p className="service-item-text">Middle and early high school life sciences and physical sciences — building rigorous scientific vocabulary and deductive reasoning ahead of the AP pathway.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">USA Biology Olympiad (USABO)</h4>
              <p className="service-item-text">Competitive enrichment for ambitious students — advanced biological systems and Campbell Biology topics, building the data interpretation and problem solving Olympiad demands.</p>
            </div>
          </li>
        </ul>
      </section>

      <SectionDivider />

      {/* Why 1-on-1 Section */}
      <section>
        <header>
          <h3 className="h3">Why 1-on-1 Virtual Tutoring Works</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>A private laboratory for discovery</p>
        </header>

        <ul className="services-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '25px' }}>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Individualized Pace</h4>
              <p className="service-item-text">Topics are never rushed to match a class bell. We linger on tricky units like Cellular Energetics or Gene Regulation until total mastery is achieved.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Active Digital Whiteboarding</h4>
              <p className="service-item-text">Live annotation of cellular diagrams, experimental variables, and biochemical pathways ensures dynamic, visual engagement every single session.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Transparent Reporting</h4>
              <p className="service-item-text">Regular post-session briefings, milestone checks, and honest progress updates shared directly with parents — no surprises, ever.</p>
            </div>
          </li>
        </ul>
      </section>

      <SectionDivider />

      {/* Proven Results Section */}
      <section>
        <header>
          <h3 className="h3">Demonstrated Academic Outcomes</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Our students do not just survive AP science — they excel.</p>
        </header>

        <ul className="stats-list" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.6rem' }}>Scores of 4 &amp; 5</h4>
            <p className="stat-text">AP Biology Outcomes</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number">+1 to 2</h4>
            <p className="stat-text">Grades — School GPA Improvement</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.6rem' }}>100% Custom</h4>
            <p className="stat-text">Targeted FRQ Prep</p>
          </li>
        </ul>

        <p className="about-text" style={{ marginTop: '25px' }}>
          Through disciplined review of past College Board papers and deliberate practice with
          multi-step analytical prompts, students gain the confidence needed to walk into exam day
          fully prepared.
        </p>
      </section>

      <SectionDivider />

      {/* Auto Moving Feedbacks */}
      <section style={{ overflow: 'hidden' }}>
        <header>
          <h3 className="h3">What Parents &amp; Students Say</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Real feedback</p>
        </header>

        <div className="marquee-wrapper" style={{ display: 'flex', overflow: 'hidden', marginTop: '25px', paddingBottom: '10px' }}>
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
      </section>

      <SectionDivider />

      {/* Get In Touch */}
      <section className="contact-section" style={{ background: 'var(--border-gradient-onyx)', padding: '30px', borderRadius: '14px', position: 'relative', zIndex: 1 }}>
        <div style={{ content: '""', position: 'absolute', inset: '1px', background: 'var(--bg-gradient-jet)', borderRadius: 'inherit', zIndex: -1 }}></div>
        <header>
          <h3 className="h3">Get in Touch</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Let's take the next step in life sciences.</p>
        </header>
        <p className="about-text" style={{ marginTop: '15px' }}>
          Reach out to schedule a diagnostic consultation, ask about pricing, or check current
          availability for your time zone.
        </p>
        <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
          <a href="mailto:jivanautprep@gmail.com" className="hero-cta-btn primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="mail-outline"></ion-icon>
            <span>Email Me</span>
          </a>
          <a href="https://wa.me/919995800949" className="hero-cta-btn secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="logo-whatsapp"></ion-icon>
            <span>WhatsApp Me</span>
          </a>
        </div>

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
      </section>

      <footer style={{ marginTop: '60px', textAlign: 'center', color: 'var(--light-gray)', fontSize: 'var(--fs-8)', paddingBottom: '30px' }}>
        © 2026 Jivanaut Test Prep — Explorer of Life Science. All rights reserved.
      </footer>

    </article>
  )
}

export default Home