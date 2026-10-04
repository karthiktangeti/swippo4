import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Chatbot.css'

const welcome = "Hi! 👋 I'm Swippo AI. I can help you with your orders, products, inventory, sales and more. What would you like to know?"
const retailerSuggestions = ['📦 Show my recent orders', '🚚 Track my order ORD-', '📊 Give me my order summary', '💰 How much did I spend this month?', '🛒 Find products', '🤖 Recommend products for me']
const vendorSuggestions = ['📦 Show my recent orders', '📊 Show my sales summary', '🏆 What are my best-selling products?', '⚠️ Which products are low in stock?', '💰 Show my revenue', '📈 Show my sales statistics']

function Message({ item }) {
  return (
    <div className={`sw-chat-msg ${item.sender === 'user' ? 'sw-chat-user' : 'sw-chat-assistant'}`}>
      {item.sender !== 'user' && <span className="sw-chat-avatar">🤖</span>}
      <div className="sw-chat-bubble">
        <div>{item.message}</div>
        {item.products?.length > 0 && (
          <div className="sw-chat-products">
            {item.products.map(product => (
              <div className="sw-chat-product" key={product.id || product._id}>
                <span className="sw-chat-product-emoji">{product.emoji || '📦'}</span>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.vendor || product.companyName || product.vendorName || product.category} · ₹{Number(product.price || 0).toLocaleString('en-IN')}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chatbot() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const endRef = useRef(null)

  const suggestions = user?.role === 'vendor' ? vendorSuggestions : retailerSuggestions

  useEffect(() => {
    if (!user || !open) return
    api.get('/chatbot/history')
      .then(({ data }) => setMessages(data.length ? data.map(item => ({ sender: item.sender, message: item.message })) : [{ sender: 'assistant', message: welcome }]))
      .catch(() => setMessages([{ sender: 'assistant', message: welcome }]))
  }, [user, open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!user) return null

  const send = async (value = input) => {
    const message = value.trim()
    if (!message || loading) return
    setInput('')
    setMessages(current => [...current, { sender: 'user', message }])
    setLoading(true)
    try {
      const { data } = await api.post('/chatbot/message', { message })
      setMessages(current => [...current, { sender: 'assistant', message: data.response, products: data.products }])
    } catch (error) {
      setMessages(current => [...current, { sender: 'assistant', message: error.response?.data?.message || 'I could not reach the assistant. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const clear = async () => {
    try {
      await api.delete('/chatbot/history')
      setMessages([{ sender: 'assistant', message: welcome }])
    } catch {
      setMessages(current => [...current, { sender: 'assistant', message: 'Unable to clear chat history right now.' }])
    }
  }

  return (
    <div className={`sw-chat ${open ? 'sw-chat-open' : ''} ${minimized ? 'sw-chat-min' : ''}`}>
      {open && (
        <section className="sw-chat-window" aria-label="Swippo AI assistant">
          <header className="sw-chat-header">
            <div><span className="sw-chat-header-icon">🤖</span><div><strong>Swippo AI</strong><small>Online assistant</small></div></div>
            <div className="sw-chat-header-actions">
              <button onClick={() => setMinimized(value => !value)} aria-label="Minimize chat">—</button>
              <button onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </div>
          </header>
          {!minimized && (
            <>
              <div className="sw-chat-body">
                {messages.map((item, index) => <Message item={item} key={`${item.sender}-${index}`} />)}
                {loading && <div className="sw-chat-typing"><span/><span/><span/> Thinking...</div>}
                <div ref={endRef} />
              </div>
              <div className="sw-chat-suggestions">
                {suggestions.map(suggestion => <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
              </div>
              <form className="sw-chat-form" onSubmit={event => { event.preventDefault(); send() }}>
                <input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask Swippo AI..." maxLength={500} />
                <button type="submit" disabled={!input.trim() || loading} aria-label="Send message">➤</button>
              </form>
              <button className="sw-chat-clear" onClick={clear}>Clear chat history</button>
            </>
          )}
        </section>
      )}
      {!open && <button className="sw-chat-launcher" onClick={() => { setOpen(true); setMinimized(false) }} aria-label="Open Swippo AI">🤖<span>Swippo AI</span></button>}
    </div>
  )
}
