import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle, XCircle, MessageSquare, RefreshCw, Filter, DollarSign, ShieldAlert } from 'lucide-react';
import { Booking } from '../types';
import { getBookings, updateBookingStatus } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    await updateBookingStatus(id, newStatus);
    loadData();
  };

  const handleSendReminder = (booking: Booking) => {
    const cleanPhone = booking.client_phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `👋 *Olá ${booking.client_name}!* Passando para lembrar do seu agendamento na *Barbearia Royal* hoje às *${booking.booking_time}* (${booking.service_title}). Te esperamos!`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const dateMatches = !selectedDateFilter || b.booking_date === selectedDateFilter;
    const statusMatches = statusFilter === 'all' || b.status === statusFilter;
    return dateMatches && statusMatches;
  });

  // Calculate daily stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.booking_date === todayStr && b.status !== 'cancelled');
  const todayTotalCount = todayBookings.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Painel do Barbeiro</h3>
              <span className="text-xs text-slate-400">Gestão de Agendamentos & Supabase Data</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="p-2 rounded-lg text-slate-400 hover:text-gold-400 hover:bg-white/5 transition-colors"
              title="Atualizar Agenda"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="p-6 bg-dark-900/50 border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Agendamentos Hoje ({todayStr})</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{todayTotalCount} Clientes</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Status da Conexão</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Supabase / Cache Ativo</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-dark-900/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar por Data:</span>
            </div>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Bookings Table / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhum agendamento encontrado para os filtros selecionados.
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Client & Service Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{booking.client_name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        booking.status === 'confirmed'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : booking.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center space-x-3">
                    <span className="font-semibold text-gold-400">{booking.service_title}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{booking.booking_date} às {booking.booking_time}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{booking.client_phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <button
                    onClick={() => handleSendReminder(booking)}
                    title="Enviar lembrete via WhatsApp"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Lembrete</span>
                  </button>

                  {booking.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      title="Marcar como Concluído"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {booking.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'cancelled')}
                      title="Cancelar Agendamento"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
