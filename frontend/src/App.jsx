import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import TrackOrderPage from './pages/TrackOrderPage'
import OrdersPage from './pages/OrdersPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AccountPage from './pages/AccountPage'
import WishlistPage from './pages/WishlistPage'
import StaticPage from './pages/StaticPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCoupons from './pages/admin/AdminCoupons'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="catalogue" element={<CataloguePage />} />
                  <Route path="product/:id" element={<ProductDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-confirmation/:orderRef" element={<OrderConfirmationPage />} />
                  <Route path="track" element={<TrackOrderPage />} />
                  <Route path="track/:orderRef" element={<TrackOrderPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="about" element={<StaticPage pageKey="about" />} />
                  <Route path="contact" element={<StaticPage pageKey="contact" />} />
                  <Route path="faqs" element={<StaticPage pageKey="faqs" />} />
                  <Route path="shipping" element={<StaticPage pageKey="shipping" />} />
                  <Route path="returns" element={<StaticPage pageKey="returns" />} />
                  <Route path="privacy" element={<StaticPage pageKey="privacy" />} />
                  <Route path="terms" element={<StaticPage pageKey="terms" />} />
                </Route>

                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
