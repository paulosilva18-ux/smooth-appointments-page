import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  KeyRound,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  MessageSquare,
  RefreshCw,
  Filter,
  DollarSign,
  Search,
  BellRing,
  Activity,
  Trash2,
  Lock,
  ArrowLeft,
  SlidersHorizontal,
  Scissors,
  Check,
  TrendingUp
} from 'lucide-react';
import { Booking, Service } from '../types';
import { getBookings, updateBookingStatus, deleteBooking, subscribeToBookings, getServices } from '../lib/supabase';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('admin_authenticated') === 'true'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Dashboard Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'services' | 'logs'>('agenda');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Realtime Notifications & Logs State
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<
    Array<{ id: string; time: string; text: string; type: 'new' | 'update' | 'delete' }>
  >([]);

  // Web Audio Synth for Notification Sound
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio notification fallback:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, servicesData] = await Promise.all([getBookings(), getServices()]);
      setBookings(bookingsData);
      setServices(servicesData);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Realtime Listener Setup
  useEffect(() => {
    if (!isAuthenticated) return;

    loadData();

    // Subscribe to realtime database changes
    const unsubscribe = subscribeToBookings((payload) => {
      console.log('Realtime change payload:', payload);

      // Play sound alert for new booking
      playNotificationSound();

      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      let message = 'Nova atividade detectada na agenda!';

      if (payload?.new?.client_name) {
        message = `🔔 Novo agendamento: ${payload.new.client_name} (${payload.new.service_title} às ${payload.new.booking_time})`;
      }

      setNotificationToast(message);
      setTimeout(() => setNotificationToast(null), 6000);

      // Add to activity logs
      setActivityLogs((prev) => [
        {
          id: Math.random().toString(),
          time: timeStr,
          text: message,
          type: payload?.eventType === 'INSERT' ? 'new' : 'update'
        },
        ...prev.slice(0, 19)
      ]);

      // Reload fresh list
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  // Handle PIN Auth
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  // Actions
  const handleStatusChange = async (id: string, status: Booking['status']) => {
    await updateBookingStatus(id, status);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este agendamento?')) {
      await deleteBooking(id);
      loadData();
    }
  };

  const handleSendReminder = (booking: Booking) => {
    const cleanPhone = booking.client_phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `👋 *Olá ${booking.client_name}!* Passando para lembrar do seu agendamento na *Barbearia Royal* hoje às *${booking.booking_time}* (${booking.service_title}). Qualquer dúvida, estamos à disposição!`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // Filtered Bookings Logic — ordena por data e hora, mostra todos por padrão
  const filteredBookings = bookings
    .filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.client_phone.includes(searchQuery);
      const matchesDate = !dateFilter || b.booking_date === dateFilter;
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.booking_date + 'T' + a.booking_time;
      const dateB = b.booking_date + 'T' + b.booking_time;
      return dateA.localeCompare(dateB);
    });

  // Calculate Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.booking_date === todayStr && b.status !== 'cancelled');
  const todayRevenue = todayBookings.reduce((sum, b) => {
    const srv = services.find((s) => s.id === b.service_id || s.title === b.service_title);
    return sum + (srv ? srv.price : 45);
  }, 0);
  const pendingCount = bookings.filter((b) => b.status === 'confirmed').length;

  // Render PIN Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-center animate-fade-in">
          
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 flex items-center justify-center mx-auto shadow-glow-gold">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Painel Administrativo</h2>
            <p className="text-xs text-slate-400">
              Digite o PIN de acesso de administrador para gerenciar o sistema da barbearia.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                placeholder="PIN de Acesso (Padrão: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className={`w-full text-center tracking-widest text-lg font-bold py-3 px-4 rounded-xl bg-dark-900 border text-white placeholder-slate-500 focus:outline-none ${
                  pinError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus:border-gold-400'
                }`}
              />
              {pinError && <span className="text-xs text-rose-400 font-bold block mt-1">PIN incorreto! Tente 1234.</span>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm text-dark-900 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 transition-all shadow-glow-gold"
            >
              Acessar Painel Remoto
            </button>
          </form>

          <button
            onClick={onBackToSite}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Website do Cliente</span>
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-400">
      
      {/* Realtime Toast Alert */}
      {notificationToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-gold-500 text-dark-900 font-extrabold px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in border border-amber-300">
          <BellRing className="w-5 h-5 animate-bounce flex-shrink-0" />
          <span className="text-xs leading-tight">{notificationToast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-dark-800/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white leading-tight">Painel de Gestão Remota</h1>
                <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Monitorando Ao Vivo</span>
                </span>
              </div>
              <span className="text-xs text-slate-400">Barbearia Royal • Monitoramento & Supabase Realtime</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToSite}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Site do Cliente</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
            >
              Sair
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        
        {/* Realtime Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Agendamentos Hoje</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{todayBookings.length}</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">Para {todayStr}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Faturamento Estimado</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
                R$ {todayRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Baseado nos cortes de hoje</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Aguardando Atendimento</span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{pendingCount}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Horários reservados</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status da Rede</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-1 block flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Supabase Conectado</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Atualização Instantânea</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
              activeTab === 'agenda'
                ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                : 'bg-dark-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda ao Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 relative ${
              activeTab === 'logs'
                ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                : 'bg-dark-800 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Feed de Atividades ({activityLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: AGENDA MANAGER */}
        {activeTab === 'agenda' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Search & Filter Bar */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Data:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-gold-400"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="completed">Concluídos</option>
                    <option value="cancelled">Cancelados</option>
                  </select>
                </div>

                <button
                  onClick={loadData}
                  title="Atualizar Dados"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-gold-500/10 text-slate-300 hover:text-gold-400 transition-colors border border-white/5"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

            </div>

            {/* Bookings List */}
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-2xl border border-white/10 text-slate-500 text-sm">
                  Nenhum agendamento encontrado para o filtro selecionado.
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const today = new Date().toISOString().split('T')[0];
                  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                  const dateLabel =
                    b.booking_date === today ? { text: 'HOJE', cls: 'bg-gold-500/20 text-gold-400 border-gold-500/40' }
                    : b.booking_date === tomorrow ? { text: 'AMANHÃ', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' }
                    : { text: b.booking_date, cls: 'bg-white/5 text-slate-400 border-white/10' };

                  return (
                  <div
                    key={b.id}
                    className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card-hover"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                        <span className="text-base font-bold text-white">{b.client_name}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${
                            b.status === 'confirmed'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : b.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {b.status === 'confirmed' ? 'Confirmado' : b.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${dateLabel.cls}`}>
                          {dateLabel.text}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-gold-400">{b.service_title}</span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-gold-400" />
                          <span>{b.booking_date}</span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center space-x-1 text-slate-300 font-bold">
                          <Clock className="w-3.5 h-3.5 text-gold-400" />
                          <span>{b.booking_time}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.client_phone}</span>
                        {b.notes && <span className="text-slate-500 italic ml-2">"{b.notes}"</span>}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-0 border-white/5">
                      <button
                        onClick={() => handleSendReminder(b)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all flex items-center space-x-1.5 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {b.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'completed')}
                          title="Concluir Atendimento"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-white/5 transition-all flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      )}

                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'cancelled')}
                          title="Cancelar"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Excluir"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* TAB 2: REALTIME LOGS */}
        {activeTab === 'logs' && (
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gold-400" />
              <span>Log de Atividades Monitoradas ao Vivo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cada nova reserva realizada no site por qualquer cliente dispara uma atualização imediata nesta lista.
            </p>

            <div className="space-y-2 pt-2">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma atividade registrada ainda nesta sessão. Faça um agendamento no site para ver o evento ao vivo!
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-dark-900/60 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-500 font-mono">{log.time}</span>
                      <span className="text-slate-200 font-semibold">{log.text}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      Realtime
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
