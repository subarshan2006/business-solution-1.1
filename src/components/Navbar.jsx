import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const pages = [
  { label: 'Home', key: 'home' },
  { label: 'About', key: 'about' },
  { label: 'Courses', key: 'services' },
]

const ENROLL_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSc615afQFRpiaWyfpmTKWOBSGzOYmZDcg95rZZ9u3HKvBbT8g/viewform'

function Navbar({ activePage, theme, toggleTheme, showThemeToggle = true }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const btnRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [menuOpen])

  // Close menu on page change
  useEffect(() => {
    setMenuOpen(false)
  }, [activePage])

  const go = (key) => {
    navigate('/', { state: { activePage: key } })
    window.scrollTo(0, 0)
  }

  const goToResults = () => {
    if (activePage !== 'home') {
      navigate('/', { state: { activePage: 'home' } })
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ===== DESKTOP NAVBAR ===== */}
      <nav className="navbar navbar-desktop" aria-label="Main Navigation">
        <ul className="navbar-list">
          {pages.map((page) => (
            <li className="navbar-item" key={page.key}>
              <button
                className={`navbar-link${activePage === page.key ? ' active' : ''}`}
                data-nav-link
                onClick={() => go(page.key)}
              >
                {page.label}
              </button>
            </li>
          ))}
          <li className="navbar-item">
            <button
              className="navbar-link"
              data-nav-link
              onClick={goToResults}
            >
              Results
            </button>
          </li>
          <li className="navbar-item navbar-item-utility">
            <Link
              to="/classroom"
              className={`navbar-link navbar-login-link${activePage === 'classroom' ? ' active' : ''}`}
              data-nav-link
            >
              Student Login
            </Link>
          </li>
          {showThemeToggle && (
            <li className="navbar-item navbar-item-theme">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </li>
          )}
          <li className="navbar-item navbar-item-cta">
            <a
              href={ENROLL_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-cta-btn"
            >
              Book a free call
            </a>
          </li>
        </ul>
      </nav>

      {/* ===== MOBILE HEADER CONTROLS (Top Right) ===== */}
      <div className="mobile-header-bar">
        {showThemeToggle && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
        <button
          ref={btnRef}
          className={`mobile-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      <div ref={menuRef} className={`mobile-menu-popup${menuOpen ? ' open' : ''}`}>
        <ul className="mobile-menu-list">
          {pages.map((page) => (
            <li key={page.key}>
              <button
                className={`mobile-menu-link${activePage === page.key ? ' active' : ''}`}
                onClick={() => {
                  go(page.key)
                  setMenuOpen(false)
                }}
              >
                {page.label}
              </button>
            </li>
          ))}
          <li>
            <button
              className="mobile-menu-link"
              onClick={() => {
                goToResults()
                setMenuOpen(false)
              }}
            >
              Results
            </button>
          </li>
          <li>
            <Link
              to="/classroom"
              className={`mobile-menu-link${activePage === 'classroom' ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Student Login
            </Link>
          </li>
          <li style={{ marginTop: '8px' }}>
            <a
              href={ENROLL_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-cta-btn"
              style={{ display: 'block', textAlign: 'center', width: '100%' }}
              onClick={() => setMenuOpen(false)}
            >
              Book a free call
            </a>
          </li>
        </ul>
      </div>

      {/* Backdrop overlay */}
      {menuOpen && <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  )
}

export default Navbar