import { useState, useEffect, useMemo } from "react";
import { supabase, type Booking, type SlotHour } from "../lib/supabase";
import { uuid, normalizePhone } from "../utils";
import { NON_RESERVABLE, ALLOWED_DEPTS, STUDENT_ID_REGEX } from "../types";

export function useSupabaseBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터베이스에서 예약 목록 로드
  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Supabase 데이터를 그대로 사용 (이미 올바른 형식)
      const convertedBookings: Booking[] = data || [];

      setBookings(convertedBookings);
    } catch (err) {
      console.error('예약 목록 로드 실패:', err);
      setError('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadBookings();
  }, []);

  // 특정 날짜/시간대의 예약된 좌석 맵
  const getOccupiedSeats = useMemo(() => 
    (date: string, slotHour: SlotHour) => {
      const occupied = new Map<number, Booking>();
      bookings
        .filter((b) => b.date === date && b.slot_hour === slotHour)
        .forEach((b) => occupied.set(b.pc_number, b));
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


  // 예약 추가
  const addBooking = async (booking: Booking) => {
    try {
      console.log('예약 데이터:', booking);
      
      const { data, error } = await supabase
        .from('reservations')
        .insert(booking)
        .select();

      console.log('Supabase 응답:', { data, error });

      if (error) {
        console.error('Supabase 오류:', error);
        throw error;
      }

      // 로컬 상태 업데이트
      setBookings((prev) => [booking, ...prev]);
      console.log('예약 추가 성공');
    } catch (err) {
      console.error('예약 추가 실패:', err);
      setError('예약 추가에 실패했습니다.');
      throw err;
    }
  };

  // 예약 취소
  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error('예약 취소 실패:', err);
      setError('예약 취소에 실패했습니다.');
      throw err;
    }
  };

  // 예약 강제 취소 (관리자용)
  const forceCancelBooking = async (bookingId: string) => {
    return await cancelBooking(bookingId);
  };

  // 일괄 취소
  const bulkCancelBookings = async (bookingIds: string[]) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .in('id', bookingIds);

      if (error) throw error;

      // 로컬 상태 업데이트
      const idSet = new Set(bookingIds);
      setBookings((prev) => prev.filter((b) => !idSet.has(b.id)));
    } catch (err) {
      console.error('일괄 취소 실패:', err);
      setError('일괄 취소에 실패했습니다.');
      throw err;
    }
  };

  // 차단된 예약 자동 정리
  const purgeBlockedBookings = useMemo(() => 
    async (blockedWeekdays: number[], blockedSlots: number[]) => {
      try {
        // 차단된 예약 찾기
        const blockedBookings = bookings.filter((b) => {
          const dayOfWeek = new Date(`${b.date}T00:00:00`).getDay();
          return blockedWeekdays.includes(dayOfWeek) || blockedSlots.includes(b.slot_hour);
        });

        if (blockedBookings.length > 0) {
          const blockedIds = blockedBookings.map(b => b.id);
          await bulkCancelBookings(blockedIds);
        }
      } catch (err) {
        console.error('차단된 예약 정리 실패:', err);
      }
    }, [bookings]
  );

  return {
    bookings,
    loading,
    isLoading: loading,
    error,
    bookingsError: error,
    getOccupiedSeats,
    validateBooking,
    createBooking,
    addBooking,
    removeBooking: cancelBooking,
    cancelBooking,
    forceCancelBooking,
    bulkCancelBookings,
    purgeBlockedBookings,
    refreshBookings: loadBookings
  };
}

// createBooking 함수를 별도로 export
export const createBooking = (
  name: string,
  studentId: string,
  phone: string,
  department: "경제학과",
  date: string,
  slotHour: SlotHour,
  pc: number
): Booking => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new Error('전화번호 형식이 올바르지 않습니다.');
  }
  
  return {
    id: uuid(),
    pc_number: pc,
    date,
    slot_hour: slotHour,
    name: name.trim(),
    student_id: studentId.trim(),
    phone: normalizedPhone,
    department,
    applied_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};
