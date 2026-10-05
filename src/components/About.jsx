const experience = [
  {
    title: 'Independent Science Mentor — Jivanaut Test Prep',
    years: '2026 – Present',
    text: 'Tailored, high-impact 1-on-1 online mentoring in AP Biology, AP Environmental Science, and AP Psychology for high school students across US and international time zones.'
  },
  {
    title: 'Specialized Online Science Educator (US AP Curriculum)',
    years: '2021 – 2026',
    text: 'Five years of dedicated online instruction for US-based students across Advanced Placement (AP) sciences and life sciences, focusing on core conceptual mastery, Free-Response Question (FRQ) scoring frameworks, and consistent top-bracket exam results.'
  },
  {
    title: 'Middle School Science Educator — Asiaville',
    years: '2020',
    text: 'Inquiry-driven science instruction bridging both CBSE and State curricula, developing foundational critical thinking and practical experimental curiosity in middle school learners.'
  },
  {
    title: 'Science Educator — The Indian Public School (IB Curriculum)',
    years: '2015 – 2020',
    text: 'Five years of rigorous scientific instruction within the International Baccalaureate (IB) framework, fostering student-led inquiry, hands-on laboratory investigations, and strong conceptual foundations in science.'
  }
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

const PillIcon = ({ icon }) => (
  <div
    className="icon-box"
    style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'hsla(38, 90%, 45%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-yellow-crayola)' }}
  >
    <ion-icon name={icon} style={{ fontSize: '1.5rem' }}></ion-icon>
  </div>
)

function About({ activePage, setActivePage }) {
  return (
    <article className={`about${activePage === 'about' ? ' active' : ''}`} data-page="about">

      <header>
        <h2 className="h2 article-title">About Me</h2>
      </header>

      <p className="page-subtitle">
        11+ Years of Dedication to Rigorous Science Education and Student Empowerment.
      </p>

      {/* My Story */}
      <section className="about-story" style={{ marginBottom: '60px' }}>
        <div className="title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div className="icon-box" style={{ color: 'var(--orange-yellow-crayola)', fontSize: '2rem' }}>
            <ion-icon name="flask-outline"></ion-icon>
          </div>
          <h3 className="h3" style={{ marginBottom: 0 }}>The Vision Behind Jivanaut</h3>
        </div>

        <div className="service-item" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p className="about-text" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
            Welcome to Jivanaut Test Prep. My educational journey began with a profound fascination
            for the living world — a curiosity reflected in our name: Jiva (Life) and Naut
            (Explorer). With post-graduate degrees in Zoology and Environmental Science, a B.Ed. and a
            Diploma in Psychology &amp; Counseling, I have devoted the past 11 years to
            translating complex academic concepts into intuitive, exciting discoveries for
            students.
          </p>
          <p className="about-text" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
            Having taught in both traditional classrooms and intensive one-on-one virtual settings,
            I recognise the hurdles students face when transitioning from standard school curricula
            to college-level Advanced Placement (AP) courses. Memorisation alone is insufficient;
            students must analyse novel experimental data, deduce causal relationships, and
            articulate findings precisely under timed conditions.
          </p>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', background: 'hsla(0, 0%, 100%, 0.04)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--orange-yellow-crayola)' }}>
            <ion-icon name="bulb-outline" style={{ fontSize: '2.5rem', color: 'var(--orange-yellow-crayola)' }}></ion-icon>
            <p className="about-text" style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--white-2)' }}>
              My mission is to serve as an academic co-pilot: creating an encouraging, academically
              rigorous space where students transform confusion into confidence, conquer their
              school exams, and secure premier results on official AP test days.
            </p>
          </div>
        </div>
      </section>

      {/* Three Pillars of Instruction */}
      <section className="about-philosophy" style={{ marginBottom: '60px' }}>
        <div className="title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div className="icon-box" style={{ color: 'var(--orange-yellow-crayola)', fontSize: '2rem' }}>
            <ion-icon name="extension-puzzle-outline"></ion-icon>
          </div>
          <h3 className="h3" style={{ marginBottom: 0 }}>Three Pillars of Instruction</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="search-outline" />
            <h4 className="h4">1. Guided Discovery</h4>
            <p className="about-text">
              Moving away from passive lecturing. By framing targeted questions, I train students
              to deduce biochemical and ecological mechanisms independently, locking in long-term
              retention.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="ribbon-outline" />
            <h4 className="h4">2. Rubric Precision</h4>
            <p className="about-text">
              Subject knowledge must translate into points. Students practise deconstructing College
              Board scoring guidelines, learning the exact terminology required to score full marks
              on FRQs.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="leaf-outline" />
            <h4 className="h4">3. Supportive Environment</h4>
            <p className="about-text">
              Challenging courses create anxiety. Our 1-on-1 setting is a pressure-free laboratory
              where mistakes are treated as diagnostic tools, empowering students to take
              intellectual initiative.
            </p>
          </div>

        </div>
      </section>

      {/* Why 1-on-1 Works */}
      <section className="about-philosophy" style={{ marginBottom: '60px' }}>
        <div className="title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div className="icon-box" style={{ color: 'var(--orange-yellow-crayola)', fontSize: '2rem' }}>
            <ion-icon name="rocket-outline"></ion-icon>
          </div>
          <h3 className="h3" style={{ marginBottom: 0 }}>Why 1-on-1 Virtual Tutoring Works</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="speedometer-outline" />
            <h4 className="h4">Individualized Pace</h4>
            <p className="about-text">
              Topics are never rushed to match a class bell. We linger on tricky units like Cellular
              Energetics or Gene Regulation until total mastery is achieved.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="tablet-landscape-outline" />
            <h4 className="h4">Active Digital Whiteboarding</h4>
            <p className="about-text">
              Live annotation of cellular diagrams, experimental variables, and biochemical pathways
              ensures dynamic, visual engagement throughout every session.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="document-text-outline" />
            <h4 className="h4">Transparent Reporting</h4>
            <p className="about-text">
              Regular post-session briefings, milestone checks, and transparent progress updates
              shared directly with parents throughout all diagnostic details.
            </p>
          </div>

          <div className="service-item" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PillIcon icon="globe-outline" />
            <h4 className="h4">Global Scheduling</h4>
            <p className="about-text">
              Direct accommodation for US time zones — EST, CST, MST, and PST — plus flexible slots
              for international students.
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

export default About