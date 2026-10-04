import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import './RetailerOrders.css'

const STEPS = [{k:'placed',ic:'📋',l:'Placed'},{k:'confirmed',ic:'✅',l:'Confirmed'},{k:'processing',ic:'⚙️',l:'Processing'},{k:'shipped',ic:'📦',l:'Shipped'},{k:'out_for_delivery',ic:'🚚',l:'Out for Delivery'},{k:'delivered',ic:'🎉',l:'Delivered'}]
const CLR   = {placed:'#3B82F6',confirmed:'#8B5CF6',processing:'#F59E0B',shipped:'#06B6D4',out_for_delivery:'#F97316',delivered:'#10B981',cancelled:'#EF4444'}

export function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login/retailer'); return }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [id])

  const load = async () => {
    try { const { data } = await api.get(`/orders/${id}`); setOrder(data) }
    catch { navigate('/retailer/orders') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="ro-page"><Navbar/><div className="ro-center"><div className="spin"/></div></div>
  if (!order) return null

  const cur = STEPS.findIndex(s => s.k === order.status)

  return (
    <div className="ro-page">
      <Navbar/>
      <div className="ro-wrap">
        <div className="od-hdr">
          <Link to="/retailer/orders" className="od-back">← My Orders</Link>
          <div className="od-title">
            <h1>Order #{order.orderId}</h1>
            <p>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <span className="od-status" style={{background:CLR[order.status]+'18',color:CLR[order.status],border:`1px solid ${CLR[order.status]}30`}}>
            {order.status.replace(/_/g,' ').toUpperCase()}
          </span>
        </div>

        <div className="od-grid">
          <div>
            {/* TRACKER */}
            <div className="od-card">
              <h3>📍 Live Tracking</h3>
              <div className="tracker">
                {STEPS.map((s,i) => (
                  <div key={s.k} className={`tr-s ${i<=cur?'tr-done':''} ${i===cur?'tr-cur':''}`}>
                    <div className="tr-c">{i<=cur?s.ic:i+1}</div>
                    <div className="tr-l">{s.l}</div>
                    {i<STEPS.length-1 && <div className="tr-line"/>}
                  </div>
                ))}
              </div>
              {order.estimatedDelivery && (
                <div className="eta">
                  <span>🕐 Est. Delivery</span>
                  <strong>{new Date(order.estimatedDelivery).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</strong>
                </div>
              )}
              {order.timeline?.length > 0 && (
                <div className="tl">
                  {[...order.timeline].reverse().map((t,i) => (
                    <div className="tl-row" key={i}>
                      <div className="tl-dot"/>
                      <div><div className="tl-msg">{t.message}</div><div className="tl-time">{new Date(t.time).toLocaleString('en-IN')}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="od-card">
              <h3>📦 Items Ordered</h3>
              {order.items.map((it,i) => (
                <div className="od-item" key={i}>
                  <span style={{fontSize:'1.4rem'}}>{it.emoji||'📦'}</span>
                  <div style={{flex:1}}><div className="od-item-nm">{it.name}</div><div className="od-item-sub">{it.vendorName} · Qty {it.quantity}</div></div>
                  <div className="od-item-amt">₹{(it.price*it.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="od-card">
              <h3>💳 Payment</h3>
              <div className="od-rows">
                <div className="od-row"><span>Method</span><span style={{textTransform:'capitalize'}}>{order.paymentMethod}</span></div>
                <div className="od-row"><span>Status</span><span style={{color:order.paymentStatus==='paid'?'var(--r)':'var(--muted)',fontWeight:700}}>{order.paymentStatus.toUpperCase()}</span></div>
                <div className="od-row od-total"><span>Total</span><span>₹{order.totalAmount.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="od-card">
              <h3>🚚 Delivery Address</h3>
              <p className="od-addr">{order.deliveryAddress}</p>
            </div>
            <Link to="/retailer/products" className="btn btn-r" style={{display:'flex',justifyContent:'center',marginTop:'1rem',padding:'.78rem'}}>+ Order More Products</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RetailerOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login/retailer'); return }
    api.get('/orders').then(({ data }) => setOrders(data)).catch(()=>{}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="ro-page">
      <Navbar/>
      <div className="ro-wrap">
        <div className="ro-hdr">
          <h1>My Orders</h1>
          <Link to="/retailer/products" className="btn btn-r btn-sm">+ New Order</Link>
        </div>

        {loading
          ? <div className="ro-center"><div className="spin"/></div>
          : orders.length===0
            ? <div className="empty"><span className="ico">📦</span><h3>No orders yet</h3><p>Browse and place your first bulk order.</p><Link to="/retailer/products" className="btn btn-r">Browse Products</Link></div>
            : <div className="ro-list">
                {orders.map(o => (
                  <div key={o._id} className="ro-row" onClick={()=>navigate(`/retailer/orders/${o._id}`)}>
                    <div className="ro-left">
                      <div className="ro-id">#{o.orderId}</div>
                      <div className="ro-dt">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                      <div className="ro-ems">{o.items.slice(0,4).map((it,i)=><span key={i}>{it.emoji||'📦'}</span>)}</div>
                      <div className="ro-names">{o.items.map(i=>i.name).slice(0,2).join(', ')}{o.items.length>2?'…':''}</div>
                    </div>
                    <div className="ro-right">
                      <span className="ro-st" style={{background:CLR[o.status]+'18',color:CLR[o.status]}}>{o.status.replace(/_/g,' ')}</span>
                      <div className="ro-amt">₹{o.totalAmount.toLocaleString()}</div>
                      <span className="ro-track">Track →</span>
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  )
}
