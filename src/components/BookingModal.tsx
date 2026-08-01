import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle2, ArrowRight, ArrowLeft, Scissors, MessageSquare, AlertCircle } from 'lucide-react';
import { Service, Booking } from '../types';
import { createBooking, getBookings } from '../lib/supabase';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialService?: Service | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  initialService
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || services[0] || null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
  }, [initialService]);

  useEffect(() => {
    if (isOpen) {
      getBookings().then(setExistingBookings);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate available dates (next 14 days)
  const today = new Date();
  const availableDates = Array.from({ length: 14 }).map((_, index) => {
    const d = addDays(today, index);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: format(d, 'EEE', { locale: ptBR }),
      dayNumber: format(d, 'dd'),
      monthName: format(d, 'MMM', { locale: ptBR }),
      isSunday: d.getDay() === 0,
      isMonday: d.getDay() === 1,
    };
  });

  // Generate time slots (09:00 to 19:30 every 30 min)
  const generateSlots = () => {
    const slots: string[] = [];
    let hour = 9;
    let minute = 0;
    while (hour < 20) {
      const hStr = hour.toString().padStart(2, '0');
      const mStr = minute.toString().padStart(2, '0');
      slots.push(`${hStr}:${mStr}`);
      minute += 30;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }
    return slots;
  };

  const allSlots = generateSlots();

  // Check if a time slot is already booked for the selected date
  const isSlotBooked = (time: string) => {
    return existingBookings.some(
      (b) => b.booking_date === selectedDate && b.booking_time === time && b.status !== 'cancelled'
    );
  };

  // Format Phone Mask: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    if (val.length > 6) {
      val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
    } else if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setClientPhone(val);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        service_id: selectedService.id,
        service_title: selectedService.title,
        client_name: clientName,
        client_phone: clientPhone,
        booking_date: selectedDate,
        booking_time: selectedTime,
        notes: notes
      };

      const result = await createBooking(bookingData);
      setCompletedBooking(result);
      setStep(4);
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao salvar o agendamento.');
    } finally {
      setLoading(false);
    }
  };

  // Open WhatsApp link with pre-filled message
  const handleSendWhatsApp = () => {
    if (!completedBooking || !selectedService) return;
    
    const formattedDate = format(new Date(completedBooking.booking_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR });
    const text = encodeURIComponent(
      `👋 *Olá! Gostaria de confirmar meu agendamento na Barbearia Royal:*\n\n` +
      `📌 *Serviço:* ${completedBooking.service_title}\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${completedBooking.booking_time}\n` +
      `👤 *Cliente:* ${completedBooking.client_name}\n` +
      `📱 *WhatsApp:* ${completedBooking.client_phone}\n` +
      `💰 *Valor:* R$ ${selectedService.price.toFixed(2).replace('.', ',')}\n\n` +
      `Obrigado!`
    );

    const barberPhone = '5511999999999'; // Barbershop WhatsApp number
    window.open(`https://wa.me/${barberPhone}?text=${text}`, '_blank');
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setNotes('');
    setCompletedBooking(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-900/60">
          <div className="flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-gold-400" />
            <h3 className="text-lg font-bold text-white">Agendar Horário</h3>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Steps (1-3) */}
        {step < 4 && (
          <div className="px-6 py-3 bg-dark-900/40 border-b border-white/5 flex items-center justify-between text-xs font-semibold">
            <div className={`flex items-center space-x-1.5 ${step >= 1 ? 'text-gold-400' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
              <span>Serviço</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10"></div>
            <div className={`flex items-center space-x-1.5 ${step >= 2 ? 'text-gold-400' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
              <span>Data & Hora</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10"></div>
            <div className={`flex items-center space-x-1.5 ${step >= 3 ? 'text-gold-400' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
              <span>Confirmação</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: SERVICE SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white">Selecione o Serviço Desejado:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500/10 shadow-glow-gold'
                          : 'border-white/10 bg-dark-900/50 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-white">{service.title}</h5>
                          <span className="text-xs font-extrabold text-gold-400">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{service.description}</p>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gold-400" />
                          <span>{service.duration_min} minutos</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME SELECTION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Selected service summary pill */}
              <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gold-400 font-bold block">Serviço Selecionado:</span>
                  <span className="text-sm font-extrabold text-white">{selectedService?.title}</span>
                </div>
                <span className="text-sm font-bold text-gold-400">
                  R$ {selectedService?.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Date Selector */}
              <div>
                <label className="text-sm font-bold text-white block mb-3 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-gold-400" />
                  <span>Escolha o Dia:</span>
                </label>
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    const isClosed = item.isSunday || item.isMonday;
                    return (
                      <button
                        key={item.dateStr}
                        disabled={isClosed}
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setSelectedTime('');
                        }}
                        className={`flex-shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
                          isClosed
                            ? 'opacity-40 border-white/5 bg-dark-900/30 cursor-not-allowed'
                            : isSelected
                            ? 'border-gold-500 bg-gold-500/20 text-white font-bold shadow-glow-gold'
                            : 'border-white/10 bg-dark-900/60 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.dayName}</span>
                        <span className="text-lg font-extrabold text-white block my-0.5">{item.dayNumber}</span>
                        <span className="text-[10px] uppercase text-slate-400 block">{item.monthName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="text-sm font-bold text-white block mb-3 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>Horários Disponíveis:</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {allSlots.map((slot) => {
                    const isBooked = isSlotBooked(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isBooked
                            ? 'opacity-30 border-rose-500/20 bg-rose-500/5 text-rose-300 line-through cursor-not-allowed'
                            : isSelected
                            ? 'border-gold-400 bg-gold-400 text-dark-900 font-extrabold shadow-glow-gold'
                            : 'border-white/10 bg-dark-900/60 text-slate-200 hover:border-gold-400/50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CUSTOMER DETAILS */}
          {step === 3 && (
            <div className="space-y-5">
              <h4 className="text-base font-bold text-white">Preencha seus dados para finalizar:</h4>
              
              {/* Summary box */}
              <div className="p-4 rounded-xl bg-dark-900/80 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Serviço:</span>
                  <span className="font-bold text-white">{selectedService?.title}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Data & Horário:</span>
                  <span className="font-bold text-gold-400">{selectedDate} às {selectedTime}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-white/5">
                  <span>Valor Total:</span>
                  <span className="font-extrabold text-white text-sm">R$ {selectedService?.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nome Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">WhatsApp *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={clientPhone}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Observação (Opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Alguma preferência de estilo ou aviso?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Política de Cancelamento: Caso ocorra algum imprevisto, avise via WhatsApp com pelo menos 2h de antecedência.</span>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && completedBooking && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-extrabold text-white">Agendamento Confirmado!</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Seu horário foi reservado com sucesso no nosso sistema.
                </p>
              </div>

              {/* Summary Card */}
              <div className="glass-card p-5 rounded-2xl border border-white/10 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{completedBooking.client_name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Serviço:</span>
                  <span className="font-bold text-white">{completedBooking.service_title}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Data & Hora:</span>
                  <span className="font-extrabold text-gold-400">
                    {completedBooking.booking_date} às {completedBooking.booking_time}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Confirmação via WhatsApp</span>
                </button>

                <button
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-slate-300 bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <span>Concluir</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls (Steps 1-3) */}
        {step < 4 && (
          <div className="px-6 py-4 border-t border-white/10 bg-dark-900/80 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div></div>
            )}

            {step === 1 && (
              <button
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-dark-900 bg-gold-400 hover:bg-gold-300 transition-all shadow-glow-gold flex items-center space-x-2 disabled:opacity-50"
              >
                <span>Avançar para Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-dark-900 bg-gold-400 hover:bg-gold-300 transition-all shadow-glow-gold flex items-center space-x-2 disabled:opacity-50"
              >
                <span>Avançar para Seus Dados</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={loading || !clientName || !clientPhone}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-dark-900 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 transition-all shadow-glow-amber flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <span>Confirmar Agendamento</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
