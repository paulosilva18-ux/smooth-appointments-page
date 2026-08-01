export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_min: number;
  image_url: string;
  active?: boolean;
}

export interface Booking {
  id: string;
  service_id: string;
  service_title: string;
  client_name: string;
  client_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface BusinessHour {
  id: number;
  day_of_week: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_open: boolean;
}
