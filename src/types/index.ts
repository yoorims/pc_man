export const PCS = Array.from({ length: 60 }, (_, i) => i + 1);
export const NON_RESERVABLE = new Set([57, 58, 59, 60]);
export const ALLOWED_DEPTS = new Set(["경제학과"]);
export const STUDENT_ID_REGEX = /^\d{8,9}$/; // 8 or 9 digits

export const STORAGE = {
  bookings: "econ_pclab_bookings_v1",
  adminPin: "econ_pclab_admin_pin_v1",
  adminNotice: "econ_pclab_admin_notice_v1",
  adminBlockedWeekdays: "econ_pclab_admin_blocked_weekdays_v1",
  adminBlockedSlots: "econ_pclab_admin_blocked_slots_v1",
  adminWebhook: "econ_pclab_admin_webhook_v1",
} as const;

export const SLOT_STARTS = [18, 19, 20] as const;

// 시간 슬롯 포맷팅 함수
export function fmtSlot(h: number): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(h)}:00-${z(h + 1)}:00`;
}

export type SlotHour = typeof SLOT_STARTS[number];

export interface Booking {
  id: string;
  pc: number;
  date: string; // YYYY-MM-DD
  slotHour: SlotHour;
  name: string;
  studentId: string;
  phone?: string; // digits only, e.g., 01012345678
  department: "경제학과";
  createdAt: number;
}

export type TabType = "user" | "admin";
