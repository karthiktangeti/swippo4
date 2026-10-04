import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const Ctx = createContext(null)

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sw_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })

  useEffect(() => {
    if (user?.role === 'retailer') fetchCart()
    else setCart({ items: [], total: 0 })
  }, [user])

  const fetchCart = async () => {
    try { const { data } = await api.get('/cart'); setCart(data) } catch {}
  }

  const addToCart = async (productId, quantity) => {
    const { data } = await api.post('/cart/add', { productId, quantity })
    setCart(data)
  }

  const updateQty = async (productId, quantity) => {
    const { data } = await api.put('/cart/update', { productId, quantity })
    setCart(data)
  }

  const removeItem = async (productId) => {
    const { data } = await api.delete(`/cart/remove/${productId}`)
    setCart(data)
  }

  const clearCart = async () => {
    await api.delete('/cart/clear')
    setCart({ items: [], total: 0 })
  }

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <Ctx.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart, itemCount, fetchCart }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCart = () => useContext(Ctx)
