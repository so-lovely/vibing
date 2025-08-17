import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { Footer } from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { PurchaseProvider } from './contexts/PurchaseContext';
import { PhoneVerificationProvider } from './contexts/PhoneVerificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProductsPage } from './pages/ProductsPage';
import { PurchasePage } from './pages/PurchasePage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { ProductDescriptionPage } from './pages/ProductDescriptionPage';
import { SellPage } from './pages/SellPage';
import { AdminPage } from './pages/AdminPage';
import { PhoneVerificationPage } from './pages/PhoneVerificationPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatWidget } from './components/chat/ChatWidget';

export default function App() {
  useEffect(() => {
    // Set dark theme as default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <ProductsProvider>
        <PurchaseProvider>
          <PhoneVerificationProvider>
            <ChatProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Header />
                
                <Routes>
                  <Route path="/" element={
                    <main>
                      <HeroSection />
                      <ProductsPage />
                    </main>
                  } />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/categories" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDescriptionPage />} />
                  <Route path="/purchase/:id" element={<PurchasePage />} />
                  <Route path="/purchases" element={<PurchaseHistoryPage />} />
                  <Route path="/sell" element={<SellPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/verify-phone" element={<PhoneVerificationPage />} />
                </Routes>
                
                <Footer />
                <ChatWidget />
              </div>
            </Router>
            </ChatProvider>
          </PhoneVerificationProvider>
        </PurchaseProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}