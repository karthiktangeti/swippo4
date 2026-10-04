import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import './RetailerProducts.css'

const CATS = [{k:'all',e:'🏪',n:'All Products'},{k:'staples',e:'🌾',n:'Staples'},{k:'dairy',e:'🥛',n:'Dairy'},{k:'produce',e:'🥦',n:'Produce'},{k:'fmcg',e:'🧴',n:'FMCG'},{k:'beverages',e:'☕',n:'Beverages'},{k:'snacks',e:'🍪',n:'Snacks'},{k:'cleaning',e:'🧹',n:'Cleaning'},{k:'packaged',e:'🥫',n:'Packaged'}]

export default function RetailerProducts() {
  const [params, setParams] = useSearchParams()
  const { addToCart, cart, itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [prods, setProds] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState({})
  const [qtys, setQtys] = useState({})
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [total, setTotal] = useState(0)

  const cat = params.get('category') || 'all'

  useEffect(() => { fetch() }, [cat, sort])

  const fetch = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (cat !== 'all') q.set('category', cat)
      if (search.trim()) q.set('search', search.trim())
      if (sort) q.set('sort', sort)
      q.set('limit','24')
      const { data } = await api.get(`/products?${q}`)
      setProds(data.products)
      setTotal(data.total || data.products.length)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const cartQty = id => { const it = cart.items.find(i=>(i.product?._id||i.product)===id); return it?.quantity||0 }

  const addItem = async p => {
    const qty = qtys[p._id] || p.minOrder
    setAdding(a=>({...a,[p._id]:true}))
    try { await addToCart(p._id, qty); toast.success(`Added ${qty} ${p.unit} to cart 🛒`) }
    catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setAdding(a=>({...a,[p._id]:false})) }
  }

  const disc = (mrp, price) => mrp ? Math.round(((mrp-price)/mrp)*100) : 0

  return (
    <div className="rp">
      <Navbar/>
      <div className="rp-layout">

        {/* SIDEBAR */}
        <aside className="rp-side">
          <div className="rp-prof">
            <div className="rp-av">{(user?.businessName||user?.name)?.charAt(0).toUpperCase()}</div>
            <div><div className="rp-bname">{user?.businessName||user?.name}</div><span className="br">🏪 Retailer</span></div>
          </div>
          <div className="rp-cat-title">Categories</div>
          <ul className="rp-cats">
            {CATS.map(c=>(
              <li key={c.k}>
                <button className={`rp-cat ${cat===c.k?'rp-cat-on':''}`} onClick={()=>setParams(c.k==='all'?{}:{category:c.k})}>
                  <span>{c.e}</span>{c.n}
                </button>
              </li>
            ))}
          </ul>
          {itemCount > 0 && (
            <Link to="/retailer/cart" className="rp-cart-cta">
              🛒 View Cart &nbsp;·&nbsp; <strong>{itemCount} items</strong>
            </Link>
          )}
          <Link to="/retailer/orders" className="rp-orders-link">📦 My Orders</Link>
        </aside>

        {/* MAIN */}
        <main className="rp-main">
          <div className="rp-topbar">
            <form className="rp-search" onSubmit={e=>{e.preventDefault();fetch()}}>
              <span className="rp-search-ic">🔍</span>
              <input placeholder="Search products, brands, vendors…" value={search} onChange={e=>setSearch(e.target.value)}/>
              <button type="submit" className="btn btn-r btn-sm">Search</button>
            </form>
            <select className="rp-sort" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>

          <p className="rp-meta">Showing <strong>{prods.length}</strong> of <strong>{total}</strong> products{cat!=='all'&&<> in <em>{CATS.find(c=>c.k===cat)?.n}</em></>}</p>

          {loading ? (
            <div className="rp-skels">{[...Array(8)].map((_,i)=><div className="rp-skel" key={i}/>)}</div>
          ) : prods.length===0 ? (
            <div className="empty"><span className="ico">🔍</span><h3>No products found</h3><p>Try a different category or search term.</p></div>
          ) : (
            <div className="rp-grid">
              {prods.map(p=>{
                const d = disc(p.mrp, p.price)
                const cq = cartQty(p._id)
                return (
                  <div className="pc" key={p._id}>
                    {d>0 && <span className="pc-disc">{d}% OFF</span>}
                    <div className="pc-img">{p.emoji}</div>
                    <div className="pc-body">
                      <div className="pc-vendor">{p.vendor?.companyName||p.companyName||p.vendorName}</div>
                      <h4 className="pc-name">{p.name}</h4>
                      <div className="pc-moq">Min. {p.minOrder} {p.unit}</div>
                      <div className="pc-stars">
                        {'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5-Math.round(p.rating))}
                        <span>({p.reviews||0})</span>
                      </div>
                      <div className="pc-prices">
                        <span className="pc-price">₹{p.price.toLocaleString()}</span>
                        {p.mrp && <span className="pc-mrp">₹{p.mrp.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="pc-foot">
                      <div className="pc-qty-row">
                        <label>Qty</label>
                        <input type="number" min={p.minOrder} className="pc-qty" value={qtys[p._id]??p.minOrder} onChange={e=>setQtys(q=>({...q,[p._id]:+e.target.value}))}/>
                        <span className="pc-unit">{p.unit}</span>
                      </div>
                      {cq>0 && <div className="pc-incart">✓ {cq} in cart</div>}
                      <button className="btn btn-r pc-add" onClick={()=>addItem(p)} disabled={adding[p._id]}>
                        {adding[p._id]?'Adding…':cq>0?'+ Add More':'Add to Cart'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
