import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import './RetailerCart.css'

export default function RetailerCart() {
  const { cart, updateQty, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [addr, setAddr] = useState('')
  const [pay, setPay]   = useState('digital')
  const [placing, setPlacing] = useState(false)

  const tax = Math.round(cart.total * 0.05)
  const delivery = cart.total > 2000 ? 0 : 99
  const grand = cart.total + tax + delivery

  const place = async () => {
    if (!addr.trim()) { toast.error('Enter delivery address'); return }
    setPlacing(true)
    try {
      const { data } = await api.post('/orders/place', { deliveryAddress: addr, paymentMethod: pay })
      toast.success('Order placed! 🎉')
      navigate(`/retailer/orders/${data._id}`)
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setPlacing(false) }
  }

  if (!cart.items.length) return (
    <div className="rc-page">
      <Navbar/>
      <div className="empty" style={{paddingTop:'8rem'}}>
        <span className="ico">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Browse products and add items to cart for bulk ordering.</p>
        <Link to="/retailer/products" className="btn btn-r">Browse Products</Link>
      </div>
    </div>
  )

  return (
    <div className="rc-page">
      <Navbar/>
      <div className="rc-wrap">

        {/* STEPS */}
        <div className="rc-steps">
          {['Cart Review','Checkout','Order Placed'].map((s,i)=>(
            <>
              <div className={`rc-step ${step>=i+1?'rc-step-on':''}`} key={s}>
                <span>{step>i+1?'✓':i+1}</span>{s}
              </div>
              {i<2 && <div className={`rc-line ${step>i+1?'rc-line-on':''}`} key={'l'+i}/>}
            </>
          ))}
        </div>

        <div className="rc-grid">

          {/* LEFT */}
          <div>
            {step===1 && (
              <div className="rc-card">
                <div className="rc-card-hd">
                  <h3>Cart Items <span>({cart.items.length})</span></h3>
                  <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear All</button>
                </div>
                <div className="rc-items">
                  {cart.items.map(it=>{
                    const p = it.product
                    const id = p?._id||p
                    return (
                      <div className="rc-item" key={id}>
                        <div className="rc-em">{p?.emoji||'📦'}</div>
                        <div className="rc-info">
                          <div className="rc-nm">{p?.name||'Product'}</div>
                          <div className="rc-vd">{p?.companyName||p?.vendorName||''}</div>
                          <div className="rc-pu">₹{it.price.toLocaleString()} / {p?.unit||'unit'}</div>
                        </div>
                        <div className="rc-qty">
                          <button onClick={()=>updateQty(id, it.quantity-1)}>−</button>
                          <span>{it.quantity}</span>
                          <button onClick={()=>updateQty(id, it.quantity+1)}>+</button>
                        </div>
                        <div className="rc-sub">₹{(it.price*it.quantity).toLocaleString()}</div>
                        <button className="rc-rm" onClick={()=>removeItem(id)}>✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step===2 && (
              <div className="rc-card rc-checkout">
                <h3>Delivery &amp; Payment</h3>
                <div className="fg fg-r" style={{marginBottom:'1.2rem'}}>
                  <label>Delivery Address *</label>
                  <textarea rows={3} placeholder="Full address with street, city, pincode…" value={addr} onChange={e=>setAddr(e.target.value)} style={{resize:'none'}}/>
                </div>
                <div className="fg" style={{gap:'.5rem'}}>
                  <label>Payment Method</label>
                  <div className="pay-opts">
                    {[['digital','💳','Digital / UPI','Instant confirmation'],['cash','💵','Cash on Delivery','Pay when received'],['credit','🏦','Business Credit','Pay later']].map(([v,ic,lb,sub])=>(
                      <label key={v} className={`pay-opt ${pay===v?'pay-opt-on':''}`} onClick={()=>setPay(v)}>
                        <input type="radio" name="pay" value={v} checked={pay===v} onChange={()=>setPay(v)} style={{display:'none'}}/>
                        <span className="pay-ic">{ic}</span>
                        <div><div className="pay-lb">{lb}</div><div className="pay-sub">{sub}</div></div>
                        {pay===v && <span className="pay-ck">✓</span>}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY */}
          <aside className="rc-sum">
            <h3>Order Summary</h3>
            <div className="rc-sum-rows">
              <div className="rc-sum-row"><span>Subtotal</span><span>₹{cart.total.toLocaleString()}</span></div>
              <div className="rc-sum-row"><span>GST (5%)</span><span>₹{tax}</span></div>
              <div className="rc-sum-row"><span>Delivery</span><span style={{color:delivery===0?'var(--r)':undefined}}>{delivery===0?'FREE':'₹'+delivery}</span></div>
              {delivery>0 && <div className="rc-note">Add ₹{(2000-cart.total).toLocaleString()} more for free delivery</div>}
              <div className="rc-sum-total"><span>Grand Total</span><span>₹{grand.toLocaleString()}</span></div>
            </div>
            {step===1
              ? <button className="btn btn-r rc-cta" onClick={()=>setStep(2)}>Proceed to Checkout →</button>
              : <>
                  <button className="btn btn-r rc-cta" onClick={place} disabled={placing}>
                    {placing?'Placing Order…':`Place Order — ₹${grand.toLocaleString()}`}
                  </button>
                  <button className="btn btn-ghost rc-cta" onClick={()=>setStep(1)}>← Back to Cart</button>
                </>
            }
            <Link to="/retailer/products" className="rc-cont">← Continue Shopping</Link>
          </aside>

        </div>
      </div>
    </div>
  )
}
