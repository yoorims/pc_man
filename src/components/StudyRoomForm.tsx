import React, { useState, useEffect } from 'react';
import { StudyLeader, StudyMember, STUDY_ROOMS, STUDY_DURATIONS, ONLY_ECON } from '../types/studyRoom';
import { StudySession } from '../types/studyRoom';

interface StudyRoomFormProps {
  activeByRoom: Map<StudySession['room'], StudySession | null>;
  settings: {
    blockedWeekdays: number[];
    blockedStudyHours: number[];
  };
  onStartSession: (session: {
    room: StudySession['room'];
    leader: StudyLeader;
    others: StudyMember[];
    duration: number;
  }) => void;
  onEndSession: (sessionId: string) => void;
}

const STUDENT_ID_REGEX = /^\d{8,9}$/;
const PHONE_REQUIRED = /\d{7,}/;

export default function StudyRoomForm({
  activeByRoom,
  settings,
  onStartSession,
  onEndSession,
}: StudyRoomFormProps) {
  const [leader, setLeader] = useState<StudyLeader>({
    name: '',
    studentId: '',
    department: '경제학과',
    phone: '',
  });
  
  const [others, setOthers] = useState<StudyMember[]>([]);
  const [othersCount, setOthersCount] = useState(0);
  const [duration, setDuration] = useState(60);
  const [room, setRoom] = useState<StudySession['room']>('A');

  // others 배열 길이 조정
  useEffect(() => {
    setOthers(prev => {
      const next = prev.slice(0, othersCount);
      while (next.length < othersCount) {
        next.push({ name: '', studentId: '', department: '경제학과' });
      }
      return next;
    });
  }, [othersCount]);

  const updateOther = (index: number, field: keyof StudyMember, value: string) => {
    setOthers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateStudy = (): string | null => {
    const todayDow = new Date().getDay();
    const nowHour = new Date().getHours();
    
    if (settings.blockedWeekdays.includes(todayDow) || settings.blockedStudyHours.includes(nowHour)) {
      return '해당 요일/시간에는 사용이 차단되었습니다 (관리자 설정).';
    }
    
    if (!leader.name.trim()) return '대표자 이름을 입력하세요.';
    if (!STUDENT_ID_REGEX.test(leader.studentId.trim())) return '대표자 학번은 8~9자리 숫자입니다.';
    if (leader.department !== '경제학과') return '경제학과만 이용 가능합니다.';
    if (!PHONE_REQUIRED.test(leader.phone.trim())) return '연락처를 정확히 입력하세요.';
    
    for (let i = 0; i < others.length; i++) {
      const member = others[i];
      if (!member.name.trim()) return `${i + 1}번 인원의 이름을 입력하세요.`;
      if (!STUDENT_ID_REGEX.test(member.studentId.trim())) return `${i + 1}번 인원의 학번은 8~9자리 숫자입니다.`;
      if (member.department !== '경제학과') return '경제학과만 이용 가능합니다.';
    }
    
    const total = 1 + others.length;
    if (total < 3) return '스터디룸은 3명 이상부터 이용 가능합니다.';
    if (total > 6) return '최대 6명까지 이용 가능합니다.';
    if (duration < 15 || duration > 120) return '이용 시간은 15~120분입니다.';
    
    const activeSession = activeByRoom.get(room);
    if (activeSession) return `${room}은 사용 중입니다.`;
    
    return null;
  };

  const handleStartStudy = () => {
    const error = validateStudy();
    if (error) {
      alert(error);
      return;
    }
    
    onStartSession({
      room,
      leader: { ...leader },
      others: others.map(o => ({ ...o })),
      duration,
    });
    
    alert(`${room} 사용 시작: ${duration}분 (현재부터)`);
  };

  const remainingText = (endAt: number) => {
    const left = Math.max(0, endAt - Date.now());
    const minutes = Math.floor(left / 60000);
    const mm = String(minutes % 60).padStart(2, '0');
    return `${Math.floor(minutes / 60)}:${mm}`;
  };

  // 이름과 학번 마스킹 함수
  const maskName = (name: string) => {
    if (name.length <= 1) return name;
    return name[0] + '*'.repeat(name.length - 1);
  };

  const maskStudentId = (studentId: string) => {
    if (!studentId || studentId.length === 0) return '';
    
    // 8자리 학부생 (20으로 시작)
    if (studentId.length === 8 && studentId.startsWith('20')) {
      return studentId.substring(0, 2) + '******';
    }
    
    // 9자리 대학원생 (120, 220, 320으로 시작)
    if (studentId.length === 9 && (studentId.startsWith('120') || studentId.startsWith('220') || studentId.startsWith('320'))) {
      return studentId.substring(0, 3) + '******';
    }
    
    // 기타 경우 (기존 로직 유지)
    if (studentId.length <= 2) return studentId;
    return studentId.substring(0, 2) + '*'.repeat(studentId.length - 2);
  };

  const isBlocked = settings.blockedWeekdays.includes(new Date().getDay()) || 
                   settings.blockedStudyHours.includes(new Date().getHours());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-sky-800">스터디룸 현장 이용 (15분 단위 · 최대 2시간)</h2>
        <div className="text-xs text-slate-500">A/B/C/D · 3~6명 · 경제학과만</div>
      </div>

      {/* 방 상태 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STUDY_ROOMS.map((roomName) => {
          const session = activeByRoom.get(roomName);
          const busy = Boolean(session);
          
          return (
            <div key={roomName} className={`rounded-xl border p-3 ${busy ? 'bg-rose-50 border-rose-200' : 'bg-sky-50 border-sky-200'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{roomName}</div>
                <span className={`text-xs ${busy ? 'text-rose-700' : 'text-sky-700'}`}>
                  {busy ? '사용중' : '사용가능'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 h-10">
                {busy ? (
                  <>
                    <div>대표: {maskName(session!.leader.name)} ({maskStudentId(session!.leader.studentId)})</div>
                    <div>남은시간: {remainingText(session!.endAt)}</div>
                  </>
                ) : (
                  <div>즉시 시작 가능합니다.</div>
                )}
              </div>
              {busy && (
                <button
                  className="mt-2 w-full rounded-lg bg-slate-800 text-white text-xs py-1.5"
                  onClick={() => onEndSession(session!.id)}
                >
                  조기 종료
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 차단 메시지 */}
      {isBlocked && (
        <div className="mb-3 rounded-xl bg-slate-100 text-slate-700 p-3 text-sm">
          현재 요일/시간에는 스터디룸 사용이 <b>차단</b>되어 있습니다. (관리자 설정)
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* 대표자 정보 */}
          <div className="grid md:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">대표자 이름</span>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={leader.name}
                onChange={(e) => setLeader(prev => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">대표자 학번</span>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={leader.studentId}
                onChange={(e) => setLeader(prev => ({ ...prev, studentId: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">학과</span>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={leader.department}
                onChange={(e) => setLeader(prev => ({ ...prev, department: e.target.value }))}
              >
                {ONLY_ECON.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">연락처</span>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="01012345678"
                value={leader.phone}
                onChange={(e) => setLeader(prev => ({ ...prev, phone: e.target.value }))}
              />
            </label>
          </div>

          {/* 추가 설정 */}
          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">추가 인원 수 (최대 5)</span>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={othersCount}
                onChange={(e) => setOthersCount(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">이용 시간</span>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {STUDY_DURATIONS.map(m => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-600">공간 선택</span>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={room}
                onChange={(e) => setRoom(e.target.value as StudySession['room'])}
              >
                {STUDY_ROOMS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          {/* 추가 인원 정보 */}
          {others.map((member, idx) => (
            <div key={idx} className="grid md:grid-cols-3 gap-3">
              <label className="text-sm">
                <span className="block mb-1 text-slate-600">이름</span>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={member.name}
                  onChange={(e) => updateOther(idx, 'name', e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-slate-600">학번</span>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={member.studentId}
                  onChange={(e) => updateOther(idx, 'studentId', e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-slate-600">학과</span>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={member.department}
                  onChange={(e) => updateOther(idx, 'department', e.target.value)}
                >
                  {ONLY_ECON.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          <div className="text-[11px] text-slate-500">
            ※ 스터디룸은 예약 없이 현재 시점부터 이용합니다. 최대 2시간까지 15분 단위로 설정할 수 있어요.
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-sm">
            <div>총 인원: <b>{1 + others.length}</b>명 / 제한: 3~6명</div>
            <div>설정 시간: <b>{duration}</b>분</div>
            <div>선택 공간: <b>{room}</b></div>
          </div>
          <button
            onClick={handleStartStudy}
            className="w-full rounded-2xl py-2.5 font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow"
          >
            지금 사용 시작
          </button>
        </div>
      </div>
    </div>
  );
}
