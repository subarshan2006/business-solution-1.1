import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const pages = [
  { label: 'Home', key: 'home' },
  { label: 'About Me', key: 'about' },
  { label: 'Courses', key: 'services' },
  { label: 'Contact', key: 'contact' },
]

function Navbar({ activePage }) {
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

  return (
    <>
      {/* ===== DESKTOP NAVBAR ===== */}
      <nav className="navbar navbar-desktop">
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
            <Link
              to="/studentrecords"
              className={`navbar-link${activePage === 'notes' ? ' active' : ''}`}
              data-nav-link
            >
              Student Record
            </Link>
          </li>
        </ul>
      </nav>

      {/* ===== MOBILE HAMBURGER + POPUP ===== */}
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
            <Link
              to="/studentrecords"
              className={`mobile-menu-link${activePage === 'notes' ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Student Record
            </Link>
          </li>
        </ul>
      </div>

      {/* Backdrop overlay */}
      {menuOpen && <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  )
}

export default Navbar