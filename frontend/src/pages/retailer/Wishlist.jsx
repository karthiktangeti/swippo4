import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'
import './Wishlist.css'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [wishlist, alerts] = await Promise.all([api.get('/wishlist'), api.get('/notifications')])
      setItems(wishlist.data)
      setNotifications(alerts.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async id => {
    try {
      await api.delete(`/wishlist/${id}`)
      setItems(current => current.filter(item => item.product?._id !== id))
      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove')
    }

    const markAllRead = async () => {
      await api.patch('/notifications/read-all')
      setNotifications(current => current.map(item => ({ ...item, read: true })))
    }
  }

  return (
    <div className="wl-page">
      <Navbar />
      <main className="wl-main">
        <div className="wl-head">
          <div><p className="eyebrow">Your saved products</p><h1>Wishlist</h1></div>
          <Link to="/retailer/products" className="btn btn-r btn-sm">Browse products</Link>
        </div>
        {notifications.length > 0 && <section className="wl-alerts">
          <div className="wl-alert-head"><h2>Price & availability alerts</h2>{notifications.some(item => !item.read) && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}</div>
          {notifications.slice(0, 8).map(item => <div className={`wl-alert ${item.read ? '' : 'wl-alert-new'}`} key={item._id}><span>{item.type === 'price_drop' ? '🏷️' : '📦'}</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div></div>)}
        </section>}
        {loading ? <div className="empty"><span className="ico">⏳</span><p>Loading wishlist…</p></div> :
          items.length === 0 ? (
            <div className="empty"><span className="ico">♡</span><h3>Your wishlist is empty</h3><p>Save products to get price-drop and restock alerts.</p><Link to="/retailer/products" className="btn btn-r">Find products</Link></div>
          ) : (
            <div className="wl-grid">{items.map(({ product }) => product && (
              <article className="wl-card" key={product._id}>
                <div className="wl-emoji">{product.emoji}</div>
                <div className="wl-info"><small>{product.vendor?.companyName || product.companyName || product.vendorName}</small><h3>{product.name}</h3><strong>₹{product.price?.toLocaleString()}</strong><span className={product.inStock && product.stock > 0 ? 'wl-stock' : 'wl-out'}>{product.inStock && product.stock > 0 ? 'In stock' : 'Out of stock'}</span></div>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(product._id)}>Remove</button>
              </article>
            ))}</div>
          )}
      </main>
    </div>
  )
}
