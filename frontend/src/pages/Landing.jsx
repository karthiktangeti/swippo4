import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="ld">
      {/* NAV */}
      <nav className="ld-nav">
        <div className="pg ld-nav-in">
          <Link to="/" className="ld-logo">swip<em>po</em></Link>
          <div className="ld-nav-r">
            {user
              ? <Link to={user.role==='vendor'?'/vendor/dashboard':'/retailer/products'} className="btn btn-r btn-sm">Dashboard →</Link>
              : <>
                  <Link to="/login/retailer"   className="btn btn-ghost btn-sm">Sign In</Link>
                  <Link to="/register/vendor"  className="btn btn-v btn-sm">Vendor Sign Up</Link>
                  <Link to="/register/retailer"className="btn btn-r btn-sm">Retailer Sign Up</Link>
                </>
            }
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="ld-hero">
        <div className="hero-bg-grid"/>
        <div className="hero-blob h-blob1"/><div className="hero-blob h-blob2"/><div className="hero-blob h-blob3"/>
        <div className="pg hero-inner">
          <span className="hero-pill">🇮🇳 India's #1 B2B Wholesale Platform</span>
          <h1>Where Vendors &amp;<br/><span className="hero-accent">Retailers Connect</span></h1>
          <p>The modern marketplace that connects product companies directly with wholesale buyers. Cut middlemen. Reduce costs. Scale faster.</p>
          <div className="hero-btns">
            <Link to="/register/vendor"   className="btn btn-v btn-lg"><span>🏭</span> Join as Vendor</Link>
            <Link to="/register/retailer" className="btn btn-r btn-lg"><span>🏪</span> Join as Retailer</Link>
          </div>
          <div className="hero-numbers">
            {[['10,000+','Verified Retailers'],['500+','Product Vendors'],['50,000+','Orders Delivered'],['40+','Cities Covered']].map(([n,l])=>(
              <div key={l} className="hn"><span className="hn-n">{n}</span><span className="hn-l">{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="ld-roles">
        <div className="pg">
          <p className="sec-label">Two Roles</p>
          <h2 className="sec-title">One Platform for Both Sides of Trade</h2>
          <div className="roles-grid">
            <div className="role-card rc-v">
              <div className="rc-glow rc-glow-v"/>
              <div className="rc-top">
                <div className="rc-ico rc-ico-v">🏭</div>
                <span className="bv">Product Company / Vendor</span>
                <h3>Sell to 10,000+<br/>Retailers Nationwide</h3>
                <p>List your products, set minimum order quantities, and receive bulk purchase orders from verified retailers across India — no middlemen.</p>
              </div>
              <ul className="rc-list">
                {['Add unlimited products to your catalog','Set your own prices & MOQ','Get discovered by thousands of buyers','Track all your orders in one dashboard','Zero commission on first 100 orders'].map(f=>(
                  <li key={f}><span className="rc-bullet rc-bv">✓</span>{f}</li>
                ))}
              </ul>
              <div className="rc-foot">
                <Link to="/register/vendor" className="btn btn-v btn-lg" style={{width:'100%',justifyContent:'center'}}>Create Vendor Account →</Link>
                <Link to="/login/vendor" className="rc-alt">Already registered? <strong>Sign In</strong></Link>
              </div>
            </div>

            <div className="role-card rc-r">
              <div className="rc-glow rc-glow-r"/>
              <div className="rc-top">
                <div className="rc-ico rc-ico-r">🏪</div>
                <span className="br">Wholesale Retailer / Buyer</span>
                <h3>Buy Directly at<br/>Wholesale Prices</h3>
                <p>Source groceries, FMCG & daily essentials from verified manufacturers. Save up to 30% compared to traditional procurement channels.</p>
              </div>
              <ul className="rc-list">
                {['Browse 10,000+ products from vendors','Place bulk orders with flexible MOQ','Digital, Cash or Business Credit payment','Live order tracking &amp; delivery timeline','Dedicated support for your account'].map(f=>(
                  <li key={f}><span className="rc-bullet rc-br">✓</span>{f}</li>
                ))}
              </ul>
              <div className="rc-foot">
                <Link to="/register/retailer" className="btn btn-r btn-lg" style={{width:'100%',justifyContent:'center'}}>Create Retailer Account →</Link>
                <Link to="/login/retailer" className="rc-alt">Already registered? <strong>Sign In</strong></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="ld-how">
        <div className="pg">
          <p className="sec-label">How It Works</p>
          <h2 className="sec-title">Up and Running in Minutes</h2>
          <div className="how-row">
            {[
              {n:'01',ico:'📝',t:'Register',d:'Create your free account. Choose your role — vendor or retailer — and complete your business profile.'},
              {n:'02',ico:'🔍',t:'Discover',d:'Vendors list products. Retailers browse thousands of items with smart search, filters and pricing.'},
              {n:'03',ico:'🛒',t:'Transact',d:'Place bulk orders directly. Choose from digital payment, cash on delivery or business credit.'},
              {n:'04',ico:'🚚',t:'Deliver',d:'Track your shipment in real-time. Get live updates from dispatch all the way to your doorstep.'},
            ].map((s,i)=>(
              <div className="hw-card" key={s.n}>
                <div className="hw-n">{s.n}</div>
                <div className="hw-ico">{s.ico}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
                {i<3 && <div className="hw-arr">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="ld-cta">
        <div className="pg ld-cta-in">
          <div>
            <h2>Ready to Transform Your Business?</h2>
            <p>Join thousands of vendors and retailers already growing on Swippo.</p>
          </div>
          <div className="ld-cta-btns">
            <Link to="/register/vendor"   className="btn btn-v btn-lg">Start as Vendor →</Link>
            <Link to="/register/retailer" className="btn btn-r btn-lg">Start as Retailer →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ld-foot">
        <div className="pg ld-foot-in">
          <span className="ld-logo" style={{color:'#fff'}}>swip<em>po</em></span>
          <p>© 2025 Swippo Technologies Pvt. Ltd. &nbsp;·&nbsp; 🇮🇳 Made in India</p>
          <div className="foot-links">
            <Link to="/register/vendor">Vendors</Link>
            <Link to="/register/retailer">Retailers</Link>
            <a href="#">Privacy</a><a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
