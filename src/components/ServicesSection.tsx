import React from 'react';
import { Clock, Scissors, Sparkles, Flame, Check } from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onSelectService }) => {
  return (
    <section id="servicos" className="py-24 px-4 max-w-7xl mx-auto relative">
      
      {/* Section Header */}
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 text-gold-400 text-xs font-extrabold uppercase tracking-widest bg-gold-500/10 px-3.5 py-1.5 rounded-full border border-gold-500/20">
          <Scissors className="w-3.5 h-3.5" />
          <span>Menu de Serviços</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Nossos Serviços Exclusivos
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-base">
          Escolha o tratamento ideal para o seu visual. Todos os serviços incluem atendimento personalizado e produtos de alta qualidade.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="group glass-card rounded-2xl overflow-hidden glass-card-hover flex flex-col justify-between border border-white/10"
          >
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-dark-800">
              <img
                src={service.image_url}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>
              
              {/* Duration badge */}
              <div className="absolute top-3 right-3 bg-dark-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-200 border border-white/10 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gold-400" />
                <span>{service.duration_min} min</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Valor</span>
                  <span className="text-2xl font-extrabold text-white">
                    R$ {service.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={() => onSelectService(service)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-dark-900 bg-gold-400 hover:bg-gold-300 transition-all duration-200 shadow-glow-gold flex items-center space-x-1"
                >
                  <span>Agendar</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
