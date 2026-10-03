const experience = [
  {
    title: 'Self-Employed Online Math Tutor',
    years: 'March 2026 – Present',
    text: 'Now offering fully independent, one-on-one online tutoring, continuing to serve both US and Canadian curriculum students.',
  },
  {
    title: 'US Based Online Tutoring Company',
    years: '2022 – March 2026',
    text: 'Taught the US curriculum from 2022 onward — Elementary through Pre-Calculus, Algebra I & II, Geometry I & II, Trigonometry, and AP-level topics — with Canadian curriculum added from 2024.',
  },
  {
    title: 'Little Angels English Hr. Sec. School, Karur',
    years: '2017 – 2021',
    text: 'Mathematics teacher for Middle School, High School, and Grades 11–12, following the ICSE and IB curricula.',
  },
  {
    title: 'The Indian Public School (TIPS)',
    years: '2015 – 2017',
    text: 'Homeroom and subject teacher for the IB Primary Years Programme (PYP), Grades 1–5, and the IB Middle Years Programme (MYP).',
  },
]

function TimelineSection({ icon, title, items }) {
  return (
    <section className="timeline">
      <div className="title-wrapper">
        <div className="icon-box">
          <ion-icon name={icon}></ion-icon>
        </div>
        <h3 className="h3">{title}</h3>
      </div>
      <ol className="timeline-list">
        {items.map((item) => (
          <li className="timeline-item" key={item.title}>
            <h4 className="h4 timeline-item-title">{item.title}</h4>
            <span>{item.years}</span>
            <p className="timeline-text">{item.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function About({ activePage, setActivePage }) {
  return (
    <article className={`about${activePage === 'about' ? ' active' : ''}`} data-page="about">

      <header>
        <h2 className="h2 article-title">About Me</h2>
      </header>

      <p className="page-subtitle">
        11+ years of helping students see math differently.
      </p>

      {/* My Story */}
      <section className="about-story" style={{ marginBottom: '60px' }}>
        <div className="title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div className="icon-box" style={{ color: 'var(--orange-yellow-crayola)', fontSize: '2rem' }}>
            <ion-icon name="book-outline"></ion-icon>
          </div>
          <h3 className="h3" style={{ marginBottom: 0 }}>My Story</h3>
        </div>
        
        <div className="service-item" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p className="about-text" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
            I've spent over 11 years teaching mathematics — starting in the classroom and later moving into fully online, one-on-one tutoring. Along the way, I've taught students following the US and Canadian curricula, as well as international frameworks, giving me a broad perspective on how math is taught differently around the world — and, more importantly, how students actually learn it.
          </p>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', background: 'hsla(0, 0%, 100%, 0.04)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--orange-yellow-crayola)' }}>
            <ion-icon name="bulb-outline" style={{ fontSize: '2.5rem', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            <p className="about-text" style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--white-2)' }}>
              What hasn't changed over the years is my belief that every student can succeed in math when the explanation finally clicks. My job isn't to rush through topics — it's to slow down wherever needed until real understanding takes hold.
            </p>
          </div>
        </div>
      </section>

      {/* My Teaching Philosophy */}
      <section className="about-philosophy" style={{ marginBottom: '60px' }}>
        <div className="title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div className="icon-box" style={{ color: 'var(--orange-yellow-crayola)', fontSize: '2rem' }}>
            <ion-icon name="extension-puzzle-outline"></ion-icon>
          </div>
          <h3 className="h3" style={{ marginBottom: 0 }}>My Teaching Philosophy</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="icon-box" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'hsla(38, 90%, 45%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-yellow-crayola)' }}>
              <ion-icon name="help-buoy-outline" style={{ fontSize: '1.5rem' }}></ion-icon>
            </div>
            <p className="about-text">
              My approach is a little different — I rarely give students the answer directly. Instead, I ask guiding questions and offer small clues, letting them work their way to the answer themselves. It takes a bit more patience, but the payoff is real: students build genuine confidence, because they know the understanding is theirs, not something handed to them.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="icon-box" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'hsla(38, 90%, 45%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-yellow-crayola)' }}>
              <ion-icon name="leaf-outline" style={{ fontSize: '1.5rem' }}></ion-icon>
            </div>
            <p className="about-text">
              I also put a lot of care into creating a relaxed, pressure-free environment from the very first session. Students feel comfortable asking questions and making mistakes without hesitation — this comfort is often what unlocks real progress, especially for students who have felt discouraged by math in the past.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="icon-box" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'hsla(38, 90%, 45%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-yellow-crayola)' }}>
              <ion-icon name="rocket-outline" style={{ fontSize: '1.5rem' }}></ion-icon>
            </div>
            <p className="about-text">
              I want every student to walk away believing that math is simple and manageable — not something to fear, and not something their past grades have to define. Combined with consistent practice and a good amount of patience, this approach is what helps students stay motivated and genuinely engaged with their work, rather than dreading it.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="icon-box" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'hsla(38, 90%, 45%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-yellow-crayola)' }}>
              <ion-icon name="chatbubbles-outline" style={{ fontSize: '1.5rem' }}></ion-icon>
            </div>
            <p className="about-text">
              When students understand the "why" behind a method, they're able to handle new problems confidently — not just repeat what they've memorized. I also stay in regular contact with parents, so progress is always visible and there are no surprises.
            </p>
          </div>

        </div>
      </section>

      {/* Experience Timeline */}
      <TimelineSection icon="book-outline" title="Experience Timeline" items={experience} />

      {/* CTA */}
      <section className="services-cta" style={{ marginTop: '40px' }}>
        <div className="services-cta-card content-card" style={{ paddingTop: '25px', cursor: 'default', textAlign: 'center' }}>
          <h3 className="h3" style={{ marginBottom: '10px' }}>Want to know if I'm the right fit for your child?</h3>
          <p className="services-cta-text">
            Let's talk about your child's needs and how I can help.
          </p>
          <button
            className="hero-cta-btn primary services-cta-btn"
            onClick={() => {
              setActivePage('contact')
              window.scrollTo(0, 0)
            }}
          >
            <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
            <span>Get in Touch</span>
          </button>
          
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

export default About
