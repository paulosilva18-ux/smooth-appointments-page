import React from 'react';
import { Calendar, ShieldCheck, Clock, Star, Zap, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBooking }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20 px-4">
      {/* Background Image with Dark Vignette Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero.png"
          alt="Barbearia Ambientes"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.4] saturate-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-dark-900/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        
        {/* Subtitle pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card border border-gold-500/30 text-gold-400 text-xs sm:text-sm font-semibold tracking-wide uppercase animate-fade-in shadow-glow-gold">
          <Zap className="w-4 h-4 fill-gold-400 text-gold-400" />
          <span>Agendamento Direto em Menos de 1 Minuto</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
          Elegância, Precisão & <br />
          <span className="text-gradient-gold">O Seu Horário Garantido</span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
          Escolha seu serviço, selecione o dia e horário ideal com poucos cliques. Sem necessidade de criar cadastros longos.
        </p>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-dark-900 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 hover:from-gold-300 hover:to-gold-500 transition-all duration-300 shadow-glow-amber hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            <span>AGENDAR HORÁRIO AGORA</span>
          </button>
          
          <a
            href="#servicos"
            className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-sm text-slate-200 glass-card hover:bg-white/10 transition-all flex items-center justify-center space-x-2 border border-white/10"
          >
            <span>Ver Tabela de Serviços</span>
          </a>
        </div>

        {/* Benefits Badges */}
        <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="glass-card p-4 rounded-xl flex items-center space-x-3 border border-white/5">
            <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Sem Cadastros</h4>
              <p className="text-xs text-slate-400">Apenas Nome e WhatsApp</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center space-x-3 border border-white/5">
            <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Horários em Tempo Real</h4>
              <p className="text-xs text-slate-400">Sem conflitos na agenda</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center space-x-3 border border-white/5">
            <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-400">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Atendimento VIP</h4>
              <p className="text-xs text-slate-400">Bebida cortesia e conforto</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
