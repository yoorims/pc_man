import { useState, useEffect, useMemo } from "react";
import { load, save, uuid, todayStr, normalizePhone } from "../utils";
import { STORAGE, NON_RESERVABLE, ALLOWED_DEPTS, STUDENT_ID_REGEX, SLOT_STARTS } from "../types";
import type { Booking, SlotHour } from "../types";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(() => load(STORAGE.bookings, []));
  
  useEffect(() => {
    save(STORAGE.bookings, bookings);
  }, [bookings]);

  // 특정 날짜/시간대의 예약된 좌석 맵
  const getOccupiedSeats = useMemo(() => 
    (date: string, slotHour: SlotHour) => {
      const occupied = new Map<number, Booking>();
      bookings
        .filter((b) => b.date === date && b.slotHour === slotHour)
        .forEach((b) => occupied.set(b.pc, b));
      return occupied;
    }, [bookings]
  );

  // 예약 검증
  const validateBooking = (
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
  ): string | null => {
    if (!name.trim()) return "이름을 입력하세요.";
    if (!STUDENT_ID_REGEX.test(studentId.trim())) return "학번 형식이 올바르지 않습니다 (8~9자리).";
    if (!ALLOWED_DEPTS.has(department as any)) return "경제학과 학생만 이용 가능합니다.";
    
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return "전화번호 형식이 올바르지 않습니다.";
    
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    if (blockedWeekdays.includes(dayOfWeek)) return "해당 요일에는 예약이 불가합니다.";
    if (blockedSlots.includes(slotHour)) return "해당 시간대는 예약이 불가합니다.";
    if (isPastDate) return "지난 날짜는 예약할 수 없습니다.";
    if (pc == null) return "좌석을 선택하세요.";
    if (NON_RESERVABLE.has(pc)) return "해당 좌석은 예약 불가 (57~60).";
    
    const occupied = getOccupiedSeats(date, slotHour);
    if (occupied.has(pc)) return "이미 예약된 좌석입니다.";

    return null;
  };

  // 예약 생성
  const createBooking = (
    name: string,
    studentId: string,
    phone: string,
    department: "경제학과",
    date: string,
    slotHour: SlotHour,
    pc: number
  ): Booking => {
    const normalizedPhone = normalizePhone(phone)!;
    return {
      id: uuid(),
      pc,
      date,
      slotHour,
      name: name.trim(),
      studentId: studentId.trim(),
      phone: normalizedPhone,
      department,
      createdAt: Date.now()
    };
  };

  // 예약 추가
  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  // 예약 취소
  const cancelBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  // 예약 강제 취소 (관리자용)
  const forceCancelBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  // 일괄 취소
  const bulkCancelBookings = (bookingIds: string[]) => {
    const idSet = new Set(bookingIds);
    setBookings((prev) => prev.filter((b) => !idSet.has(b.id)));
  };

  // 차단된 예약 자동 정리
  const purgeBlockedBookings = useMemo(() => 
    (blockedWeekdays: number[], blockedSlots: number[]) => {
      setBookings((prev) =>
        prev.filter((b) => {
          const dayOfWeek = new Date(`${b.date}T00:00:00`).getDay();
          return !blockedWeekdays.includes(dayOfWeek) && !blockedSlots.includes(b.slotHour);
        })
      );
    }, []
  );

  return {
    bookings,
    getOccupiedSeats,
    validateBooking,
    createBooking,
    addBooking,
    cancelBooking,
    forceCancelBooking,
    bulkCancelBookings,
    purgeBlockedBookings
  };
}
