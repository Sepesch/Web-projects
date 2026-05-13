import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Биржа брокеров</h2>
        </div>
        <ul className="nav-links">
          <li>
            <Link 
              to="/brokers" 
              className={location.pathname === '/brokers' ? 'active' : ''}
            >
              Брокеры
            </Link>
          </li>
          <li>
            <Link 
              to="/stocks" 
              className={location.pathname === '/stocks' ? 'active' : ''}
            >
              Акции
            </Link>
          </li>
          <li>
            <Link 
              to="/trading" 
              className={location.pathname === '/trading' ? 'active' : ''}
            >
              Торги
            </Link>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout