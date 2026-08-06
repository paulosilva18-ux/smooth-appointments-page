import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { BookingModal } from './components/BookingModal';
import { Footer } from './components/Footer';
import { AdminDashboard } from './pages/AdminDashboard';
import { Service } from './types';
import { getServices, isSupabaseConfigured } from './lib/supabase';
import { Database, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [hostname, setHostname] = useState<string>(window.location.hostname);
  const [services, setServices] = useState<Service[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    getServices().then(setServices);

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setHostname(window.location.hostname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBookingWithService = (service: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleOpenBooking = () => {
    setSelectedService(services[0] || null);
    setIsBookingOpen(true);
  };

  // Detect if path starts with /admin or hostname contains admin
  const isAdminDomainOrPath =
    hostname.includes('admin') || currentPath.startsWith('/admin');

  if (isAdminDomainOrPath) {
    return (
      <AdminDashboard
        onBackToSite={() => {
          navigateTo('/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-400">
      


      {/* Header */}
      <Header
        onOpenBooking={handleOpenBooking}
        onOpenAdmin={() => {
          navigateTo('/admin');
        }}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onOpenBooking={handleOpenBooking} />

        {/* Services Section */}
        <ServicesSection
          services={services}
          onSelectService={handleOpenBookingWithService}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* 4-Step Interactive Booking Wizard */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
        initialService={selectedService}
      />

    </div>
  );
}

export default App;
