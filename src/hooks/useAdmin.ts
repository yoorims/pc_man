import { useState, useEffect } from "react";
import { load, save, copyText } from "../utils";
import { STORAGE } from "../types";

export function useAdmin() {
  // 관리자 PIN
  const [adminPin, setAdminPin] = useState<string>(() => load(STORAGE.adminPin, "0423"));
  useEffect(() => save(STORAGE.adminPin, adminPin), [adminPin]);

  // 공지사항
  const [notice, setNotice] = useState<string>(() => load(STORAGE.adminNotice, ""));
  useEffect(() => save(STORAGE.adminNotice, notice), [notice]);

  // 웹훅 URL
  const [webhookUrl, setWebhookUrl] = useState<string>(() => load(STORAGE.adminWebhook, ""));
  useEffect(() => save(STORAGE.adminWebhook, webhookUrl), [webhookUrl]);

  // 차단된 요일
  const [blockedWeekdays, setBlockedWeekdays] = useState<number[]>(() =>
    load(STORAGE.adminBlockedWeekdays, [])
  );
  useEffect(() => save(STORAGE.adminBlockedWeekdays, blockedWeekdays), [blockedWeekdays]);

  // 차단된 시간대
  const [blockedSlots, setBlockedSlots] = useState<number[]>(() =>
    load(STORAGE.adminBlockedSlots, [])
  );
  useEffect(() => save(STORAGE.adminBlockedSlots, blockedSlots), [blockedSlots]);

  // 관리자 인증 상태
  const [adminAuthed, setAdminAuthed] = useState(false);

  // PIN 변경
  const changePin = (currentPin: string, newPin: string): boolean => {
    if (currentPin !== adminPin) {
      alert("현재 PIN이 올바르지 않습니다.");
      return false;
    }
    if (!newPin || newPin.length < 4) {
      alert("새 PIN은 4자리 이상이어야 합니다.");
      return false;
    }
    setAdminPin(newPin);
    alert("PIN이 변경되었습니다.");
    return true;
  };

  // 요일 차단 토글
  const toggleWeekdayBlock = (weekday: number) => {
    setBlockedWeekdays((prev) => {
      const isBlocked = prev.includes(weekday);
      return isBlocked
        ? prev.filter((w) => w !== weekday)
        : [...prev, weekday].sort((a, b) => a - b);
    });
  };

  // 시간대 차단 토글
  const toggleSlotBlock = (slot: number) => {
    setBlockedSlots((prev) => {
      const isBlocked = prev.includes(slot);
      return isBlocked
        ? prev.filter((s) => s !== slot)
        : [...prev, slot].sort((a, b) => a - b);
    });
  };

  // 웹훅 전송
  const sendWebhook = async (
    numbers: string[],
    message: string,
    cancelledIds: string[]
  ): Promise<boolean> => {
    if (!webhookUrl) {
      alert("웹훅 URL을 설정하세요.");
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numbers,
          message,
          cancelledIds,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      alert("웹훅 전송 완료");
      return true;
    } catch (error) {
      alert("웹훅 호출 실패: " + error);
      return false;
    }
  };

  // 연락처 복사
  const copyPhoneList = async (phoneList: string[]) => {
    if (phoneList.length === 0) {
      alert("연락처가 없습니다.");
      return;
    }
    await copyText(phoneList.join(", "));
  };

  // SMS 앱 열기
  const openSmsApp = (phoneNumber: string, message: string) => {
    if (!phoneNumber) {
      alert("연락처가 없습니다.");
      return;
    }
    const uri = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    (window as any).location = uri;
  };

  return {
    adminPin,
    notice,
    webhookUrl,
    blockedWeekdays,
    blockedSlots,
    adminAuthed,
    setAdminPin,
    setNotice,
    setWebhookUrl,
    setAdminAuthed,
    changePin,
    toggleWeekdayBlock,
    toggleSlotBlock,
    sendWebhook,
    copyPhoneList,
    openSmsApp
  };
}
