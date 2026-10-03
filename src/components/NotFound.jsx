import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main>
      <article className="not-found-page active">
        <header>
          <h2 className="h2 article-title">Page Not Found</h2>
        </header>
        
        <div className="not-found-content">
          <ion-icon name="alert-circle-outline" className="not-found-icon"></ion-icon>
          <h3>404</h3>
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/" className="hero-cta-btn primary">
            <ion-icon name="home-outline"></ion-icon>
            <span>Go Home</span>
          </Link>
        </div>
      </article>
    </main>
  )
}

export default NotFound
