import { useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

const VTYPES = ['FMCG Manufacturer','Grocery Wholesaler','Staples Distributor','Dairy Supplier','Beverage Company','Snacks & Bakery','Cleaning Products','Packaged Foods','Electronics','Other']
const BTYPES = [['kirana','🏪 Kirana Store'],['restaurant','🍽 Restaurant'],['hotel','🏨 Hotel'],['cafe','☕ Café'],['supermarket','🛒 Supermarket'],['other','🏢 Other Business']]
const CATS   = ['staples','dairy','produce','fmcg','beverages','snacks','cleaning','packaged']

export default function Auth() {
  const { role } = useParams()
  const location = useLocation()
  const isV = role === 'vendor'
  const isReg = location.pathname.startsWith('/register')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [f, setF] = useState({ name:'', email:'', password:'', phone:'', city:'', companyName:'', companyType:'', gstin:'', productCategories:[], businessName:'', businessType:'kirana' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }))
  const toggleCat = c => set('productCategories', f.productCategories.includes(c) ? f.productCategories.filter(x=>x!==c) : [...f.productCategories,c])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isReg && f.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (isReg && isV && !f.companyName.trim()) { setError('Company name is required'); return }
    setLoading(true)
    try {
      if (isReg) {
        await register({ ...f, role })
        toast.success('Account created! Welcome to Swippo 🎉')
      } else {
        await login(f.email, f.password, role)
        toast.success('Signed in! Welcome back 👋')
      }
      navigate(isV ? '/vendor/dashboard' : '/retailer/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`au ${isV ? 'au-v' : 'au-r'}`}>

      {/* ── LEFT PANEL ── */}
      <div className="au-left">
        <Link to="/" className="au-logo">swip<em>po</em></Link>
        <div className={`au-chip ${isV ? 'bv' : 'br'} au-chip-dark`}>
          {isV ? '🏭 Product Company / Vendor' : '🏪 Wholesale Retailer'}
        </div>
        <h1 className="au-h1">
          {isV
            ? (isReg ? 'Start Selling to\nRetailers Today' : 'Welcome Back,\nVendor')
            : (isReg ? 'Source Wholesale\nProducts Today' : 'Welcome Back,\nRetailer')
          }
        </h1>
        <p className="au-sub">
          {isV
            ? "List your catalog and start receiving bulk orders from thousands of verified retailers across India."
            : "Browse and order directly from manufacturers at wholesale prices. Save up to 30% on every order."
          }
        </p>
        <ul className="au-perks">
          {(isV
            ? ['Unlimited product listings','Reach 10,000+ verified buyers','Vendor dashboard & analytics','Real-time order notifications']
            : ['10,000+ products to browse','Flexible MOQ per product','3 flexible payment methods','Live order tracking & support']
          ).map(p => (
            <li key={p}>
              <span className={`au-check ${isV ? 'au-ckv' : 'au-ckr'}`}>✓</span>{p}
            </li>
          ))}
        </ul>
        <div className="au-switch">
          {isV
            ? <>Not a vendor? <Link to={`/${isReg?'register':'login'}/retailer`}>Switch to Retailer {isReg?'Sign Up':'Login'}</Link></>
            : <>Not a retailer? <Link to={`/${isReg?'register':'login'}/vendor`}>Switch to Vendor {isReg?'Sign Up':'Login'}</Link></>
          }
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="au-right">
        <div className="au-box">
          <div className="au-box-head">
            <span className={isV ? 'bv' : 'br'}>{isV ? '🏭 Vendor' : '🏪 Retailer'}</span>
            <h2>{isReg ? 'Create your account' : 'Sign in to your account'}</h2>
            <p className="au-toggle">
              {isReg
                ? <>{isV ? 'Already a vendor?' : 'Already a retailer?'} <Link to={`/login/${role}`}>Sign in here</Link></>
                : <>New to Swippo? <Link to={`/register/${role}`}>Create free account</Link></>
              }
            </p>
          </div>

          {error && <div className="alert alert-err">{error}</div>}

          <form onSubmit={submit} className={`au-form fg-${isV?'v':'r'}`} noValidate>

            {/* ── REGISTER ONLY ── */}
            {isReg && <>
              <div className="row2">
                <div className="fg">
                  <label>Full Name *</label>
                  <input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" required/>
                </div>
                <div className="fg">
                  <label>Phone</label>
                  <input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 99999 99999"/>
                </div>
              </div>

              {isV ? <>
                <div className="row2">
                  <div className="fg">
                    <label>Company Name *</label>
                    <input value={f.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="e.g. Agromart Foods Pvt Ltd" required/>
                  </div>
                  <div className="fg">
                    <label>Company Type *</label>
                    <select value={f.companyType} onChange={e=>set('companyType',e.target.value)} required>
                      <option value="">Select type...</option>
                      {VTYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row2">
                  <div className="fg">
                    <label>GSTIN</label>
                    <input value={f.gstin} onChange={e=>set('gstin',e.target.value)} placeholder="22AAAAA0000A1Z5"/>
                  </div>
                  <div className="fg">
                    <label>City</label>
                    <input value={f.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. Hyderabad"/>
                  </div>
                </div>
                <div className="fg">
                  <label>Product Categories (select applicable)</label>
                  <div className="cat-wrap">
                    {CATS.map(c => (
                      <button type="button" key={c}
                        className={`cat-tag ${f.productCategories.includes(c) ? (isV?'cat-active-v':'cat-active-r') : ''}`}
                        onClick={()=>toggleCat(c)}>{c}
                      </button>
                    ))}
                  </div>
                </div>
              </> : <>
                <div className="row2">
                  <div className="fg">
                    <label>Business Name</label>
                    <input value={f.businessName} onChange={e=>set('businessName',e.target.value)} placeholder="Your shop / hotel name"/>
                  </div>
                  <div className="fg">
                    <label>Business Type *</label>
                    <select value={f.businessType} onChange={e=>set('businessType',e.target.value)}>
                      {BTYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fg">
                  <label>City</label>
                  <input value={f.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. Hyderabad"/>
                </div>
              </>}
            </>}

            {/* ── COMMON ── */}
            <div className="fg">
              <label>Email Address *</label>
              <input type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="you@company.com" required/>
            </div>
            <div className="fg">
              <label>Password *</label>
              <div className="pw-row">
                <input type={showPw?'text':'password'} value={f.password} onChange={e=>set('password',e.target.value)} placeholder={isReg?'Minimum 6 characters':'Your password'} required minLength={6}/>
                <button type="button" className="pw-eye" onClick={()=>setShowPw(!showPw)} tabIndex={-1}>{showPw?'🙈':'👁'}</button>
              </div>
            </div>

            <button type="submit" className={`btn ${isV?'btn-v':'btn-r'} btn-lg au-submit`} disabled={loading}>
              {loading
                ? <><span className="spin spin-sm"/>{isReg?'Creating account...':'Signing in...'}</>
                : isReg
                  ? `Create ${isV?'Vendor':'Retailer'} Account →`
                  : `Sign In as ${isV?'Vendor':'Retailer'} →`
              }
            </button>
          </form>

          <p className="au-terms">By continuing you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  )
}
