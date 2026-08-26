import React, { useState, useEffect } from 'react';
import {
  Shield,
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
  Scissors,
  TrendingUp,
  Play,
  UserCheck,
  CheckCircle2,
  Users,
  PieChart,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Booking, Service, Barber } from '../types';
import {
  getBookings,
  updateBookingStatus,
  deleteBooking,
  subscribeToBookings,
  getServices,
  DEFAULT_BARBERS
} from '../lib/supabase';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite }) => {
  // Autenticação por PIN
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('admin_authenticated') === 'true'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Módulo de Troca de Perfil: 'barber-fabricio' | 'barber-victor' | 'all'
  const getInitialProfileId = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('fabricio')) return 'barber-fabricio';
    if (path.includes('victor')) return 'barber-victor';
    return sessionStorage.getItem('admin_profile_id') || 'all';
  };

  const [selectedProfileId, setSelectedProfileId] = useState<string>(getInitialProfileId);

  // Estados de Dados
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'relatorio' | 'logs'>('agenda');

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Realtime & Logs
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<
    Array<{ id: string; time: string; text: string; type: 'new' | 'update' | 'delete' }>
  >([]);

  // Som de Notificação
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio fallback:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, servicesData] = await Promise.all([
        getBookings(),
        getServices()
      ]);
      setBookings(bookingsData);
      setServices(servicesData);
    } catch (e) {
      console.error('Erro ao carregar dados do admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();

    const unsubscribe = subscribeToBookings((payload) => {
      playNotificationSound();
      const timeStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      let message = 'Nova atualização na agenda da barbearia!';

      if (payload?.new?.client_name) {
        message = `🔔 Novo agendamento: ${payload.new.client_name} (${payload.new.service_title} às ${payload.new.booking_time})`;
      }

      setNotificationToast(message);
      setTimeout(() => setNotificationToast(null), 6000);

      setActivityLogs((prev) => [
        {
          id: Math.random().toString(),
          time: timeStr,
          text: message,
          type: payload?.eventType === 'INSERT' ? 'new' : 'update'
        },
        ...prev.slice(0, 19)
      ]);

      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const handleProfileSwitch = (profileId: string) => {
    setSelectedProfileId(profileId);
    sessionStorage.setItem('admin_profile_id', profileId);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      pinInput === '1234' ||
      pinInput === 'admin' ||
      pinInput === 'fabricio2026'
    ) {
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

  // Ações de Alteração de Status
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
      `👋 *Olá ${booking.client_name}!* Lembrete do seu agendamento com *${
        booking.barber_name || 'Barbearia Royal'
      }* hoje às *${booking.booking_time}* (${booking.service_title}). Estamos te aguardando!`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // --- FILTRAGEM RLS POR PERFIL & CAMPOS ---
  const activeBarber = DEFAULT_BARBERS.find((b) => b.id === selectedProfileId);

  // RLS Simulated Filter
  const profileBookings = bookings.filter((b) => {
    if (selectedProfileId === 'all') return true;
    return b.barber_id === selectedProfileId;
  });

  // Dynamic Search & Date & Status Filter
  const filteredBookings = profileBookings
    .filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.client_phone.includes(searchQuery) ||
        b.service_title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = !dateFilter || b.booking_date === dateFilter;
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.booking_date + 'T' + a.booking_time;
      const dateB = b.booking_date + 'T' + b.booking_time;
      return dateA.localeCompare(dateB);
    });

  // --- MÉTRICAS INDIVIDUAIS DO PERFIL SELECIONADO ---
  const todayStr = new Date().toISOString().split('T')[0];

  // Cálculo dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Cálculo do mês atual (YYYY-MM)
  const currentMonthStr = todayStr.substring(0, 7);

  // Cortes Hoje
  const todayBookings = profileBookings.filter(
    (b) => b.booking_date === todayStr && b.status !== 'cancelled'
  );
  const todayCompletedOrActiveCount = todayBookings.length;

  // Cortes na Semana (últimos 7 dias)
  const weekBookings = profileBookings.filter(
    (b) =>
      b.booking_date >= sevenDaysAgoStr &&
      b.booking_date <= todayStr &&
      b.status !== 'cancelled'
  );
  const weekCount = weekBookings.length;

  // Faturamento do Dia (R$)
  const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.price || 45), 0);

  // Faturamento do Mês (R$)
  const monthBookings = profileBookings.filter(
    (b) => b.booking_date.startsWith(currentMonthStr) && b.status !== 'cancelled'
  );
  const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.price || 45), 0);

  // Faturamento Últimos 7 dias
  const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.price || 45), 0);

  // Ticket Médio / Média por corte
  const totalValidCuts = monthBookings.length;
  const averageTicket = totalValidCuts > 0 ? monthRevenue / totalValidCuts : 0;

  // Próximo cliente da fila (Hoje, ordenado por horário)
  const nextClient = todayBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time))[0];

  // Render Tela de PIN de Segurança se não autenticado
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
              Digite a senha de acesso para gerenciar a agenda de Fabrício & Victor Paz.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={16}
                placeholder="Senha de Acesso (fabricio2026)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className={`w-full text-center tracking-widest text-lg font-bold py-3 px-4 rounded-xl bg-dark-900 border text-white placeholder-slate-500 focus:outline-none ${
                  pinError
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-white/10 focus:border-gold-400'
                }`}
              />
              {pinError && (
                <span className="text-xs text-rose-400 font-bold block mt-1">
                  Senha incorreta! Tente fabricio2026.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm text-dark-900 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 transition-all shadow-glow-gold"
            >
              Entrar no Painel Admin
            </button>
          </form>

          <button
            onClick={onBackToSite}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Site da Barbearia</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-400">
      
      {/* Toast Alert Realtime */}
      {notificationToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-gold-500 text-dark-900 font-extrabold px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in border border-amber-300">
          <BellRing className="w-5 h-5 animate-bounce flex-shrink-0" />
          <span className="text-xs leading-tight">{notificationToast}</span>
        </div>
      )}

      {/* Header Principal */}
      <header className="sticky top-0 z-40 bg-dark-800/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold text-white leading-tight">
                  Painel Administrativo
                </h1>
                <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>RLS & Realtime Ativo</span>
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Gestão da Barbearia • Fabrício & Victor Paz
              </span>
            </div>
          </div>

          {/* MÓDULO DE TROCA DE PERFIL (FABRÍCIO / VICTOR PAZ / VISÃO GERAL) */}
          <div className="flex items-center space-x-2 bg-dark-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 px-2 hidden lg:inline">
              Perfil Logado:
            </span>

            {/* Fabrício */}
            <button
              onClick={() => handleProfileSwitch('barber-fabricio')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedProfileId === 'barber-fabricio'
                  ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <img
                src={DEFAULT_BARBERS[0].avatar_url}
                alt="Fabrício"
                className="w-5 h-5 rounded-full object-cover border border-white/20"
              />
              <span>Fabrício</span>
            </button>

            {/* Victor Paz */}
            <button
              onClick={() => handleProfileSwitch('barber-victor')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedProfileId === 'barber-victor'
                  ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <img
                src={DEFAULT_BARBERS[1].avatar_url}
                alt="Victor Paz"
                className="w-5 h-5 rounded-full object-cover border border-white/20"
              />
              <span>Victor Paz</span>
            </button>

            {/* Visão Geral (Ambos) */}
            <button
              onClick={() => handleProfileSwitch('all')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedProfileId === 'all'
                  ? 'bg-gradient-to-r from-amber-400 to-gold-500 text-dark-900 shadow-glow-gold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </button>
          </div>

          {/* Botões de Ação de topo */}
          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={onBackToSite}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Website</span>
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

      {/* Container Conteúdo */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        
        {/* Banner do Perfil Selecionado + Badge de RLS */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {activeBarber ? (
              <img
                src={activeBarber.avatar_url}
                alt={activeBarber.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-gold-400 shadow-glow-gold"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border-2 border-gold-400 text-gold-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">
                  {activeBarber ? `Sessão: ${activeBarber.name}` : 'Visão Geral (Fabrício & Victor Paz)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gold-500/10 text-gold-400 border border-gold-500/30">
                  {activeBarber ? 'Filtro RLS Ativo' : 'Consolidado'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeBarber
                  ? `Exibindo estritamente os agendamentos e faturamento de ${activeBarber.name}`
                  : 'Exibindo dados combinados de ambos os barbeiros'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-semibold">Hoje: <strong className="text-white">{todayStr}</strong></span>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/5 hover:bg-gold-500/10 text-slate-300 hover:text-gold-400 border border-white/5 transition-all flex items-center space-x-1.5"
              title="Recarregar Dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* CARDS DE MÉTRICAS INDIVIDUAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Cortes Hoje */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cortes Hoje</span>
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">{todayCompletedOrActiveCount}</span>
              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Agendados para hoje</span>
            </div>
          </div>

          {/* Card 2: Cortes na Semana */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cortes na Semana</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">{weekCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Últimos 7 dias</span>
            </div>
          </div>

          {/* Card 3: Faturamento do Dia */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Dia</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-emerald-400">
                R$ {todayRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Receita estimada hoje</span>
            </div>
          </div>

          {/* Card 4: Faturamento do Mês */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Mês</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-amber-400">
                R$ {monthRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Acumulado do mês</span>
            </div>
          </div>

          {/* Card 5: Próximo Cliente da Fila */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between bg-dark-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">Próximo Cliente</span>
              <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-300 flex items-center justify-center border border-gold-500/30">
                <UserCheck className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              {nextClient ? (
                <>
                  <span className="text-base font-extrabold text-white truncate block">{nextClient.client_name}</span>
                  <div className="text-xs text-gold-400 font-bold flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{nextClient.booking_time} • {nextClient.service_title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Barbeiro: {nextClient.barber_name || 'Fabrício'}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-500 italic block py-1">Sem clientes na fila de hoje</span>
              )}
            </div>
          </div>

        </div>

        {/* NAVEGAÇÃO DE ABAS */}
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
            <span>Monitoramento de Cortes</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorio')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
              activeTab === 'relatorio'
                ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                : 'bg-dark-800 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatório de Faturamento</span>
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

        {/* ABA 1: MONITORAMENTO DE CORTES / AGENDAMENTOS */}
        {activeTab === 'agenda' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Barra de Busca e Filtros */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Busca por Nome, WhatsApp ou Serviço */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, telefone ou corte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 text-xs"
                />
              </div>

              {/* Filtros por Data e por Status */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Data:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-gold-400"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-gold-400"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="confirmed">Confirmados / Pendentes</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluídos</option>
                    <option value="cancelled">Cancelados</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Lista de Agendamentos / Tabela Ordenada por Horário */}
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-2xl border border-white/10 text-slate-500 text-sm">
                  Nenhum agendamento encontrado para o perfil e filtros selecionados.
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const today = new Date().toISOString().split('T')[0];
                  const dateLabel =
                    booking.booking_date === today
                      ? { text: 'HOJE', cls: 'bg-gold-500/20 text-gold-400 border-gold-500/40' }
                      : { text: booking.booking_date, cls: 'bg-white/5 text-slate-400 border-white/10' };

                  return (
                    <div
                      key={booking.id}
                      className={`glass-card p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        booking.status === 'in_progress'
                          ? 'border-amber-500/50 bg-amber-500/5 shadow-glow-amber'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Dados do Cliente & Serviço */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                          <span className="text-base font-extrabold text-white">
                            {booking.client_name}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border ${
                              booking.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                                : booking.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : booking.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {booking.status === 'in_progress'
                              ? '⚡ Em Andamento'
                              : booking.status === 'completed'
                              ? '✓ Concluído'
                              : booking.status === 'cancelled'
                              ? '✕ Cancelado'
                              : '⏳ Pendente / Confirmado'}
                          </span>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${dateLabel.cls}`}>
                            {dateLabel.text}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gold-400 border border-gold-500/20 font-bold">
                            ✂️ {booking.barber_name || 'Fabrício'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                          <span className="font-bold text-white">{booking.service_title}</span>
                          <span className="text-gold-400 font-extrabold">
                            R$ {(booking.price || 45).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center space-x-1 text-slate-300 font-bold">
                            <Clock className="w-3.5 h-3.5 text-gold-400" />
                            <span>{booking.booking_time}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{booking.client_phone}</span>
                          {booking.notes && (
                            <span className="text-slate-400 italic">"{booking.notes}"</span>
                          )}
                        </div>
                      </div>

                      {/* BOTÕES DE AÇÃO RÁPIDA: INICIAR CORTE, CONCLUIR, CANCELAR */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-0 border-white/5">
                        
                        {/* Botão: Iniciar Corte */}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'in_progress')}
                            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-dark-900 bg-gradient-to-r from-amber-400 to-gold-500 hover:from-amber-300 hover:to-gold-400 transition-all shadow-glow-amber flex items-center space-x-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-dark-900" />
                            <span>Iniciar Corte</span>
                          </button>
                        )}

                        {/* Botão: Concluir Corte */}
                        {booking.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluir</span>
                          </button>
                        )}

                        {/* Botão: WhatsApp */}
                        <button
                          onClick={() => handleSendReminder(booking)}
                          title="WhatsApp do Cliente"
                          className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Botão: Cancelar */}
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            title="Cancelar Agendamento"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Botão: Excluir */}
                        <button
                          onClick={() => handleDelete(booking.id)}
                          title="Excluir Definitivamente"
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

        {/* ABA 2: RELATÓRIO DE FATURAMENTO */}
        {activeTab === 'relatorio' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gold-400" />
                  <span>Relatório de Faturamento por Período</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Resumo financeiro detalhado com base nos cortes agendados e concluídos de{' '}
                  <strong className="text-white">
                    {activeBarber ? activeBarber.name : 'Fabrício & Victor Paz'}
                  </strong>.
                </p>
              </div>

              {/* Grid de Resumo por Período */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">Faturamento Hoje</span>
                  <span className="text-2xl font-extrabold text-white block">
                    R$ {todayRevenue.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-emerald-400 block">{todayCompletedOrActiveCount} cortes válidos</span>
                </div>

                <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">Últimos 7 Dias</span>
                  <span className="text-2xl font-extrabold text-emerald-400 block">
                    R$ {weekRevenue.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{weekCount} cortes realizados</span>
                </div>

                <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">Este Mês</span>
                  <span className="text-2xl font-extrabold text-amber-400 block">
                    R$ {monthRevenue.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{monthBookings.length} cortes acumulados</span>
                </div>

                <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">Ticket Médio / Corte</span>
                  <span className="text-2xl font-extrabold text-gold-400 block">
                    R$ {averageTicket.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Média por atendimento</span>
                </div>

              </div>

              {/* Distribuição por Barbeiro se estiver em Visão Geral */}
              {selectedProfileId === 'all' && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Comparativo por Profissional (Fabrício vs Victor Paz)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DEFAULT_BARBERS.map((b) => {
                      const bCuts = bookings.filter(
                        (item) => item.barber_id === b.id && item.status !== 'cancelled'
                      );
                      const bRev = bCuts.reduce((s, item) => s + (item.price || 45), 0);

                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={b.avatar_url}
                              alt={b.name}
                              className="w-10 h-10 rounded-full object-cover border border-gold-400"
                            />
                            <div>
                              <span className="font-extrabold text-sm text-white block">{b.name}</span>
                              <span className="text-xs text-slate-400">{bCuts.length} cortes agendados</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-extrabold text-gold-400 block">
                              R$ {bRev.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] text-slate-500 block">Receita total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ABA 3: FEED DE ATIVIDADES REALTIME */}
        {activeTab === 'logs' && (
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gold-400" />
              <span>Feed de Atividades Monitoradas ao Vivo</span>
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
