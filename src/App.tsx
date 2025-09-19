import { useState } from 'react';
import { useSupabaseBookings } from './hooks/useSupabaseBookings';
import { useSupabaseAdmin } from './hooks/useSupabaseAdmin';
import { useStudyRoom } from './hooks/useStudyRoom';
import ReservationForm from './components/ReservationForm';
import SeatGrid from './components/SeatGrid';
import StudyRoomForm from './components/StudyRoomForm';
import AdminPanel from './components/AdminPanel';

function App() {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number>(18);
  
  const {
    bookings,
    bookingsError,
    addBooking,
    removeBooking,
    isLoading: bookingsLoading
  } = useSupabaseBookings();
  
  const {
    adminSettings,
    adminError,
    updateNotice,
    adminAuthed: isAuthenticated,
    loginAdmin,
    logout,
    updatePin,
    loading: adminLoading
  } = useSupabaseAdmin();

  const {
    sessions,
    settings: studySettings,
    activeByRoom,
    startSession,
    endSession,
    updateSettings: updateStudySettings,
  } = useStudyRoom();

  // PC 세션 기능은 일단 비활성화 (테이블이 없을 수 있음)
  // const {
  //   sessions: pcSessions,
  //   activeByPC,
  //   startSession: startPCSession,
  //   endSession: endPCSession,
  // } = usePCSessions();
  
  const pcSessions: any[] = [];
  const endPCSession = async () => {};


  if (bookingsLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (bookingsError || adminError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">연결 오류</h3>
              <p className="mt-1 text-sm text-red-700">
                {bookingsError || adminError}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 text-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-sky-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-sky-700">스터디룸 & PC실 예약</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("user")} 
                className={`px-3 py-1.5 rounded-xl text-sm border ${
                  activeTab === 'user' 
                    ? 'bg-sky-700 text-white border-sky-700' 
                    : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                }`}
              >
                사용자
              </button>
              <button 
                onClick={() => setActiveTab("admin")} 
                className={`px-3 py-1.5 rounded-xl text-sm border ${
                  activeTab === 'admin' 
                    ? 'bg-sky-700 text-white border-sky-700' 
                    : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                }`}
              >
                관리자
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto p-4 space-y-8">
        {activeTab === "user" ? (
          <div className="space-y-8">
            {/* 스터디룸 */}
            <div>
              <StudyRoomForm
                activeByRoom={activeByRoom}
                settings={studySettings}
                onStartSession={startSession}
                onEndSession={endSession}
              />
            </div>

            {/* PC실 예약 시스템 */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* PC실 예약 폼 (왼쪽) */}
              <div className="lg:col-span-1">
                <ReservationForm
                  selectedSeat={selectedSeat}
                  onAddBooking={addBooking}
                  blockedWeekdays={adminSettings?.blocked_weekdays || []}
                  blockedSlots={adminSettings?.blocked_slots || []}
                  onDateChange={setSelectedDate}
                  onSlotChange={setSelectedSlot}
                />
              </div>
              
              {/* PC실 좌석 배치도 (오른쪽) */}
              <div className="lg:col-span-2">
                <SeatGrid
                  selectedSeat={selectedSeat}
                  occupiedSeats={bookings}
                  onSeatSelect={setSelectedSeat}
                  onRemoveBooking={removeBooking}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                />
              </div>
            </div>
          </div>
        ) : (
                <AdminPanel
                  adminSettings={adminSettings}
                  isAuthenticated={isAuthenticated}
                  onLogin={loginAdmin}
                  onLogout={logout}
                  onUpdateNotice={updateNotice}
                  sessions={sessions}
                  studySettings={studySettings}
                  onEndSession={endSession}
                  onUpdateStudySettings={updateStudySettings}
                  pcBookings={bookings}
                  onRemoveBooking={removeBooking}
                  pcSessions={pcSessions}
                  onEndPCSession={endPCSession}
                  onUpdatePin={updatePin}
                />
        )}
      </main>
    </div>
  );
}

export default App;