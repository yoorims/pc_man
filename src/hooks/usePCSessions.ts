import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PCSession } from '../types/studyRoom';
import { uuid } from '../utils';

export function usePCSessions() {
  const [sessions, setSessions] = useState<PCSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 활성 세션 로드
  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pc_sessions')
        .select('*')
        .order('start_at', { ascending: false });

      if (error) throw error;

      const convertedSessions: PCSession[] = data?.map((session: any) => ({
        id: session.id,
        pc_number: session.pc_number,
        name: session.name,
        student_id: session.student_id,
        phone: session.phone,
        department: session.department,
        startAt: new Date(session.start_at).getTime(),
        endAt: new Date(session.end_at).getTime(),
        slot_hour: session.slot_hour
      })) || [];

      setSessions(convertedSessions);
    } catch (err) {
      console.error('PC 세션 로드 실패:', err);
      setError('PC 세션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadSessions();
  }, []);

  // PC 세션 시작
  const startSession = async (booking: any) => {
    try {
      const session: PCSession = {
        id: uuid(),
        pc_number: booking.pc_number,
        name: booking.name,
        student_id: booking.student_id,
        phone: booking.phone,
        department: booking.department,
        startAt: Date.now(),
        endAt: Date.now() + (60 * 60 * 1000), // 1시간 후
        slot_hour: booking.slot_hour
      };

      const { error } = await supabase
        .from('pc_sessions')
        .insert({
          id: session.id,
          pc_number: session.pc_number,
          name: session.name,
          student_id: session.student_id,
          phone: session.phone,
          department: session.department,
          start_at: new Date(session.startAt).toISOString(),
          end_at: new Date(session.endAt).toISOString(),
          slot_hour: session.slot_hour
        });

      if (error) throw error;

      setSessions(prev => [session, ...prev]);
    } catch (err) {
      console.error('PC 세션 시작 실패:', err);
      setError('PC 세션 시작에 실패했습니다.');
      throw err;
    }
  };

  // PC 세션 종료
  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('pc_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('PC 세션 종료 실패:', err);
      setError('PC 세션 종료에 실패했습니다.');
      throw err;
    }
  };

  // 활성 세션 맵 (PC 번호별)
  const activeByPC = new Map<number, PCSession>();
  sessions.forEach(session => {
    if (session.endAt > Date.now()) {
      activeByPC.set(session.pc_number, session);
    }
  });

  return {
    sessions,
    loading,
    error,
    activeByPC,
    startSession,
    endSession,
    refreshSessions: loadSessions
  };
}

