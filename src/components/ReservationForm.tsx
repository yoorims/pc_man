import React, { useState } from 'react';
import { Booking, SlotHour } from '../lib/supabase';
import { createBooking } from '../hooks/useSupabaseBookings';
import { normalizePhone } from '../utils';


interface ReservationFormProps {
  selectedSeat: number | null;
  onAddBooking: (booking: Booking) => Promise<void>;
  blockedWeekdays?: number[];
  blockedSlots?: number[];
  onDateChange?: (date: string) => void;
  onSlotChange?: (slot: SlotHour) => void;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  selectedSeat,
  onAddBooking,
  blockedWeekdays = [],
  blockedSlots = [],
  onDateChange,
  onSlotChange
}) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<'경제학과'>('경제학과');
  const [date, setDate] = useState('');
  const [slotHour, setSlotHour] = useState<SlotHour>(18);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  // 차단 설정 확인
  const dayOfWeek = date ? new Date(`${date}T00:00:00`).getDay() : -1;
  const isBlockedByWeekday = blockedWeekdays.includes(dayOfWeek);
  const isBlockedBySlot = blockedSlots.includes(slotHour);
  const isBlocked = isBlockedByWeekday || isBlockedBySlot;
  
  // 오후 6시 이후 예약 제한 (오후 6시까지만 받을 수 있음)
  const currentHour = new Date().getHours();
  const isAfter6PM = currentHour >= 18;
  const isBlockedByTime = isAfter6PM && date === todayISO;
  
  const isPastDate = date && date < todayISO;

  const handleReserve = async () => {
    if (!selectedSeat) {
      setError('좌석을 선택해주세요.');
      return;
    }

    if (!name.trim() || !studentId.trim() || !phone.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // 전화번호 유효성 검사
    const normalizedPhone = normalizePhone(phone.trim());
    if (!normalizedPhone) {
      setError('전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)');
      return;
    }

    if (isBlocked) {
      if (isBlockedByWeekday) {
        setError('해당 요일에는 예약이 불가합니다.');
      } else if (isBlockedBySlot) {
        setError('해당 시간대는 예약이 불가합니다.');
      } else {
        setError('현재 예약이 차단되어 있습니다.');
      }
      return;
    }

    if (isBlockedByTime) {
      setError('오후 6시 이후에는 당일 예약이 불가합니다.');
      return;
    }

    if (isPastDate) {
      setError('과거 날짜는 예약할 수 없습니다.');
      return;
    }

    try {
      const booking = createBooking(
        name.trim(),
        studentId.trim(),
        phone.trim(),
        department,
        date,
        slotHour,
        selectedSeat
      );
      await onAddBooking(booking);

      setMessage('예약이 완료되었습니다!');
      setError('');
      
      // 폼 초기화
      setName('');
      setStudentId('');
      setPhone('');
      setDate('');
      setSlotHour(18);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('예약 오류 상세:', err);
      
      let errorMessage = '예약 중 오류가 발생했습니다.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Supabase 오류 처리
        if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('error' in err) {
          errorMessage = String(err.error);
        }
      }
      
      setError(errorMessage);
    }
  };



  return (
    <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-sky-800">PC실 좌석 예약</h2>
          <p className="text-xs text-slate-500">18:00–21:00, 좌석별 예약</p>
          {selectedSeat && (
            <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <p className="text-sm font-semibold text-sky-800">
                선택된 좌석: <span className="text-lg">{selectedSeat}번</span>
              </p>
            </div>
          )}
        </div>
        
        {isBlocked && (
          <div className="mb-3 rounded-xl bg-slate-100 text-slate-700 p-3 text-sm">
            {isBlockedByWeekday && '해당 요일에는 예약이 불가합니다.'}
            {isBlockedBySlot && '해당 시간대는 예약이 불가합니다.'}
          </div>
        )}

        {isBlockedByTime && (
          <div className="mb-3 rounded-xl bg-slate-100 text-slate-700 p-3 text-sm">
            오후 6시 이후에는 당일 예약이 불가합니다.
          </div>
        )}

        {isPastDate && (
          <div className="mb-3 rounded-xl bg-slate-100 text-slate-700 p-3 text-sm">
            과거 날짜는 예약할 수 없습니다.
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-3 rounded-xl bg-green-50 border border-green-200 p-3 text-sm">
            <p className="text-sm font-medium text-green-700">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">
            <span className="block mb-1 text-slate-600">날짜</span>
            <input 
              type="date" 
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" 
              min={todayISO} 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                onDateChange?.(e.target.value);
              }} 
            />
          </label>

          <label className="col-span-2 text-sm">
            <span className="block mb-1 text-slate-600">시간대</span>
            <div className="flex gap-2">
              {[18, 19, 20].map((h) => (
                <button 
                  key={h} 
                  type="button" 
                  aria-pressed={slotHour === h} 
                  onClick={() => {
                    setSlotHour(h as SlotHour);
                    onSlotChange?.(h as SlotHour);
                  }} 
                  className={`px-3 py-2 rounded-xl border text-sm transition ${
                    slotHour === h 
                      ? "bg-sky-600 text-white border-sky-600 shadow" 
                      : "bg-white text-sky-700 border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  {h}:00–{h + 1}:00
                </button>
              ))}
            </div>
          </label>

          <label className="col-span-1 text-sm">
            <span className="block mb-1 text-slate-600">이름</span>
            <input 
              className="w-full rounded-xl border px-3 py-2 text-sm" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </label>
          <label className="col-span-1 text-sm">
            <span className="block mb-1 text-slate-600">학번</span>
            <input 
              className="w-full rounded-xl border px-3 py-2 text-sm" 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)} 
            />
          </label>
          <label className="col-span-1 text-sm">
            <span className="block mb-1 text-slate-600">학과</span>
            <select 
              className="w-full rounded-xl border px-3 py-2 text-sm" 
              value={department} 
              onChange={(e) => setDepartment(e.target.value as '경제학과')}
            >
              <option value="경제학과">경제학과</option>
            </select>
          </label>
          <label className="col-span-1 text-sm">
            <span className="block mb-1 text-slate-600">연락처</span>
            <input 
              className="w-full rounded-xl border px-3 py-2 text-sm" 
              placeholder="01012345678" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </label>
        </div>

        <div className="text-[11px] text-slate-500 mt-3">
          ※ 57–60번은 예약불가입니다.
        </div>

        <button
          onClick={handleReserve}
          disabled={isBlocked || isBlockedByTime || isPastDate || !selectedSeat}
          className="w-full mt-4 rounded-2xl py-2.5 font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          좌석 예약하기
        </button>
        
        {/* 안내사항 */}
        <div className="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-sky-900 mb-1">예약 안내</h4>
          <p className="text-sm text-sky-800">
            경제학과 학생 전용 · 이름/학번/전화/학과 입력 필수 · 3개 시간대 (18/19/20시 시작)
          </p>
        </div>
    </div>
  );
};

export default ReservationForm;