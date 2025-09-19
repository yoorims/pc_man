import { useState, useEffect } from "react";
import { supabase, type AdminSettings } from "../lib/supabase";

export function useSupabaseAdmin() {
  const [adminPin, setAdminPin] = useState("1234");
  const [notice, setNotice] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [blockedWeekdays, setBlockedWeekdays] = useState<number[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<number[]>([]);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관리자 설정 로드 (LocalStorage 폴백 포함)
  const loadAdminSettings = async () => {
    try {
      setLoading(true);
      
      // Supabase 시도
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때
          throw error;
        }

        if (data) {
          setAdminPin(data.admin_pin);
          setNotice(data.notice || "");
          setWebhookUrl(data.webhook_url || "");
          setBlockedWeekdays(data.blocked_weekdays || []);
          setBlockedSlots(data.blocked_slots || []);
          console.log('Supabase에서 관리자 설정 로드 완료');
          return;
        }
      } catch (supabaseError) {
        console.warn('Supabase 로드 실패, LocalStorage로 폴백:', supabaseError);
      }
      
      // LocalStorage에서 로드 시도
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        try {
          const data = JSON.parse(savedSettings);
          setAdminPin(data.admin_pin || "1234");
          setNotice(data.notice || "");
          setWebhookUrl(data.webhook_url || "");
          setBlockedWeekdays(data.blocked_weekdays || []);
          setBlockedSlots(data.blocked_slots || []);
          console.log('LocalStorage에서 관리자 설정 로드 완료');
          return;
        } catch (parseError) {
          console.error('LocalStorage 데이터 파싱 실패:', parseError);
        }
      }
      
      // 기본값으로 초기화
      console.log('관리자 설정 데이터가 없습니다. 기본값으로 초기화합니다.');
      setAdminPin("1234");
      setNotice("");
      setWebhookUrl("");
      setBlockedWeekdays([]);
      setBlockedSlots([]);
      
    } catch (err) {
      console.error('관리자 설정 로드 실패:', err);
      setError('관리자 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadAdminSettings();
  }, []);

  // 관리자 설정 저장 (LocalStorage 폴백 포함)
  const saveAdminSettings = async () => {
    try {
      console.log('관리자 설정 저장 시작...');
      
      const settingsData = {
        admin_pin: adminPin,
        notice: notice || null,
        webhook_url: webhookUrl || null,
        blocked_weekdays: blockedWeekdays,
        blocked_slots: blockedSlots,
        is_blocked: false,
        updated_at: new Date().toISOString()
      };

      console.log('저장할 데이터:', settingsData);

      // Supabase 시도
      try {
        // 먼저 기존 데이터가 있는지 확인
        const { data: existingData, error: selectError } = await supabase
          .from('admin_settings')
          .select('id')
          .limit(1)
          .single();

        console.log('기존 데이터 확인:', { existingData, selectError });

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError;
        }

        let error;
        if (existingData) {
          // 기존 데이터가 있으면 업데이트
          console.log('기존 데이터 업데이트 중...');
          const { error: updateError } = await supabase
            .from('admin_settings')
            .update(settingsData)
            .eq('id', existingData.id);
          error = updateError;
        } else {
          // 기존 데이터가 없으면 삽입
          console.log('새 데이터 삽입 중...');
          const { error: insertError } = await supabase
            .from('admin_settings')
            .insert(settingsData);
          error = insertError;
        }

        if (error) {
          throw error;
        }
        
        console.log('Supabase 저장 완료');
      } catch (supabaseError) {
        console.warn('Supabase 저장 실패, LocalStorage로 폴백:', supabaseError);
        
        // LocalStorage로 폴백
        localStorage.setItem('admin_settings', JSON.stringify(settingsData));
        console.log('LocalStorage 저장 완료');
      }
      
    } catch (err) {
      console.error('관리자 설정 저장 실패:', err);
      setError('관리자 설정 저장에 실패했습니다.');
      throw err;
    }
  };

  // 관리자 로그인
  const login = async (inputPin: string) => {
    if (inputPin === adminPin) {
      setAdminAuthed(true);
      return true;
    } else {
      throw new Error('잘못된 PIN입니다.');
    }
  };

  // 로그인 함수 (void 반환)
  const loginAdmin = async (inputPin: string) => {
    if (inputPin !== adminPin) {
      throw new Error('잘못된 PIN입니다.');
    }
    setAdminAuthed(true);
  };

  // 관리자 로그아웃
  const logout = () => {
    setAdminAuthed(false);
  };

  // PIN 변경
  const changePin = async (currentPin: string, newPin: string) => {
    if (currentPin !== adminPin) {
      return false;
    }

    try {
      setAdminPin(newPin);
      await saveAdminSettings();
      return true;
    } catch (err) {
      console.error('PIN 변경 실패:', err);
      return false;
    }
  };

  // PIN 변경 함수 (void 반환)
  const updatePin = async (newPin: string) => {
    const success = await changePin(adminPin, newPin);
    if (!success) {
      throw new Error('현재 PIN이 올바르지 않습니다.');
    }
  };

  // 공지사항 변경
  const updateNotice = async (newNotice: string) => {
    try {
      setNotice(newNotice);
      await saveAdminSettings();
      setError(null); // 성공 시 오류 상태 초기화
    } catch (err) {
      console.error('공지사항 변경 실패:', err);
      setError('공지사항 업데이트에 실패했습니다.');
      throw err;
    }
  };

  // 웹훅 URL 변경
  const updateWebhookUrl = async (newUrl: string) => {
    try {
      setWebhookUrl(newUrl);
      await saveAdminSettings();
    } catch (err) {
      console.error('웹훅 URL 변경 실패:', err);
      throw err;
    }
  };

  // 요일 차단 토글
  const toggleWeekdayBlock = async (weekday: number) => {
    try {
      const newBlockedWeekdays = blockedWeekdays.includes(weekday)
        ? blockedWeekdays.filter(w => w !== weekday)
        : [...blockedWeekdays, weekday];
      
      setBlockedWeekdays(newBlockedWeekdays);
      await saveAdminSettings();
    } catch (err) {
      console.error('요일 차단 설정 실패:', err);
      throw err;
    }
  };

  // 시간대 차단 토글
  const toggleSlotBlock = async (slot: number) => {
    try {
      const newBlockedSlots = blockedSlots.includes(slot)
        ? blockedSlots.filter(s => s !== slot)
        : [...blockedSlots, slot];
      
      setBlockedSlots(newBlockedSlots);
      await saveAdminSettings();
    } catch (err) {
      console.error('시간대 차단 설정 실패:', err);
      throw err;
    }
  };

  // 웹훅 전송
  const sendWebhook = async (numbers: string[], message: string, cancelledIds: string[]) => {
    if (!webhookUrl) {
      throw new Error('웹훅 URL이 설정되지 않았습니다.');
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers,
          message,
          cancelledIds,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`웹훅 전송 실패: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('웹훅 전송 실패:', err);
      throw err;
    }
  };

  // 전화번호 목록 복사
  const copyPhoneList = async (phoneList: string[]) => {
    try {
      await navigator.clipboard.writeText(phoneList.join('\n'));
    } catch (err) {
      console.error('전화번호 목록 복사 실패:', err);
      throw err;
    }
  };

  // SMS 앱 열기
  const openSmsApp = (phoneNumber: string, message: string) => {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  // adminSettings 객체 생성
  const adminSettings = {
    id: 'default',
    admin_pin: adminPin,
    notice: notice,
    webhook_url: webhookUrl,
    blocked_weekdays: blockedWeekdays,
    blocked_slots: blockedSlots,
    is_blocked: false, // 기본값
    updated_at: new Date().toISOString()
  };

  return {
    adminSettings,
    adminPin,
    notice,
    webhookUrl,
    blockedWeekdays,
    blockedSlots,
    adminAuthed,
    loading,
    error,
    adminError: error,
    login,
    loginAdmin,
    logout,
    updateNotice,
    setNotice: updateNotice,
    setWebhookUrl: updateWebhookUrl,
    setAdminAuthed,
    changePin,
    updatePin,
    toggleWeekdayBlock,
    toggleSlotBlock,
    sendWebhook,
    copyPhoneList,
    openSmsApp,
    refreshSettings: loadAdminSettings
  };
}
