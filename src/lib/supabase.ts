import { createClient } from '@supabase/supabase-js';
import { Service, Booking, Barber } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-supabase-url.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Barbeiros Padrão da Barbearia
export const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'barber-fabricio',
    name: 'Fabrício',
    email: 'fabricio@barbearia.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '(81) 98756-3348',
    bio: 'Especialista em Degradê Moderno e Visagismo Masculino.'
  },
  {
    id: 'barber-victor',
    name: 'Victor Paz',
    email: 'victorpaz@barbearia.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    phone: '(81) 99887-1122',
    bio: 'Mestre em Barba Clássica, Toalha Quente e Pigmentação.'
  }
];

// Serviços Padrão
export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv-corte',
    title: 'Corte de Cabelo',
    description: 'Corte tradicional ou moderno (máquina/tesoura) finalizado com lavagem e pomada modeladora.',
    price: 45,
    duration_min: 30,
    image_url: '/images/corte_cabelo.png',
    active: true
  },
  {
    id: 'srv-combo',
    title: 'Corte + Barba',
    description: 'Combo completo de corte de cabelo e alinhamento de barba com terapia de toalha morna.',
    price: 80,
    duration_min: 60,
    image_url: '/images/corte_barba.png',
    active: true
  },
  {
    id: 'srv-pigmentacao',
    title: 'Pigmentação',
    description: 'Disfarce ou preenchimento natural de falhas no cabelo ou na barba com técnica de degradê.',
    price: 55,
    duration_min: 45,
    image_url: '/images/pigmentacao.png',
    active: true
  },
  {
    id: 'srv-toalha',
    title: 'Toalha Quente',
    description: 'Relaxamento facial, esfoliação leve e preparo térmico dos poros para um barbear impecável.',
    price: 40,
    duration_min: 30,
    image_url: '/images/toalha_quente.png',
    active: true
  }
];

const LOCAL_STORAGE_BOOKINGS_KEY = 'barbearia_bookings_v2';

// Gera dados mockados de teste realistas para Fabrício e Victor Paz
export function getSampleBookings(): Booking[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Datas recentes para relatório semanal/mensal
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

  return [
    // --- Fabrício ---
    {
      id: 'bkg-fab-01',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Lucas Andrade',
      client_phone: '(81) 99123-4567',
      booking_date: todayStr,
      booking_time: '09:00',
      status: 'completed',
      price: 80,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      notes: 'Preferência por degradê navalhado',
      created_at: new Date(today.getTime() - 100000).toISOString()
    },
    {
      id: 'bkg-fab-02',
      service_id: 'srv-corte',
      service_title: 'Corte de Cabelo',
      client_name: 'Gabriel Menezes',
      client_phone: '(81) 98877-6655',
      booking_date: todayStr,
      booking_time: '10:30',
      status: 'in_progress',
      price: 45,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      notes: 'Manter a parte de cima mais alta',
      created_at: new Date(today.getTime() - 80000).toISOString()
    },
    {
      id: 'bkg-fab-03',
      service_id: 'srv-pigmentacao',
      service_title: 'Pigmentação',
      client_name: 'Matheus Silva',
      client_phone: '(81) 97766-5544',
      booking_date: todayStr,
      booking_time: '14:00',
      status: 'confirmed',
      price: 55,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      notes: 'Primeira vez no salão',
      created_at: new Date(today.getTime() - 50000).toISOString()
    },
    {
      id: 'bkg-fab-04',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Rodrigo Alves',
      client_phone: '(81) 96655-4433',
      booking_date: todayStr,
      booking_time: '16:00',
      status: 'confirmed',
      price: 80,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      created_at: new Date(today.getTime() - 30000).toISOString()
    },
    {
      id: 'bkg-fab-05',
      service_id: 'srv-corte',
      service_title: 'Corte de Cabelo',
      client_name: 'Felipe Santos',
      client_phone: '(81) 95544-3322',
      booking_date: yesterdayStr,
      booking_time: '11:00',
      status: 'completed',
      price: 45,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      created_at: new Date(yesterday.getTime()).toISOString()
    },
    {
      id: 'bkg-fab-06',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Eduardo Costa',
      client_phone: '(81) 94433-2211',
      booking_date: threeDaysAgoStr,
      booking_time: '15:30',
      status: 'completed',
      price: 80,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      created_at: new Date(threeDaysAgo.getTime()).toISOString()
    },
    {
      id: 'bkg-fab-07',
      service_id: 'srv-toalha',
      service_title: 'Toalha Quente',
      client_name: 'Thiago Oliveira',
      client_phone: '(81) 93322-1100',
      booking_date: fiveDaysAgoStr,
      booking_time: '17:00',
      status: 'completed',
      price: 40,
      barber_id: 'barber-fabricio',
      barber_name: 'Fabrício',
      created_at: new Date(fiveDaysAgo.getTime()).toISOString()
    },

    // --- Victor Paz ---
    {
      id: 'bkg-vic-01',
      service_id: 'srv-toalha',
      service_title: 'Toalha Quente',
      client_name: 'Bruno Ramos',
      client_phone: '(81) 92211-0099',
      booking_date: todayStr,
      booking_time: '09:30',
      status: 'completed',
      price: 40,
      barber_id: 'barber-victor',
      barber_name: 'Victor Paz',
      notes: 'Pele sensível',
      created_at: new Date(today.getTime() - 95000).toISOString()
    },
    {
      id: 'bkg-vic-02',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Daniel Figueiredo',
      client_phone: '(81) 91100-9988',
      booking_date: todayStr,
      booking_time: '11:00',
      status: 'confirmed',
      price: 80,
      barber_id: 'barber-victor',
      barber_name: 'Victor Paz',
      created_at: new Date(today.getTime() - 70000).toISOString()
    },
    {
      id: 'bkg-vic-03',
      service_id: 'srv-corte',
      service_title: 'Corte de Cabelo',
      client_name: 'Alexandre Souza',
      client_phone: '(81) 90099-8877',
      booking_date: todayStr,
      booking_time: '15:00',
      status: 'confirmed',
      price: 45,
      barber_id: 'barber-victor',
      barber_name: 'Victor Paz',
      created_at: new Date(today.getTime() - 40000).toISOString()
    },
    {
      id: 'bkg-vic-04',
      service_id: 'srv-pigmentacao',
      service_title: 'Pigmentação',
      client_name: 'Renato Lima',
      client_phone: '(81) 98989-7777',
      booking_date: yesterdayStr,
      booking_time: '14:30',
      status: 'completed',
      price: 55,
      barber_id: 'barber-victor',
      barber_name: 'Victor Paz',
      created_at: new Date(yesterday.getTime()).toISOString()
    },
    {
      id: 'bkg-vic-05',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Caio Martins',
      client_phone: '(81) 97878-6666',
      booking_date: threeDaysAgoStr,
      booking_time: '10:00',
      status: 'completed',
      price: 80,
      barber_id: 'barber-victor',
      barber_name: 'Victor Paz',
      created_at: new Date(threeDaysAgo.getTime()).toISOString()
    }
  ];
}

// Fetch all barbers
export async function getBarbers(): Promise<Barber[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('barbers').select('*');
      if (!error && data && data.length > 0) return data as Barber[];
    } catch (e) {
      console.warn('Supabase fetch barbers failed, fallback to default barbers:', e);
    }
  }
  return DEFAULT_BARBERS;
}

// Fetch all services
export async function getServices(): Promise<Service[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('active', true);
      if (!error && data && data.length > 0) return data as Service[];
    } catch (e) {
      console.warn('Supabase fetch services failed, fallback to defaults:', e);
    }
  }
  return DEFAULT_SERVICES;
}

// Fetch all bookings (com suporte a filtro por barbeiro / RLS)
export async function getBookings(barberId?: string): Promise<Booking[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (barberId && barberId !== 'all') {
        query = query.eq('barber_id', barberId);
      }

      const { data, error } = await query;
      if (!error && data) return data as Booking[];
    } catch (e) {
      console.warn('Supabase fetch bookings failed, fallback to localStorage/mock:', e);
    }
  }

  // LocalStorage / Mock Fallback
  const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
  let list: Booking[] = [];
  if (!stored) {
    list = getSampleBookings();
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(list));
    } catch (_) {}
  } else {
    try {
      list = JSON.parse(stored);
    } catch {
      list = getSampleBookings();
    }
  }

  if (barberId && barberId !== 'all') {
    return list.filter((b) => b.barber_id === barberId);
  }
  return list;
}

// Create a new booking
export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'status'>
): Promise<Booking> {
  const barberName = booking.barber_name || (booking.barber_id === 'barber-victor' ? 'Victor Paz' : 'Fabrício');
  const barberId = booking.barber_id || 'barber-fabricio';

  const newBooking: Booking = {
    ...booking,
    id: 'bkg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    status: 'confirmed',
    price: booking.price || 45,
    barber_id: barberId,
    barber_name: barberName,
    created_at: new Date().toISOString()
  };

  // Try Supabase first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            service_id: booking.service_id,
            service_title: booking.service_title,
            client_name: booking.client_name,
            client_phone: booking.client_phone,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            notes: booking.notes || '',
            status: 'confirmed',
            price: newBooking.price,
            barber_id: newBooking.barber_id,
            barber_name: newBooking.barber_name
          }
        ])
        .select()
        .single();

      if (!error && data) {
        console.log('Booking saved to Supabase:', data.id);
        return data as Booking;
      }
      if (error) console.warn('Supabase insert error:', error.message);
    } catch (e) {
      console.warn('Supabase insert exception, fallback to local:', e);
    }
  }

  // Fallback LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    const existing: Booking[] = raw ? JSON.parse(raw) : getSampleBookings();
    const updated = [newBooking, ...existing];
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    console.log('Booking saved to localStorage:', newBooking.id);
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  return newBooking;
}

// Update booking status
export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase update status failed:', e);
    }
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    const existing: Booking[] = stored ? JSON.parse(stored) : getSampleBookings();
    const updated = existing.map((b) => (b.id === id ? { ...b, status } : b));
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage status update failed:', e);
  }
  return true;
}

// Delete booking
export async function deleteBooking(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    const existing: Booking[] = stored ? JSON.parse(stored) : getSampleBookings();
    const updated = existing.filter((b) => b.id !== id);
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage delete failed:', e);
  }
  return true;
}

// Subscribe to realtime booking updates
export function subscribeToBookings(onBookingChange: (payload: any) => void) {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          onBookingChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback storage listener for local changes
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_BOOKINGS_KEY) {
      onBookingChange({ eventType: 'LOCAL_CHANGE' });
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
