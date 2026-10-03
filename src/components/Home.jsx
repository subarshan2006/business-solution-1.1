import { useState, useCallback, useRef, useEffect } from 'react'

const feedbacks = [
  {
    text: "Kavitha has been teaching my daughter for the past 2 years. She is one of the best teachers I have seen. She is highly knowledgeable in her subjects and teaches kids as per the students level of understanding with lots of patience and kindness. My daughter improves a lot in Maths and now it has become her favorite subject due to Kavitha mam's teaching and guidance. She is a punctual person who values time and keeps the students very attentive in her class. We highly recommend her if you need the best Math Tutor for kids.",
    author: "— Maha (Ontario)"
  },
  {
    text: "Mrs Kavitha has been teaching my 2 children for 3 years.We experienced great improvement in their Mathematics.Their scores improved significantly and they were able to be the top in their class ,especially Mathematics.Kavitha follows the same syllabus they have in their school.She is so helpful,patient,and always available when we needed help.Kavitha always make sure the topic is completely understood by the kids.My kids also love her and feel so comfortable with Kavitha.I highly recommend Kavitha for everyone who is looking for excellent Math teachers.Thank You.",
    author: "Jeen Philip(Texas)"
  },
  {
    text: "Thank you for making math fun and enjoyable! We've seen so much growth in our child's confidence and love for learning. We truly appreciate your patience, kindness, and dedication. Highly recommended!.",
    author: "Joshna (Ontario)"
  },
  {
    text: "I highly recommend Mrs. Kavitha! She really helped my daughter to get better at math and feel more confident in the subject. Her way of teaching is very engaging and proactive. She doesn't just help students catch up when they fall behind. Works ahead to make sure they really understand each concept before quizzes and tests.Mrs. Kavitha is very patient and encouraging. She always checks if my daughter is on track and well-prepared which has made a difference in how she understands and performs in math. We are really thankful, for her work and dedication. We highly recommend her to any parent looking for a math tutor!.",
    author: "Chitra menon (Maryland)"
  },
  {
    text: "Kavitha is an excellent Math teacher. She is patient, professional, and very knowledgeable. She makes sure my son understands every concept clearly by giving regular homework and revision exercises. Her teaching method has helped improve his confidence and interest in Math. My son always looks forward to her classes. I highly recommend Kavitha to anyone looking for a dedicated and caring Math tutor.",
    author: "Mahe (Ontario)"
}
]

const TYPEWRITER_TEXT = "WELCOME TO NXT STEP TUTORING"
const TYPING_SPEED = 100
const DELETING_SPEED = 60
const PAUSE_AFTER_TYPING = 2000
const PAUSE_AFTER_DELETING = 800

function Home({ activePage, setActivePage }) {
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
          {displayedText.length <= 11
            ? <>{renderLetters(displayedText)}<span className="typewriter-cursor">|</span></>
            : <>{renderLetters(displayedText.slice(0, 11))}<br className="mobile-break" />{renderLetters(displayedText.slice(11), 11)}<span className="typewriter-cursor">|</span></>
          }
        </h1>

        <div className="hero-badge">
          <ion-icon name="school-outline"></ion-icon>
          <span>Online Math Tutor · US &amp; Canada Curriculum | Available Globally</span>
        </div>

        <div className="curriculum-flags">
          <div className="curriculum-flag" title="US Curriculum">
            <span className="flag-emoji">🇺🇸</span>
          </div>
          <div className="curriculum-flag" title="UK Curriculum">
            <span className="flag-emoji">🇬🇧</span>
          </div>
          <div className="curriculum-flag" title="Canadian Curriculum">
            <span className="flag-emoji">🇨🇦</span>
          </div>
          <div className="curriculum-flag" title="International Baccalaureate">
            <span className="flag-emoji">🌐</span>
          </div>
        </div>

        <h3 className="hero-title">
          Building confidence,<br />
          <span className="hero-highlight">one concept at a time.</span>
        </h3>

        <p className="hero-text">
          One-on-one online math tutoring with 11+ years of teaching experience — helping students truly understand math, not just memorize it. Serving students across EST, CST, and PST time zones.
        </p>

        <div className="hero-cta-wrapper">
          <a
            className="hero-cta-btn primary"
            href="https://docs.google.com/forms/d/e/1FAIpQLScQ5j02hoEAjPNSjb7SOhjNzGnXARnFZ281JZst6DHF7nOWWA/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Enroll now</span>
          </a>
          <button
            className="hero-cta-btn secondary"
            onClick={() => {
              document.getElementById('about-me')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ion-icon name="arrow-down-outline"></ion-icon>
            <span>Learn More</span>
          </button>
        </div>
      </section>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />

      {/* About Me Section */}
      <section id="about-me">
        <header>
          <h3 className="h3">About Me</h3>
        </header>
        <p className="about-text" style={{ marginTop: '15px' }}>
          I am a dedicated online math tutor with 11+ years of experience, specializing in the US and Canadian curricula. I focus on building strong conceptual foundations rather than rote memorization. My tailored one-on-one approach ensures every student learns at their own pace, helping them gain real confidence, problem-solving skills, and measurable improvements in their grades.
        </p>

        <ul className="stats-list" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <li className="stat-card">
            <h4 className="stat-number">11+</h4>
            <p className="stat-text">Years Teaching Experience</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number">4+</h4>
            <p className="stat-text">Years — US &amp; Canada Curriculum</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number">1:1</h4>
            <p className="stat-text">Fully Online, Personalized Sessions</p>
          </li>
          <li className="stat-card">
            <h4 className="stat-number" style={{ fontSize: '1.8rem' }}>EST · CST · PST</h4>
            <p className="stat-text">Time Zones Served</p>
          </li>
        </ul>
      </section>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />

      {/* Services Section */}
      <section>
        <header>
          <h3 className="h3">Services</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>How I can help</p>
        </header>

        <ul className="services-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '25px' }}>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">US Curriculum</h4>
              <p className="service-item-text">Personalized math tutoring aligned with US grade-level standards, from foundational arithmetic through algebra and beyond.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Canadian Curriculum</h4>
              <p className="service-item-text">Support tailored to provincial math curricula, helping students stay confident and on track with their coursework.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">One-on-One Sessions</h4>
              <p className="service-item-text">Fully personalized attention — lessons move at your child's pace, with regular check-ins on progress.</p>
            </div>
          </li>
          <li className="service-item">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">Fully Online</h4>
              <p className="service-item-text">Convenient, flexible scheduling from anywhere — all you need is a stable internet connection.</p>
            </div>
          </li>
          <li className="service-item no-advance-payment-card">
            <div className="service-content-box">
              <h4 className="h4 service-item-title">No Advanced Payment</h4>
              <p className="service-item-text" style={{ fontStyle: 'italic', marginBottom: '10px' }}>
                "Trust is gained when actions meet words." — Chris Butler
              </p>
              <p className="service-item-text" style={{ marginBottom: '14px' }}>
                Our no-advance payment policy bestows priority on classes rather than payments. Make the payment at the end of the month just for the sessions attended.
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />

      {/* Track Record Section */}
      <section>
        <header>
          <h3 className="h3">Track Record</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Consistent, real improvement</p>
        </header>
        <p className="about-text" style={{ marginTop: '15px' }}>
          Parents consistently describe the support here as proactive and attentive — regular check-ins, careful attention to each child's specific gaps, and steady communication along the way. The result: every student who has worked with me has shown measurable improvement, whether that's stronger grades, better test scores, or simply more confidence sitting down to do math homework.
        </p>
      </section>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />

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

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--jet)', margin: '50px 0' }} />

      {/* Get In Touch */}
      <section className="contact-section" style={{ background: 'var(--border-gradient-onyx)', padding: '30px', borderRadius: '14px', position: 'relative', zIndex: 1 }}>
        <div style={{ content: '""', position: 'absolute', inset: '1px', background: 'var(--bg-gradient-jet)', borderRadius: 'inherit', zIndex: -1 }}></div>
        <header>
          <h3 className="h3">Get in Touch</h3>
          <p style={{ color: 'var(--light-gray)', marginTop: '5px' }}>Let's help your child build confidence in math.</p>
        </header>
        <p className="about-text" style={{ marginTop: '15px' }}>
          Reach out to schedule a free trial session, ask about pricing, or check current availability for your time zone.
        </p>
        <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
          <a href="mailto:kavitha.nextsteptutoring@gmail.com" className="hero-cta-btn primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="mail-outline"></ion-icon>
            <span>Email Me</span>
          </a>
          <a href="https://wa.me/918610933559" className="hero-cta-btn secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="logo-whatsapp"></ion-icon>
            <span>WhatsApp Me</span>
          </a>
        </div>
        
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
      </section>

      <footer style={{ marginTop: '60px', textAlign: 'center', color: 'var(--light-gray)', fontSize: 'var(--fs-8)', paddingBottom: '30px' }}>
        © 2026 Kavitha JR — Online Math Tutor. All rights reserved.
      </footer>

    </article>
  )
}

export default Home
