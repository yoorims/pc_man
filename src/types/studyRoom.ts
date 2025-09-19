export interface StudyMember {
  name: string;
  studentId: string;
  department: string;
}

export interface StudyLeader extends StudyMember {
  phone: string;
}

export interface StudySession {
  id: string;
  room: 'A' | 'B' | 'C' | 'D';
  leader: StudyLeader;
  others: StudyMember[];
  startAt: number; // timestamp
  endAt: number; // timestamp
}

export interface StudyRoomSettings {
  blockedWeekdays: number[]; // 0=일요일, 6=토요일
  blockedStudyHours: number[]; // 0-23 시간
}

export const STUDY_ROOMS: Array<StudySession['room']> = ['A', 'B', 'C', 'D'];
export const STUDY_DURATIONS = Array.from({ length: 8 }, (_, i) => (i + 1) * 15); // 15-120분
export const ONLY_ECON = ['경제학과'] as const;

// PC실 활성 세션 타입
export interface PCSession {
  id: string;
  pc_number: number;
  name: string;
  student_id: string;
  phone: string;
  department: string;
  startAt: number; // timestamp
  endAt: number; // timestamp
  slot_hour: number; // 18, 19, 20
}
