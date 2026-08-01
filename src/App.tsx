import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { BookingModal } from './components/BookingModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { Service } from './types';
import { getServices, isSupabaseConfigured } from './lib/supabase';
import { Database, CheckCircle2, Sparkles } from 'lucide-react';

export function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  const handleOpenBookingWithService = (service: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleOpenBooking = () => {
    setSelectedService(services[0] || null);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-400">
      
      {/* Supabase Status Banner Indicator */}
      <div className="bg-dark-800 border-b border-white/5 py-1.5 px-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
        <Database className="w-3.5 h-3.5 text-gold-400" />
        <span>
          Backend Database: <strong className="text-white">{isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase (Modo Demo / LocalStorage Activo)'}</strong>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:inline text-emerald-400 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Pronto para uso</span>
        </span>
      </div>

      {/* Header */}
      <Header
        onOpenBooking={handleOpenBooking}
        onOpenAdmin={() => setIsAdminOpen(true)}
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

      {/* Barber Admin Panel */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

    </div>
  );
}

export default App;
