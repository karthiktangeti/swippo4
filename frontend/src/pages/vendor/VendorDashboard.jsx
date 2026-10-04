import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import './VendorDashboard.css'

const CATS = ['staples','dairy','produce','fmcg','beverages','snacks','cleaning','packaged']
const EMOJI = {staples:'🌾',dairy:'🥛',produce:'🥦',fmcg:'🧴',beverages:'☕',snacks:'🍪',cleaning:'🧹',packaged:'🥫'}
const BLANK = {name:'',description:'',price:'',mrp:'',unit:'kg',minOrder:'1',stock:'100',category:'staples',emoji:'🌾'}

const STATUS_COLOR = {
  placed:'#3B82F6', confirmed:'#8B5CF6', processing:'#F59E0B',
  shipped:'#06B6D4', out_for_delivery:'#F97316', delivered:'#10B981', cancelled:'#EF4444'
}
const STATUS_NEXT = {
  placed:'confirmed', confirmed:'processing', processing:'shipped',
  shipped:'out_for_delivery', out_for_delivery:'delivered'
}
const STATUS_LABEL = {
  placed:'Placed', confirmed:'Confirmed', processing:'Processing',
  shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled'
}

export default function VendorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab,     setTab]     = useState('products')   // 'products' | 'orders'
  const [prods,   setProds]   = useState([])
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [ordLoad, setOrdLoad] = useState(false)
  const [selOrder,setSelOrder]= useState(null)         // expanded order detail
  const [modal,   setModal]   = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState(BLANK)
  const [saving,  setSaving]  = useState(false)
  const [delMap,  setDelMap]  = useState({})
  const [updMap,  setUpdMap]  = useState({})

  useEffect(() => {
    if (!user || user.role !== 'vendor') { navigate('/'); return }
    loadProducts()
  }, [])

  // load orders when tab switches
  useEffect(() => {
    if (tab === 'orders' && orders.length === 0) loadOrders()
  }, [tab])

  const loadProducts = async () => {
    setLoading(true)
    try { const { data } = await api.get('/products/my'); setProds(data) }
    catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  const loadOrders = async () => {
    setOrdLoad(true)
    try { const { data } = await api.get('/orders/vendor-orders'); setOrders(data) }
    catch (err) { toast.error('Failed to load orders: ' + (err.response?.data?.message || err.message)) }
    finally { setOrdLoad(false) }
  }

  const updateStatus = async (orderId, status) => {
    setUpdMap(m => ({ ...m, [orderId]: true }))
    try {
      await api.patch(`/orders/vendor-orders/${orderId}/status`, { status })
      setOrders(os => os.map(o => o._id === orderId ? { ...o, status } : o))
      if (selOrder?._id === orderId) setSelOrder(o => ({ ...o, status }))
      toast.success(`Status updated to "${STATUS_LABEL[status]}" ✅`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdMap(m => ({ ...m, [orderId]: false }))
    }
  }

  // ── Product CRUD ──
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const openAdd  = () => { setEditId(null); setForm(BLANK); setModal(true) }
  const openEdit = p  => { setEditId(p._id); setForm({ name:p.name, description:p.description||'', price:p.price, mrp:p.mrp||'', unit:p.unit, minOrder:p.minOrder, stock:p.stock, category:p.category, emoji:p.emoji }); setModal(true) }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) {
        const { data } = await api.put(`/products/${editId}`, form)
        setProds(p => p.map(x => x._id === editId ? data : x))
        toast.success('Updated ✅')
      } else {
        const { data } = await api.post('/products', form)
        setProds(p => [data, ...p])
        toast.success('Product added 🎉')
      }
      setModal(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this product?')) return
    setDelMap(m => ({ ...m, [id]: true }))
    try { await api.delete(`/products/${id}`); setProds(p => p.filter(x => x._id !== id)); toast.success('Deleted') }
    catch { toast.error('Failed') }
    finally { setDelMap(m => ({ ...m, [id]: false })) }
  }

  const toggle = async p => {
    try { const { data } = await api.put(`/products/${p._id}`, { inStock: !p.inStock }); setProds(ps => ps.map(x => x._id === p._id ? data : x)) } catch {}
  }

  const val = prods.reduce((s, p) => s + p.price * (p.stock || 0), 0)
  const pendingOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status)).length

  return (
    <div className="vd">
      <Navbar/>
      <div className="vd-layout">

        {/* SIDEBAR */}
        <aside className="vd-side">
          <div className="vd-prof">
            <div className="vd-av">{(user?.companyName || user?.name)?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="vd-co">{user?.companyName || user?.name}</div>
              <span className="bv">🏭 Vendor</span>
            </div>
          </div>
          <nav className="vd-nav">
            <button className={`vd-ni ${tab==='products'?'vd-ni-on':''}`} onClick={()=>setTab('products')}>
              📦 My Products <span className="vd-ni-count">{prods.length}</span>
            </button>
            <button className={`vd-ni ${tab==='orders'?'vd-ni-on':''}`} onClick={()=>setTab('orders')}>
              🧾 Orders Received
              {pendingOrders > 0 && <span className="vd-ni-badge">{pendingOrders}</span>}
            </button>
            <a className="vd-ni" href="#">📊 Analytics</a>
            <a className="vd-ni" href="#">⚙️ Settings</a>
          </nav>
          <button className="vd-ni vd-ni-out" onClick={()=>{ logout(); navigate('/') }}>🚪 Sign Out</button>
        </aside>

        {/* MAIN */}
        <main className="vd-main">

          {/* ── STATS ── */}
          <div className="vd-stats">
            {[
              ['📦','Total Products', prods.length,           'var(--v)'],
              ['✅','In Stock',       prods.filter(p=>p.inStock).length, 'var(--r)'],
              ['🧾','Total Orders',   orders.length,           '#8B5CF6'],
              ['⏳','Pending',        pendingOrders,           'var(--amber)'],
            ].map(([ic,lb,vl,co]) => (
              <div className="vd-stat" key={lb}>
                <span className="vd-stat-ic" style={{background:co+'18',color:co}}>{ic}</span>
                <div><div className="vd-stat-v">{vl}</div><div className="vd-stat-l">{lb}</div></div>
              </div>
            ))}
          </div>

          {/* ══════════ PRODUCTS TAB ══════════ */}
          {tab === 'products' && <>
            <div className="vd-hdr">
              <div><h2>Product Catalog</h2><p>Retailers browse and order these products</p></div>
              <button className="btn btn-v" onClick={openAdd}>+ Add Product</button>
            </div>

            {loading
              ? <div className="vd-loader"><div className="spin"/></div>
              : prods.length === 0
                ? <div className="empty"><span className="ico">📦</span><h3>No products yet</h3><p>Add your first product to start receiving bulk orders.</p><button className="btn btn-v" onClick={openAdd}>+ Add Product</button></div>
                : <div className="vd-table-w">
                    <table className="vd-tbl">
                      <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>MOQ</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {prods.map(p => (
                          <tr key={p._id}>
                            <td><div className="vt-row"><span className="vt-em">{p.emoji}</span><div><div className="vt-nm">{p.name}</div>{p.description&&<div className="vt-ds">{p.description.slice(0,38)}…</div>}</div></div></td>
                            <td><span className="vt-cat">{p.category}</span></td>
                            <td><div className="vt-pr">₹{p.price.toLocaleString()}</div>{p.mrp&&<div className="vt-mr">MRP ₹{p.mrp.toLocaleString()}</div>}</td>
                            <td className="vt-n">{p.minOrder} {p.unit}</td>
                            <td className="vt-n">{p.stock}</td>
                            <td><button className={`vt-tog ${p.inStock?'vt-in':'vt-out'}`} onClick={()=>toggle(p)}>{p.inStock?'● In Stock':'○ Out of Stock'}</button></td>
                            <td><div className="vt-acts"><button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}>Edit</button><button className="btn btn-del btn-sm" onClick={()=>del(p._id)} disabled={delMap[p._id]}>{delMap[p._id]?'…':'Delete'}</button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            }
          </>}

          {/* ══════════ ORDERS TAB ══════════ */}
          {tab === 'orders' && <>
            <div className="vd-hdr">
              <div>
                <h2>Orders Received</h2>
                <p>{orders.length} orders from retailers for your products</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={loadOrders}>🔄 Refresh</button>
            </div>

            {ordLoad
              ? <div className="vd-loader"><div className="spin"/></div>
              : orders.length === 0
                ? <div className="empty">
                    <span className="ico">🧾</span>
                    <h3>No orders yet</h3>
                    <p>When retailers order your products, they'll appear here with full details.</p>
                  </div>
                : <div className="vo-list">
                    {orders.map(o => (
                      <div key={o._id} className={`vo-card ${selOrder?._id===o._id?'vo-card-open':''}`}>

                        {/* ORDER HEADER ROW */}
                        <div className="vo-row" onClick={()=>setSelOrder(selOrder?._id===o._id ? null : o)}>
                          <div className="vo-left">
                            <div className="vo-id">#{o.orderId}</div>
                            <div className="vo-dt">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                            <div className="vo-items-preview">
                              {o.myItems.slice(0,3).map((it,i)=><span key={i}>{it.emoji||'📦'}</span>)}
                              {o.myItems.length>3 && <span className="vo-more">+{o.myItems.length-3}</span>}
                              <span className="vo-inames">{o.myItems.map(i=>i.name).slice(0,2).join(', ')}{o.myItems.length>2?'…':''}</span>
                            </div>
                          </div>
                          <div className="vo-right">
                            <span className="vo-st" style={{background:STATUS_COLOR[o.status]+'18',color:STATUS_COLOR[o.status]}}>
                              {STATUS_LABEL[o.status]}
                            </span>
                            <div className="vo-amt">₹{o.myTotal.toLocaleString()}</div>
                            <span className="vo-arr">{selOrder?._id===o._id?'▲':'▼'}</span>
                          </div>
                        </div>

                        {/* EXPANDED DETAIL */}
                        {selOrder?._id === o._id && (
                          <div className="vo-detail">

                            {/* Retailer Info */}
                            <div className="vo-section">
                              <div className="vo-sec-title">🏪 Retailer Details</div>
                              <div className="vo-retailer">
                                <div className="vo-ret-av">{(o.retailer?.businessName||o.retailer?.name||'?').charAt(0).toUpperCase()}</div>
                                <div className="vo-ret-info">
                                  <strong>{o.retailer?.businessName || o.retailer?.name}</strong>
                                  <span>{o.retailer?.businessType ? `• ${o.retailer.businessType}` : ''} {o.retailer?.city ? `• ${o.retailer.city}` : ''}</span>
                                  {o.retailer?.phone && <span>📞 {o.retailer.phone}</span>}
                                  {o.retailer?.email && <span>✉ {o.retailer.email}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Items ordered */}
                            <div className="vo-section">
                              <div className="vo-sec-title">📦 Items Ordered from You</div>
                              <div className="vo-items">
                                {o.myItems.map((it, i) => (
                                  <div className="vo-item" key={i}>
                                    <span className="vo-item-em">{it.emoji||'📦'}</span>
                                    <div className="vo-item-body">
                                      <div className="vo-item-nm">{it.name}</div>
                                      <div className="vo-item-qty">Qty: {it.quantity} × ₹{it.price.toLocaleString()}</div>
                                    </div>
                                    <div className="vo-item-tot">₹{(it.price*it.quantity).toLocaleString()}</div>
                                  </div>
                                ))}
                                <div className="vo-subtotal">
                                  <span>Your Revenue from this order</span>
                                  <strong>₹{o.myTotal.toLocaleString()}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Delivery + Payment */}
                            <div className="vo-two-col">
                              <div className="vo-section">
                                <div className="vo-sec-title">🚚 Delivery Address</div>
                                <p className="vo-addr">{o.deliveryAddress}</p>
                              </div>
                              <div className="vo-section">
                                <div className="vo-sec-title">💳 Payment</div>
                                <div className="vo-pay-row"><span>Method</span><span style={{textTransform:'capitalize'}}>{o.paymentMethod}</span></div>
                                <div className="vo-pay-row"><span>Status</span>
                                  <span style={{color:o.paymentStatus==='paid'?'var(--r)':'var(--amber)',fontWeight:700}}>
                                    {o.paymentStatus.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status update */}
                            {!['delivered','cancelled'].includes(o.status) && (
                              <div className="vo-section vo-actions">
                                <div className="vo-sec-title">⚙️ Update Order Status</div>
                                <div className="vo-status-btns">
                                  {STATUS_NEXT[o.status] && (
                                    <button
                                      className="btn btn-v"
                                      disabled={updMap[o._id]}
                                      onClick={()=>updateStatus(o._id, STATUS_NEXT[o.status])}
                                    >
                                      {updMap[o._id] ? '…' : `Mark as "${STATUS_LABEL[STATUS_NEXT[o.status]]}" →`}
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-del btn-sm"
                                    disabled={updMap[o._id]}
                                    onClick={()=>{ if(confirm('Cancel this order?')) updateStatus(o._id,'cancelled') }}
                                  >
                                    Cancel Order
                                  </button>
                                </div>
                              </div>
                            )}
                            {(o.status === 'delivered' || o.status === 'cancelled') && (
                              <div className="vo-section">
                                <span className={`vo-final ${o.status==='delivered'?'vo-delivered':'vo-cancelled'}`}>
                                  {o.status === 'delivered' ? '✅ Order Delivered' : '❌ Order Cancelled'}
                                </span>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    ))}
                  </div>
            }
          </>}
        </main>
      </div>

      {/* ── ADD/EDIT PRODUCT MODAL ── */}
      {modal && (
        <div className="vd-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="vd-modal">
            <div className="vd-modal-hd">
              <h3>{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="vd-modal-x" onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={save} className="vd-modal-bd fg-v">
              <div className="row2">
                <div className="fg"><label>Product Name *</label><input value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="e.g. Basmati Rice 25kg" required/></div>
                <div className="fg"><label>Category *</label>
                  <select value={form.category} onChange={e=>{sf('category',e.target.value);sf('emoji',EMOJI[e.target.value]||'📦')}}>
                    {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg"><label>Description</label><input value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Short description"/></div>
              <div className="row2">
                <div className="fg"><label>Your Price ₹ *</label><input type="number" value={form.price} onChange={e=>sf('price',e.target.value)} placeholder="0" required min="0"/></div>
                <div className="fg"><label>MRP ₹</label><input type="number" value={form.mrp} onChange={e=>sf('mrp',e.target.value)} placeholder="0" min="0"/></div>
              </div>
              <div className="row2">
                <div className="fg"><label>Unit</label><input value={form.unit} onChange={e=>sf('unit',e.target.value)} placeholder="kg / litre / piece"/></div>
                <div className="fg"><label>Min. Order Qty</label><input type="number" value={form.minOrder} onChange={e=>sf('minOrder',e.target.value)} min="1"/></div>
                <div className="fg"><label>Available Stock</label><input type="number" value={form.stock} onChange={e=>sf('stock',e.target.value)} min="0"/></div>
              </div>
              <div className="vd-modal-ft">
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-v" disabled={saving}>{saving?<><span className="spin spin-sm"/> Saving…</>:editId?'Update Product':'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
