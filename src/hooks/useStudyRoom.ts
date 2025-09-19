import { useState, useEffect, useMemo } from 'react';
import { StudySession, StudyRoomSettings, STUDY_ROOMS } from '../types/studyRoom';

const STORAGE_KEYS = {
  sessions: 'econ_study_sessions_v1',
  settings: 'econ_study_settings_v1',
};

export function useStudyRoom() {
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || '[]');
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<StudyRoomSettings>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{"blockedWeekdays":[0,6],"blockedStudyHours":[]}');
    } catch {
      return { blockedWeekdays: [0, 6], blockedStudyHours: [] };
    }
  });

  // 세션 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // 설정 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // 활성 세션 맵 (방별)
  const activeByRoom = useMemo(() => {
    const map = new Map<StudySession['room'], StudySession | null>();
    for (const room of STUDY_ROOMS) {
      map.set(room, null);
    }
    
    const now = Date.now();
    for (const session of sessions) {
      if (session.endAt > now) {
        map.set(session.room, session);
      }
    }
    
    return map;
  }, [sessions]);

  // 만료된 세션 자동 정리
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSessions(prev => prev.filter(s => s.endAt > now));
    }, 30000); // 30초마다 체크

    return () => clearInterval(interval);
  }, []);

  const startSession = (session: Omit<StudySession, 'id' | 'startAt' | 'endAt'> & { duration: number }) => {
    const now = Date.now();
    const newSession: StudySession = {
      id: Math.random().toString(36).slice(2, 10),
      ...session,
      startAt: now,
      endAt: now + session.duration * 60 * 1000,
    };
    
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const endSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const updateSettings = (newSettings: Partial<StudyRoomSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    sessions,
    settings,
    activeByRoom,
    startSession,
    endSession,
    updateSettings,
  };
}

