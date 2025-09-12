import React, { useState, useEffect, useMemo } from "react";
import { todayStr } from "./utils";
import { useBookings } from "./hooks/useBookings";
import { useAdmin } from "./hooks/useAdmin";
import SeatGrid from "./components/SeatGrid";
import AdminPanel from "./components/AdminPanel";
import ReservationForm from "./components/ReservationForm";
import type { Booking, TabType, SlotHour } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("user");
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [date, setDate] = useState<string>(todayStr());
  const [slotHour, setSlotHour] = useState<SlotHour>(18);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    bookings,
    getOccupiedSeats,
    validateBooking,
    createBooking,
    addBooking,
    cancelBooking,
    forceCancelBooking,
    bulkCancelBookings,
    purgeBlockedBookings
  } = useBookings();

  const {
    adminPin,
    notice,
    webhookUrl,
    blockedWeekdays,
    blockedSlots,
    adminAuthed,
    setNotice,
    setWebhookUrl,
    setAdminAuthed,
    changePin,
    toggleWeekdayBlock,
    toggleSlotBlock,
    sendWebhook,
    copyPhoneList,
    openSmsApp
  } = useAdmin();

  const occupiedSeats = getOccupiedSeats(date, slotHour);
  const todayISO = useMemo(() => todayStr(), []);
  const isPastDate = useMemo(() => date < todayISO, [date, todayISO]);

  // 차단된 예약 자동 정리
  useEffect(() => {
    purgeBlockedBookings(blockedWeekdays, blockedSlots);
  }, [blockedWeekdays, blockedSlots, purgeBlockedBookings]);

  // 알림 초기화
  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  // 예약 처리
  const handleReserve = (bookingData: Booking) => {
    clearAlerts();
    const newBooking = createBooking(
      bookingData.name,
      bookingData.studentId,
      bookingData.phone,
      bookingData.department,
      bookingData.date,
      bookingData.slotHour,
      bookingData.pc
    );
    addBooking(newBooking);
    setMessage(`예약 완료: PC ${bookingData.pc} - ${bookingData.date} - ${bookingData.slotHour}:00-${bookingData.slotHour + 1}:00`);
    setSelectedSeat(null);
  };

  // 예약 취소
  const handleCancel = (bookingId: string) => {
    clearAlerts();
    cancelBooking(bookingId);
    setMessage("예약이 취소되었습니다.");
  };

  // 좌석 선택
  const handleSeatSelect = (seatNumber: number | null) => {
    setSelectedSeat(seatNumber);
  };

  // 관리자 기능들
  const handleForceCancel = (bookingId: string) => {
    forceCancelBooking(bookingId);
  };

  const handleBulkCancel = (bookingIds: string[]) => {
    bulkCancelBookings(bookingIds);
  };

  const handleSendWebhook = async (numbers: string[], message: string, cancelledIds: string[]) => {
    return await sendWebhook(numbers, message, cancelledIds);
  };

  const handleCopyPhoneList = async (phoneList: string[]) => {
    await copyPhoneList(phoneList);
  };

  const handleOpenSmsApp = (phoneNumber: string, message: string) => {
    openSmsApp(phoneNumber, message);
  };

  const handleChangePin = (current: string, newPin: string) => {
    return changePin(current, newPin);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">경제학과 PC실 예약</h1>
            <div className="text-xs text-slate-600">No Sign-Up · 경제학과 전용 · 18:00-21:00</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setActiveTab("user")}
              className={`px-3 py-1.5 rounded-xl text-sm border ${
                activeTab === "user" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              예약
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-xl text-sm border ${
                activeTab === "admin" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              관리자
            </button>
          </div>
          {notice && activeTab === "user" && (
            <div className="mt-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2 text-sm">
              공지: {notice}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid xl:grid-cols-3 gap-6">
        {activeTab === "user" ? (
          <>
            <ReservationForm
              selectedSeat={selectedSeat}
              occupiedSeats={occupiedSeats}
              blockedWeekdays={blockedWeekdays}
              blockedSlots={blockedSlots}
              onSeatSelect={handleSeatSelect}
              onReserve={handleReserve}
              onCancel={handleCancel}
              onValidate={validateBooking}
            />
            <section className="xl:col-span-2 space-y-4">
              <SeatGrid
                selectedSeat={selectedSeat}
                occupiedSeats={occupiedSeats}
                isPastDate={isPastDate}
                onSeatSelect={handleSeatSelect}
              />
              <div className="bg-white rounded-2xl shadow p-4 text-xs text-slate-600">
                <div>
                  안내: 예약 가능 시간은 18:00-21:00이며, 1시간 단위로 예약됩니다. 57-60번은 예약이 불가합니다. 좌석별 예약입니다 (동일 시간대 여러 좌석 예약 가능).
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="xl:col-span-3">
            <AdminPanel
              bookings={bookings}
              onForceCancel={handleForceCancel}
              onBulkCancel={handleBulkCancel}
              adminPin={adminPin}
              notice={notice}
              webhookUrl={webhookUrl}
              blockedWeekdays={blockedWeekdays}
              blockedSlots={blockedSlots}
              onNoticeChange={setNotice}
              onWebhookUrlChange={setWebhookUrl}
              onToggleWeekdayBlock={toggleWeekdayBlock}
              onToggleSlotBlock={toggleSlotBlock}
              onChangePin={handleChangePin}
              onSendWebhook={handleSendWebhook}
              onCopyPhoneList={handleCopyPhoneList}
              onOpenSmsApp={handleOpenSmsApp}
            />
          </section>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-10 pt-2 text-xs text-slate-500">
        <div>경제학과 학생 전용 · 이름/학번/전화/학과 입력 필수 · 3개 시간대 (18/19/20시 시작)</div>
      </footer>
    </div>
  );
}
