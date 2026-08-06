import React from 'react';
import { MapPin, Phone, Clock, Scissors, Instagram, MessageSquare, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="localizacao" className="bg-dark-900 border-t border-white/10 pt-16 pb-12 px-4 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand & About */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              BARBEARIA <span className="text-gold-400">ROYAL</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Cortes modernos, barboterapia tradicional e um ambiente exclusivo feito para o seu bem-estar.
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-gold-500/20 text-slate-300 hover:text-gold-400 transition-all border border-white/5"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://wa.me/5581987563348"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-all border border-white/5"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Business Hours */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>Funcionamento</span>
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>Terça a Quinta:</span>
              <span className="font-semibold text-slate-200">09:00 às 20:00</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>Sexta-feira:</span>
              <span className="font-semibold text-slate-200">09:00 às 20:00</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>Sábado:</span>
              <span className="font-semibold text-slate-200">08:00 às 19:00</span>
            </li>
            <li className="flex justify-between text-slate-500">
              <span>Domingo e Segunda:</span>
              <span>Fechado</span>
            </li>
          </ul>
        </div>

        {/* Location & Map Link */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gold-400" />
            <span>Endereço</span>
          </h4>
          <p className="text-xs leading-relaxed">
            Av. Paulista, 1500 - Bela Vista<br />
            São Paulo - SP, 01310-200
          </p>
          <a
            href="https://maps.google.com/?q=Av.+Paulista,+1500+-+Bela+Vista,+São+Paulo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-gold-400 font-bold hover:underline pt-1"
          >
            <span>Ver no Google Maps</span>
            <MapPin className="w-3 h-3" />
          </a>
        </div>

        {/* Cancellation Policy */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-gold-400" />
            <span>Avisos Importantes</span>
          </h4>
          <div className="p-3 rounded-xl bg-dark-800 border border-white/10 text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-gold-400 mb-1">Política de Cancelamento:</p>
            Pedimos a gentileza de avisar via WhatsApp com pelo menos 2h de antecedência caso ocorra algum imprevisto.
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <span>© {new Date().getFullYear()} Barbearia Royal. Todos os direitos reservados.</span>
        <span>Desenvolvido com tecnologia Supabase & Design Lovable</span>
      </div>
    </footer>
  );
};
