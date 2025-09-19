import React, { useState } from 'react';
import { AdminSettings } from '../lib/supabase';
import { StudySession, StudyRoomSettings, PCSession } from '../types/studyRoom';
import { downloadCSV, convertStudyRoomData, convertPCData } from '../utils/exportData';

interface AdminPanelProps {
  adminSettings: AdminSettings | null;
  isAuthenticated: boolean;
  onLogin: (pin: string) => Promise<void>;
  onLogout: () => void;
  onUpdateNotice: (notice: string) => Promise<void>;
  // 스터디룸 관련 props
  sessions?: StudySession[];
  studySettings?: StudyRoomSettings;
  onEndSession?: (sessionId: string) => void;
  onUpdateStudySettings?: (settings: Partial<StudyRoomSettings>) => void;
  // PC실 관련 props
  pcBookings?: any[];
  onRemoveBooking?: (id: string) => Promise<void>;
  pcSessions?: PCSession[];
  onEndPCSession?: (sessionId: string) => Promise<void>;
  // PIN 변경 관련 props
  onUpdatePin?: (newPin: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  adminSettings,
  isAuthenticated,
  onLogin,
  onLogout,
  onUpdateNotice,
  sessions = [],
  studySettings,
  onEndSession,
  onUpdateStudySettings,
  pcBookings = [],
  onRemoveBooking,
  pcSessions = [],
  onEndPCSession,
  onUpdatePin,
}) => {
  const [pin, setPin] = useState('');
  const [notice, setNotice] = useState(adminSettings?.notice || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // PIN 변경 관련 상태
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // PC실 관리 관련 상태
  const [pcQuery, setPcQuery] = useState('');
  const [pcFilterDate, setPcFilterDate] = useState('');
  const [pcFilterSlot, setPcFilterSlot] = useState('');
  
  // PC실 설정 관련 상태
  const [pcBlockedWeekdays, setPcBlockedWeekdays] = useState<number[]>(adminSettings?.blocked_weekdays || []);
  const [pcBlockedSlots, setPcBlockedSlots] = useState<number[]>(adminSettings?.blocked_slots || []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await onLogin(pin);
      setMessage('로그인 성공!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('잘못된 PIN입니다.');
    }
  };

  const handleUpdateNotice = async () => {
    try {
      setError(''); // 오류 상태 초기화
      await onUpdateNotice(notice);
      setMessage('공지사항이 업데이트되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('공지사항 업데이트 오류:', err);
      setError(err instanceof Error ? err.message : '공지사항 업데이트에 실패했습니다.');
    }
  };

  const handlePinChange = async () => {
    if (!onUpdatePin) return;
    
    if (newPin !== confirmPin) {
      setError('새 PIN이 일치하지 않습니다.');
      return;
    }
    
    if (newPin.length < 4) {
      setError('새 PIN은 4자리 이상이어야 합니다.');
      return;
    }
    
    try {
      await onUpdatePin(newPin);
      setMessage('PIN이 성공적으로 변경되었습니다.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('PIN 변경에 실패했습니다.');
    }
  };

  const handleRemoveBooking = async (bookingId: string) => {
    if (!onRemoveBooking) return;
    
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) return;
    
    try {
      await onRemoveBooking(bookingId);
      setMessage('예약이 취소되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('예약 취소에 실패했습니다.');
    }
  };

  // 스터디룸 데이터 다운로드
  const handleDownloadStudyRoomData = () => {
    // 관리자 인증 확인
    if (!isAuthenticated) {
      alert('데이터 다운로드는 관리자 권한이 필요합니다. 먼저 로그인해주세요.');
      return;
    }

    const completedSessions = sessions.filter(session => session.endAt);
    if (completedSessions.length === 0) {
      alert('다운로드할 완료된 스터디룸 데이터가 없습니다.');
      return;
    }
    
    try {
      const exportData = convertStudyRoomData(completedSessions);
      const today = new Date().toISOString().split('T')[0];
      downloadCSV(exportData, `스터디룸_사용내역_${today}.csv`);
      setMessage('스터디룸 데이터가 다운로드되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('스터디룸 데이터 다운로드 오류:', error);
      alert('데이터 다운로드 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
  };

  // PC실 데이터 다운로드
  const handleDownloadPCData = () => {
    // 관리자 인증 확인
    if (!isAuthenticated) {
      alert('데이터 다운로드는 관리자 권한이 필요합니다. 먼저 로그인해주세요.');
      return;
    }

    if (pcBookings.length === 0) {
      alert('다운로드할 PC실 데이터가 없습니다.');
      return;
    }
    
    try {
      const exportData = convertPCData(pcBookings);
      const today = new Date().toISOString().split('T')[0];
      downloadCSV(exportData, `PC실_사용내역_${today}.csv`);
      setMessage('PC실 데이터가 다운로드되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('PC실 데이터 다운로드 오류:', error);
      alert('데이터 다운로드 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
  };

  // PC실 요일 차단 토글
  const togglePcWeekday = (day: number) => {
    setPcBlockedWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // PC실 시간대 차단 토글
  const togglePcSlot = (slot: number) => {
    setPcBlockedSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  // PC실 주말 차단
  const blockPcWeekends = () => {
    setPcBlockedWeekdays([0, 6]); // 일요일, 토요일
  };

  // PC실 전체 해제
  const unblockPcAll = () => {
    setPcBlockedWeekdays([]);
    setPcBlockedSlots([]);
  };

  // PC실 예약 필터링
  const filteredPcBookings = pcBookings.filter(booking => {
    if (pcFilterDate && booking.date !== pcFilterDate) return false;
    if (pcFilterSlot && booking.slot_hour !== parseInt(pcFilterSlot)) return false;
    if (pcQuery) {
      const query = pcQuery.toLowerCase();
      const searchText = `${booking.date} ${booking.pc_number} ${booking.slot_hour} ${booking.name} ${booking.student_id}`.toLowerCase();
      if (!searchText.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.slot_hour !== b.slot_hour) return a.slot_hour - b.slot_hour;
    return a.pc_number - b.pc_number;
  });

  const formatSlot = (hour: number) => {
    const start = String(hour).padStart(2, '0');
    const end = String(hour + 1).padStart(2, '0');
    return `${start}:00-${end}:00`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-sky-800">관리자 로그인</h3>
            <p className="text-xs text-slate-500">PIN을 입력하여 관리자 모드에 접속하세요</p>
          </div>

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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">PIN</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="관리자 PIN을 입력하세요"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-sky-700 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
            >
              로그인
            </button>
          </form>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-600">
              <strong>기본 PIN:</strong> 1234 (초기 설정)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 관리자 헤더 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sky-800">관리자 모드</h2>
            <p className="text-xs text-slate-500">시스템 관리 및 설정</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-sky-700 text-white rounded-xl font-semibold hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 공지사항 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-sky-800">공지사항 관리</h3>
          <p className="text-xs text-slate-500">사용자에게 표시될 공지사항을 관리하세요</p>
        </div>

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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">공지사항 내용</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
              rows={3}
              placeholder="공지사항을 입력하세요..."
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleUpdateNotice}
            className="bg-sky-700 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
          >
            공지사항 업데이트
          </button>
        </div>
      </div>

      {/* 스터디룸 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-sky-800">스터디룸 관리</h3>
              <p className="text-xs text-slate-500">스터디룸 사용 현황 및 설정</p>
            </div>
            <button
              onClick={handleDownloadStudyRoomData}
              disabled={!isAuthenticated}
              className={`px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
                isAuthenticated 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={!isAuthenticated ? '관리자 로그인이 필요합니다' : ''}
            >
              데이터 다운로드
            </button>
          </div>
        </div>

        {/* 스터디룸 제한 설정 */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">요일 제한</div>
            <div className="flex gap-1 flex-wrap">
              {['일', '월', '화', '수', '목', '금', '토'].map((label, i) => {
                const isBlocked = studySettings?.blockedWeekdays.includes(i) || false;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (onUpdateStudySettings) {
                        const current = studySettings?.blockedWeekdays || [];
                        const updated = isBlocked 
                          ? current.filter(day => day !== i)
                          : [...current, i].sort((a, b) => a - b);
                        onUpdateStudySettings({ blockedWeekdays: updated });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-sm border ${
                      isBlocked 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                    title={isBlocked ? '예약불가' : '예약가능'}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                className="text-xs rounded border px-2 py-1"
                onClick={() => onUpdateStudySettings?.({ blockedWeekdays: [0, 6] })}
              >
                주말 차단
              </button>
              <button
                className="text-xs rounded border px-2 py-1"
                onClick={() => onUpdateStudySettings?.({ blockedWeekdays: [] })}
              >
                전체 해제
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">스터디룸 시간 차단 (시 기준)</div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 24 }, (_, h) => h).map(h => {
                const isBlocked = studySettings?.blockedStudyHours.includes(h) || false;
                return (
                  <button
                    key={h}
                    onClick={() => {
                      if (onUpdateStudySettings) {
                        const current = studySettings?.blockedStudyHours || [];
                        const updated = isBlocked 
                          ? current.filter(hour => hour !== h)
                          : [...current, h].sort((a, b) => a - b);
                        onUpdateStudySettings({ blockedStudyHours: updated });
                      }
                    }}
                    className={`px-2 py-1 rounded border text-xs ${
                      isBlocked 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 활성 세션 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-sky-800">활성 세션</h4>
            <div className="text-xs text-slate-500">
              총 {sessions.filter(s => s.endAt > Date.now()).length}건
            </div>
          </div>
          <ul className="divide-y max-h-[360px] overflow-auto">
            {sessions.filter(s => s.endAt > Date.now()).length === 0 ? (
              <li className="p-3 text-sm text-slate-500">활성 세션이 없습니다.</li>
            ) : (
              sessions
                .filter(s => s.endAt > Date.now())
                .sort((a, b) => b.startAt - a.startAt)
                .map(session => (
                  <li key={session.id} className="p-3 text-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {session.room} · 대표 {session.leader.name} ({session.leader.studentId})
                      </div>
                      <div className="text-xs text-slate-500">
                        연락처 {session.leader.phone} · 인원 {1 + session.others.length}명 · 
                        시작 {new Date(session.startAt).toLocaleString()} · 
                        종료 {new Date(session.endAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => onEndSession?.(session.id)}
                      className="text-xs rounded bg-rose-600 text-white px-2 py-1"
                    >
                      강제 종료
                    </button>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      {/* PC실 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-sky-800">PC실 예약 관리</h3>
              <p className="text-xs text-slate-500">PC실 예약 현황 및 관리</p>
            </div>
            <button
              onClick={handleDownloadPCData}
              disabled={!isAuthenticated}
              className={`px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
                isAuthenticated 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={!isAuthenticated ? '관리자 로그인이 필요합니다' : ''}
            >
              데이터 다운로드
            </button>
          </div>
        </div>

        {/* PC실 제한 설정 */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">요일 제한</div>
            <div className="flex gap-1 flex-wrap">
              {['일', '월', '화', '수', '목', '금', '토'].map((label, i) => {
                const isBlocked = pcBlockedWeekdays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => togglePcWeekday(i)}
                    className={`px-2.5 py-1 rounded-lg text-sm border ${
                      isBlocked 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                    title={isBlocked ? '예약불가' : '예약가능'}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                className="text-xs rounded border px-2 py-1"
                onClick={blockPcWeekends}
              >
                주말 차단
              </button>
              <button
                className="text-xs rounded border px-2 py-1"
                onClick={unblockPcAll}
              >
                전체 해제
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">PC실 시간 차단 (시 기준)</div>
            <div className="flex gap-1 flex-wrap">
              {[18, 19, 20].map((hour) => {
                const isBlocked = pcBlockedSlots.includes(hour);
                return (
                  <button
                    key={hour}
                    onClick={() => togglePcSlot(hour)}
                    className={`px-2.5 py-1 rounded-lg text-sm border ${
                      isBlocked 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                    title={isBlocked ? '예약불가' : '예약가능'}
                  >
                    {hour}:00-{hour + 1}:00
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PC실 예약 필터 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="검색(이름/학번/날짜/좌석/시간)"
            value={pcQuery}
            onChange={(e) => setPcQuery(e.target.value)}
          />
          <input
            type="date"
            className="rounded-xl border px-3 py-2 text-sm"
            value={pcFilterDate}
            onChange={(e) => setPcFilterDate(e.target.value)}
          />
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={pcFilterSlot}
            onChange={(e) => setPcFilterSlot(e.target.value)}
          >
            <option value="">모든 시간</option>
            <option value="18">18:00-19:00</option>
            <option value="19">19:00-20:00</option>
            <option value="20">20:00-21:00</option>
          </select>
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => {
              setPcQuery('');
              setPcFilterDate('');
              setPcFilterSlot('');
            }}
          >
            필터 초기화
          </button>
        </div>

        {/* PC실 예약 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-sky-800">예약 목록</h4>
            <div className="text-xs text-slate-500">
              총 {filteredPcBookings.length}건
            </div>
          </div>
          <ul className="divide-y max-h-[420px] overflow-auto">
            {filteredPcBookings.length === 0 ? (
              <li className="p-3 text-sm text-slate-500">표시할 예약이 없습니다.</li>
            ) : (
              filteredPcBookings.map((booking) => (
                <li key={booking.id} className="p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">
                        {booking.date} {formatSlot(booking.slot_hour)} · 좌석 {booking.pc_number}
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="truncate">
                          이름: {booking.name}
                        </div>
                        <div className="truncate">
                          학번: {booking.student_id}
                        </div>
                        <div className="truncate">
                          연락처: {booking.phone}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBooking(booking.id)}
                      className="text-xs rounded bg-rose-600 text-white px-2 py-1 flex-shrink-0"
                    >
                      강제 취소
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* PC실 활성 세션 관리 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-sky-800">PC실 활성 세션</h3>
          <p className="text-xs text-slate-500">현재 사용 중인 PC 세션 관리</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">활성 세션</span>
            <span className="text-sm text-slate-500">총 {pcSessions.length}건</span>
          </div>
          
          {pcSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">활성 세션이 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pcSessions.map((session) => {
                const remainingTime = Math.max(0, session.endAt - Date.now());
                const minutes = Math.floor(remainingTime / 60000);
                const mm = String(minutes % 60).padStart(2, '0');
                const hh = Math.floor(minutes / 60);
                const timeText = `${hh}:${mm}`;
                
                return (
                  <li key={session.id} className="p-3 text-sm bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">
                          PC {session.pc_number} · {session.slot_hour}:00-{session.slot_hour + 1}:00
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="truncate">
                            이름: {session.name}
                          </div>
                          <div className="truncate">
                            학번: {session.student_id}
                          </div>
                          <div className="truncate">
                            연락처: {session.phone}
                          </div>
                          <div className="truncate">
                            남은시간: {timeText}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (onEndPCSession) {
                            if (confirm('정말로 이 PC 세션을 강제 종료하시겠습니까?')) {
                              onEndPCSession(session.id);
                            }
                          }
                        }}
                        className="text-xs rounded bg-red-600 text-white px-2 py-1 flex-shrink-0 hover:bg-red-700"
                      >
                        강제 종료
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* PIN 변경 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-sky-800">관리자 PIN 변경</h3>
          <p className="text-xs text-slate-500">관리자 로그인 PIN을 변경하세요</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">현재 PIN</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="현재 PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">새 PIN</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="새 PIN (4자리 이상)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">새 PIN 확인</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="새 PIN 확인"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={handlePinChange}
            className="bg-sky-700 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
          >
            PIN 변경
          </button>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-sky-800">시스템 정보</h3>
          <p className="text-xs text-slate-500">현재 시스템 상태 및 설정</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">예약 차단 상태</h4>
            <p className="text-sm font-semibold text-green-600">
              정상
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">마지막 업데이트</h4>
            <p className="text-sm text-slate-600">
              {adminSettings?.updated_at 
                ? new Date(adminSettings.updated_at).toLocaleString('ko-KR')
                : '정보 없음'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;