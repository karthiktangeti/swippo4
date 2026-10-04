import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount }    = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const isV = user?.role === 'vendor'
  const isR = user?.role === 'retailer'
  const active = p => location.pathname === p ? 'nb-active' : ''

  const doLogout = () => { logout(); toast.success('Signed out'); navigate('/') }
  const display  = isV ? (user.companyName || user.name) : (user?.businessName || user?.name)

  return (
    <nav className="nb">
      <div className="pg nb-in">
        <Link to="/" className="nb-logo">swip<em>po</em></Link>

        <ul className="nb-links">
          {isV && <>
            <li><Link className={active('/vendor/dashboard')} to="/vendor/dashboard">📦 Products</Link></li>
            <li><a href="#">📊 Analytics</a></li>
            <li><Link className={active('/vendor/dashboard')} to="/vendor/dashboard?tab=orders">🧾 Orders</Link></li>
          </>}
          {isR && <>
            <li><Link className={active('/retailer/products')} to="/retailer/products">🏪 Browse</Link></li>
            <li><Link className={active('/retailer/orders')}   to="/retailer/orders">📦 My Orders</Link></li>
          </>}
          {!user && <>
            <li><Link to="/register/vendor">For Vendors</Link></li>
            <li><Link to="/register/retailer">For Retailers</Link></li>
          </>}
        </ul>

        <div className="nb-r">
          {isR && (
            <Link to="/retailer/cart" className="nb-cart">
              🛒{itemCount > 0 && <span className="nb-dot">{itemCount > 9 ? '9+' : itemCount}</span>}
            </Link>
          )}

          {user ? (
            <div className="nb-user" ref={ref}>
              <button className="nb-trigger" onClick={()=>setOpen(o=>!o)}>
                <span className={`nb-av ${isV?'nb-av-v':'nb-av-r'}`}>{display?.charAt(0).toUpperCase()}</span>
                <span className="nb-name">{display?.split(' ')[0]}</span>
                <span className={isV ? 'bv' : 'br'}>{isV?'🏭 Vendor':'🏪 Retailer'}</span>
                <svg width="11" height="11" viewBox="0 0 11 11" style={{transform:open?'rotate(180deg)':'none',transition:'transform .2s',color:'var(--muted)'}}>
                  <path d="M1.5 3.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              {open && (
                <div className="nb-drop">
                  <div className="nb-drop-head">
                    <span className={`nb-av nb-av-lg ${isV?'nb-av-v':'nb-av-r'}`}>{display?.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  {isV && <Link to="/vendor/dashboard" className="nb-item" onClick={()=>setOpen(false)}>📦 My Products</Link>}
                  {isR && <>
                    <Link to="/retailer/products" className="nb-item" onClick={()=>setOpen(false)}>🏪 Browse</Link>
                    <Link to="/retailer/orders"   className="nb-item" onClick={()=>setOpen(false)}>📦 My Orders</Link>
                    <Link to="/retailer/cart"     className="nb-item" onClick={()=>setOpen(false)}>🛒 Cart {itemCount>0?`(${itemCount})`:''}</Link>
                  </>}
                  <div className="nb-sep"/>
                  <button className="nb-item nb-logout" onClick={doLogout}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="nb-guest">
              <Link to="/login/retailer"  className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register/vendor" className="btn btn-v     btn-sm">Vendor Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
