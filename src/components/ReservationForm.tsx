import React, { useState, useMemo } from "react";
import { todayStr, formatPhone } from "../utils";
import { SLOT_STARTS, fmtSlot } from "../types";
import type { Booking, SlotHour } from "../types";

interface ReservationFormProps {
  selectedSeat: number | null;
  occupiedSeats: Map<number, Booking>;
  blockedWeekdays: number[];
  blockedSlots: number[];
  onSeatSelect: (seatNumber: number | null) => void;
  onReserve: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
  onValidate: (
    name: string,
    studentId: string,
    phone: string,
    department: string,
    date: string,
    slotHour: SlotHour,
    pc: number | null,
    blockedWeekdays: number[],
    blockedSlots: number[],
    isPastDate: boolean
  ) => string | null;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  selectedSeat,
  occupiedSeats,
  blockedWeekdays,
  blockedSlots,
  onSeatSelect,
  onReserve,
  onCancel,
  onValidate
}) => {
  const [date, setDate] = useState<string>(todayStr());
  const [slotHour, setSlotHour] = useState<SlotHour>(18);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<"경제학과">("경제학과");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayISO = useMemo(() => todayStr(), []);
  const isPastDate = useMemo(() => date < todayISO, [date, todayISO]);
  const dayOfWeek = useMemo(() => new Date(`${date}T00:00:00`).getDay(), [date]);
  const isBlocked = useMemo(
    () => blockedWeekdays.includes(dayOfWeek) || blockedSlots.includes(slotHour),
    [blockedWeekdays, blockedSlots, dayOfWeek, slotHour]
  );

  const todaysBookings = useMemo(() => {
    return Array.from(occupiedSeats.values()).filter(
      (b) => b.date === date && b.slotHour === slotHour
    );
  }, [occupiedSeats, date, slotHour]);

  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  const handleReserve = () => {
    clearAlerts();
    
    const validationError = onValidate(
      name,
      studentId,
      phone,
      department,
      date,
      slotHour,
      selectedSeat,
      blockedWeekdays,
      blockedSlots,
      isPastDate
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    // 예약 생성 (부모 컴포넌트에서 처리)
    const booking: Booking = {
      id: "", // 부모에서 생성
      pc: selectedSeat!,
      date,
      slotHour,
      name: name.trim(),
      studentId: studentId.trim(),
      phone: phone.trim(),
      department,
      createdAt: Date.now()
    };

    onReserve(booking);
    setMessage(`예약 완료: PC ${selectedSeat} - ${date} - ${fmtSlot(slotHour)}`);
    
    // 폼 초기화
    setName("");
    setStudentId("");
    setPhone("");
    onSeatSelect(null);
  };

  return (
    <div className="xl:col-span-1 space-y-4">
      {/* 예약 폼 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold">예약 정보</h2>
        
        {isBlocked && (
          <div className="rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">
            현재 선택한 {fmtSlot(slotHour)} 또는 선택 날짜의 요일에 예약이 제한되어 있습니다.
          </div>
        )}
        
        {isPastDate && (
          <div className="rounded-xl bg-slate-100 text-slate-500 p-3 text-sm">
            지난 날짜는 예약할 수 없습니다.
          </div>
        )}
        
        {error && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
        {message && <div className="rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm">{message}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">학번</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">전화번호</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">학과</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={department}
              onChange={(e) => setDepartment(e.target.value as "경제학과")}
            >
              <option value="경제학과">경제학과</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">날짜</label>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              min={todayISO}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">시간대</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={slotHour}
              onChange={(e) => setSlotHour(Number(e.target.value) as SlotHour)}
            >
              {SLOT_STARTS.map((hour) => (
                <option key={hour} value={hour}>
                  {fmtSlot(hour)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-span-2">
            <div className="text-xs text-slate-500">* 57, 58, 59, 60번은 예약 불가</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleReserve}
            disabled={isBlocked || isPastDate}
            className="flex-1 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            좌석 예약하기
          </button>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">해당 시간대 예약 목록</h3>
        </div>
        <ul className="divide-y max-h-72 overflow-auto">
          {todaysBookings.length === 0 && (
            <li className="p-3 text-sm text-slate-500">예약이 없습니다.</li>
          )}
          {todaysBookings.map((booking) => (
            <li key={booking.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">PC {booking.pc} - {booking.name}</div>
                <div className="text-xs text-slate-500">
                  {booking.studentId} - {formatPhone(booking.phone)} - {booking.department} - {booking.date} {fmtSlot(booking.slotHour)}
                </div>
              </div>
              <button
                onClick={() => onCancel(booking.id)}
                className="text-xs rounded-lg bg-slate-900 text-white px-2 py-1"
              >
                취소
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReservationForm;
