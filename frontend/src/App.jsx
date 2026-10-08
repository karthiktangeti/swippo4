import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import Landing          from './pages/Landing'
import Auth             from './pages/Auth'
import VendorDashboard  from './pages/vendor/VendorDashboard'
import RetailerProducts from './pages/retailer/RetailerProducts'
import RetailerCart     from './pages/retailer/RetailerCart'
import RetailerOrders, { OrderDetail } from './pages/retailer/RetailerOrders'
import Wishlist from './pages/retailer/Wishlist'
import Chatbot from './components/Chatbot'

function Guard({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={`/login/${role}`} replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                     element={<Landing />} />
      <Route path="/register/:role"       element={<Auth />} />
      <Route path="/login/:role"          element={<Auth />} />
      <Route path="/vendor/dashboard"     element={<Guard role="vendor"><VendorDashboard /></Guard>} />
      <Route path="/retailer/products"    element={<Guard role="retailer"><RetailerProducts /></Guard>} />
      <Route path="/retailer/cart"        element={<Guard role="retailer"><RetailerCart /></Guard>} />
      <Route path="/retailer/orders"      element={<Guard role="retailer"><RetailerOrders /></Guard>} />
      <Route path="/retailer/orders/:id"  element={<Guard role="retailer"><OrderDetail /></Guard>} />
      <Route path="/retailer/wishlist"    element={<Guard role="retailer"><Wishlist /></Guard>} />
      <Route path="*"                     element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{
            style: { fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'.88rem' },
            duration: 3500
          }}/>
          <AppRoutes />
          <Chatbot />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
