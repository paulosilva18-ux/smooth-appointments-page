import { createClient } from '@supabase/supabase-js';
import { Service, Booking } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-url.supabase.co');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial Default Services
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

const LOCAL_STORAGE_BOOKINGS_KEY = 'barbearia_bookings_v1';

// Fetch all services
export async function getServices(): Promise<Service[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('active', true);
      if (!error && data && data.length > 0) return data as Service[];
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to defaults:', e);
    }
  }
  return DEFAULT_SERVICES;
}

// Fetch all bookings
export async function getBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true });
      if (!error && data) return data as Booking[];
    } catch (e) {
      console.warn('Supabase fetch bookings failed, fallback to localStorage:', e);
    }
  }
  
  // LocalStorage Fallback
  const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
  if (!stored) return getSampleBookings();
  try {
    return JSON.parse(stored);
  } catch {
    return getSampleBookings();
  }
}

// Create a new booking
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
  const newBooking: Booking = {
    ...booking,
    id: 'bkg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          service_id: booking.service_id,
          service_title: booking.service_title,
          client_name: booking.client_name,
          client_phone: booking.client_phone,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          notes: booking.notes || '',
          status: 'confirmed'
        }])
        .select()
        .single();

      if (!error && data) return data as Booking;
    } catch (e) {
      console.warn('Supabase insert failed, saving to localStorage:', e);
    }
  }

  // Save to LocalStorage
  const existing = await getBookings();
  const updated = [newBooking, ...existing];
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  return newBooking;
}

// Update booking status
export async function updateBookingStatus(id: string, status: Booking['status']): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  const existing = await getBookings();
  const updated = existing.map(b => b.id === id ? { ...b, status } : b);
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  return true;
}

function getSampleBookings(): Booking[] {
  const today = new Date().toISOString().split('T')[0];
  const sample: Booking[] = [
    {
      id: 'bkg-sample-1',
      service_id: 'srv-corte',
      service_title: 'Corte de Cabelo',
      client_name: 'Gabriel Mendonça',
      client_phone: '(11) 98765-4321',
      booking_date: today,
      booking_time: '10:00',
      status: 'confirmed',
      created_at: new Date().toISOString()
    },
    {
      id: 'bkg-sample-2',
      service_id: 'srv-combo',
      service_title: 'Corte + Barba',
      client_name: 'Mateus Oliveira',
      client_phone: '(11) 97123-8899',
      booking_date: today,
      booking_time: '14:30',
      status: 'confirmed',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(sample));
  return sample;
}
