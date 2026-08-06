import React from 'react';
import { Scissors, Calendar, ShieldCheck, MapPin, Clock } from 'lucide-react';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBooking, onOpenAdmin }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-dark-900/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-[1px] shadow-glow-gold flex items-center justify-center">
            <div className="w-full h-full bg-dark-900 rounded-[11px] flex items-center justify-center">
              <Scissors className="w-6 h-6 text-gold-400 -rotate-45" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight font-sans text-white block leading-tight">
              BARBEARIA <span className="text-gold-400 font-extrabold">ROYAL</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-medium">
              Estilo & Tradição
            </span>
          </div>
        </div>

        {/* Status Badge & Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex items-center space-x-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Aberto Hoje (09h - 20h)</span>
          </div>

          <nav className="flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#servicos" className="hover:text-gold-400 transition-colors">Serviços</a>
            <a href="#localizacao" className="hover:text-gold-400 transition-colors flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <span>Localização</span>
            </a>
          </nav>
        </div>

        {/* CTAs */}
        <div className="flex items-center space-x-3">


          {/* Main Booking Button */}
          <button
            onClick={onOpenBooking}
            className="group relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm text-dark-900 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 hover:from-gold-300 hover:to-gold-500 transition-all duration-300 shadow-glow-gold hover:shadow-glow-amber transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            <span>Agendar Horário</span>
          </button>
        </div>
      </div>
    </header>
  );
};
