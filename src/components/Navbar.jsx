import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const pages = ['Home', 'About', 'Services', 'Contact']

function Navbar({ activePage, setActivePage }) {
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

  return (
    <>
      {/* ===== DESKTOP NAVBAR (unchanged) ===== */}
      <nav className="navbar navbar-desktop">
        <ul className="navbar-list">
          {pages.map((page) => (
            <li className="navbar-item" key={page}>
              <button
                className={`navbar-link${activePage === page.toLowerCase() ? ' active' : ''}`}
                data-nav-link
                onClick={() => {
                  navigate('/', { state: { activePage: page.toLowerCase() } })
                  window.scrollTo(0, 0)
                }}
              >
                {page}
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
            <li key={page}>
              <button
                className={`mobile-menu-link${activePage === page.toLowerCase() ? ' active' : ''}`}
                onClick={() => {
                  navigate('/', { state: { activePage: page.toLowerCase() } })
                  window.scrollTo(0, 0)
                  setMenuOpen(false)
                }}
              >
                {page}
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
