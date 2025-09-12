import React, { useState, useMemo } from "react";
import { formatPhone } from "../utils";
import { fmtSlot } from "../types";
import { exportXlsxByDate, exportXlsxAll, exportCsvByDate, exportCsvAll } from "../utils/export";
import type { Booking } from "../types";

interface AdminPanelProps {
  bookings: Booking[];
  onForceCancel: (bookingId: string) => void;
  onBulkCancel: (bookingIds: string[]) => void;
  adminPin: string;
  notice: string;
  webhookUrl: string;
  blockedWeekdays: number[];
  blockedSlots: number[];
  onNoticeChange: (notice: string) => void;
  onWebhookUrlChange: (url: string) => void;
  onToggleWeekdayBlock: (weekday: number) => void;
  onToggleSlotBlock: (slot: number) => void;
  onChangePin: (current: string, newPin: string) => void;
  onSendWebhook: (numbers: string[], message: string, cancelledIds: string[]) => Promise<boolean>;
  onCopyPhoneList: (phoneList: string[]) => Promise<void>;
  onOpenSmsApp: (phoneNumber: string, message: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  bookings,
  onForceCancel,
  onBulkCancel,
  adminPin,
  notice,
  webhookUrl,
  blockedWeekdays,
  blockedSlots,
  onNoticeChange,
  onWebhookUrlChange,
  onToggleWeekdayBlock,
  onToggleSlotBlock,
  onChangePin,
  onSendWebhook,
  onCopyPhoneList,
  onOpenSmsApp
}) => {
  const [pinInput, setPinInput] = useState("");
  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [notifyMsg, setNotifyMsg] = useState<string>(
    "[경제학과 PC실] 예약이 관리자에 의해 취소되었습니다. 불편을 드려 죄송합니다."
  );
  const [adminAuthed, setAdminAuthed] = useState(false);

  // 검색 및 필터링된 예약 목록
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => (filterDate ? b.date === filterDate : true))
      .filter((b) => matchesQuery(b, query))
      .sort((a, b) => a.date.localeCompare(b.date) || a.slotHour - b.slotHour || a.pc - b.pc);
  }, [bookings, filterDate, query]);

  // 연락처 목록
  const phoneList = useMemo(() => {
    return Array.from(
      new Set(filteredBookings.map((b) => b.phone).filter((phone): phone is string => Boolean(phone)))
    );
  }, [filteredBookings]);

  // 검색 쿼리 매칭
  function matchesQuery(booking: Booking, query: string): boolean {
    if (!query.trim()) return true;
    const searchTerm = query.toLowerCase();
    return (
      booking.name.toLowerCase().includes(searchTerm) ||
      booking.studentId.toLowerCase().includes(searchTerm) ||
      (booking.phone ? formatPhone(booking.phone).toLowerCase().includes(searchTerm) : false) ||
      booking.department.toLowerCase().includes(searchTerm) ||
      String(booking.pc).includes(searchTerm) ||
      booking.date.includes(searchTerm) ||
      fmtSlot(booking.slotHour).includes(searchTerm)
    );
  }

  // 일괄 취소 및 알림
  const handleBulkCancelAndNotify = async () => {
    if (filteredBookings.length === 0) {
      alert("현재 목록이 비어 있습니다.");
      return;
    }

    if (!confirm(`현재 목록 ${filteredBookings.length}건을 모두 취소하시겠습니까?`)) {
      return;
    }

    const bookingIds = filteredBookings.map((b) => b.id);
    onBulkCancel(bookingIds);

    if (phoneList.length === 0) {
      alert("연락처가 없어 안내문자를 보낼 수 없습니다.");
      return;
    }

    if (webhookUrl) {
      await onSendWebhook(phoneList, notifyMsg, bookingIds);
    }

    await onCopyPhoneList(phoneList);
  };

  // PIN 변경 핸들러
  const handleChangePin = (current: string, newPin: string) => {
    if (onChangePin(current, newPin)) {
      setPinInput("");
    }
  };

  if (!adminAuthed) {
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h3 className="text-base font-semibold">관리자 로그인</h3>
        <div className="flex items-center gap-2">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="PIN 입력"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
          />
          <button
            className="rounded-xl bg-slate-900 text-white text-sm px-3 py-2"
            onClick={() => setAdminAuthed(pinInput === adminPin)}
          >
            접속
          </button>
        </div>
        <div className="text-xs text-slate-500">기본 PIN: 0423 (관리자에서 변경 가능)</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 공지 배너 편집 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="text-base font-semibold">공지 배너</h3>
        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm"
          rows={3}
          placeholder="예) 오늘은 19:00 슬롯만 운영합니다."
          value={notice}
          onChange={(e) => onNoticeChange(e.target.value)}
        />
        <div className="text-xs text-slate-500">사용자 예약 화면 상단에 노출됩니다.</div>
      </div>

      {/* 예약 제한 설정 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="text-base font-semibold">예약 제한 (요일/시간대)</h3>
        <div className="space-y-2">
          <div className="text-xs text-slate-500">요일 제한 (체크된 요일은 예약 불가):</div>
          <div className="flex gap-1 flex-wrap">
            {["일", "월", "화", "수", "목", "금", "토"].map((label, i) => {
              const isBlocked = blockedWeekdays.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => onToggleWeekdayBlock(i)}
                  className={`px-2.5 py-1 rounded-lg text-sm border ${
                    isBlocked
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white"
                  }`}
                  title={isBlocked ? "예약 불가" : "예약 가능"}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-slate-500">시간대 제한 (체크된 시간대는 예약 불가):</div>
          <div className="flex gap-2">
            {([18, 19, 20] as const).map((hour) => {
              const isBlocked = blockedSlots.includes(hour);
              return (
                <label key={hour} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={() => onToggleSlotBlock(hour)}
                  />
                  <span>{fmtSlot(hour)}</span>
                </label>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500">
            설정은 즉시 반영됩니다. 사용자 탭에서는 해당 요일/시간대 예약 버튼이 비활성화되며, 기존 예약도 자동 취소됩니다.
          </div>
        </div>
      </div>

      {/* 일괄 취소 & 안내문자 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="text-base font-semibold">일괄 취소 & 안내문자</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium">안내 메시지</label>
            <textarea
              className="w-full rounded-xl border px-3 py-2 text-sm"
              rows={3}
              value={notifyMsg}
              onChange={(e) => setNotifyMsg(e.target.value)}
            />
            <div className="text-[11px] text-slate-500">
              예: [경제학과 PC실] 오늘 {filterDate || "(날짜)"} 운영 사정으로 예약이 취소되었습니다.
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">웹훅 URL (선택)</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="https://your-sms-service.example/send"
              value={webhookUrl}
              onChange={(e) => onWebhookUrlChange(e.target.value)}
            />
            <div className="text-[11px] text-slate-500">
              POST JSON: {`{ numbers: string[], message: string, cancelledIds: string[] }`} (CORS 허용 필요)
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl bg-red-600 text-white text-sm px-3 py-2"
            onClick={handleBulkCancelAndNotify}
          >
            현재 목록 일괄 강제 취소 + 안내
          </button>
          <button
            className="rounded-xl border text-sm px-3 py-2"
            onClick={() => onCopyPhoneList(phoneList)}
          >
            연락처 복사({phoneList.length})
          </button>
          <button
            className="rounded-xl border text-sm px-3 py-2"
            onClick={() => onOpenSmsApp(phoneList[0] || "", notifyMsg)}
          >
            SMS 앱 열기 (1명 테스트)
          </button>
        </div>
        <div className="text-xs text-slate-500">
          ※ 실제 문자 발송은 SMS 연동(웹훅/외부 서비스)이 필요합니다. 복사 기능으로 연락처를 문자 발송 도구에 붙여넣을 수 있습니다.
        </div>
      </div>

      {/* 예약 현황 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">예약 현황</h3>
          <div className="text-xs text-slate-500">
            총 {filteredBookings.length}건 (연락처 {phoneList.length}명)
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="검색: 이름/학번/전화/학과/PC/날짜/시간"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            type="date"
            className="rounded-xl border px-3 py-2 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => {
              setQuery("");
              setFilterDate("");
            }}
          >
            필터 초기화
          </button>
        </div>
        <ul className="divide-y max-h-[420px] overflow-auto">
          {filteredBookings.length === 0 && (
            <li className="p-3 text-sm text-slate-500">표시할 예약이 없습니다.</li>
          )}
          {filteredBookings.map((booking) => (
            <li key={booking.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {booking.date} {fmtSlot(booking.slotHour)} - PC {booking.pc} - {booking.name}
                </div>
                <div className="text-xs text-slate-500">
                  {booking.studentId} - {formatPhone(booking.phone)} - {booking.department} - 등록{" "}
                  {new Date(booking.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onForceCancel(booking.id)}
                className="text-xs rounded bg-red-600 text-white px-2 py-1"
              >
                강제 취소
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 데이터 내보내기 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="text-base font-semibold">데이터 내보내기 (엑셀/CSV)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="rounded-xl border px-3 py-2 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => {
              if (filterDate) {
                exportXlsxByDate(bookings, filterDate);
              } else {
                alert("날짜를 선택하세요.");
              }
            }}
          >
            선택 날짜 엑셀
          </button>
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => exportXlsxAll(bookings)}
          >
            전체 엑셀 (날짜별 시트 + Summary)
          </button>
          <span className="text-slate-400">|</span>
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => {
              if (filterDate) {
                exportCsvByDate(bookings, filterDate);
              } else {
                alert("날짜를 선택하세요.");
              }
            }}
          >
            선택 날짜 CSV
          </button>
          <button
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() => exportCsvAll(bookings)}
          >
            전체 CSV
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          엑셀 저장이 제한된 환경에서는 자동으로 CSV로 저장되며, CSV 버튼으로 직접 내려받을 수도 있습니다.
        </div>
      </div>

      {/* PIN 변경 */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="text-base font-semibold">관리자 PIN 변경</h3>
        <PinChanger onChange={handleChangePin} />
      </div>
    </div>
  );
};

// PIN 변경 컴포넌트
interface PinChangerProps {
  onChange: (current: string, newPin: string) => void;
}

const PinChanger: React.FC<PinChangerProps> = ({ onChange }) => {
  const [current, setCurrent] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChange = () => {
    if (newPin !== confirm) {
      alert("새 PIN이 일치하지 않습니다.");
      return;
    }
    onChange(current, newPin);
    setCurrent("");
    setNewPin("");
    setConfirm("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="rounded-xl border px-3 py-2 text-sm"
        placeholder="현재 PIN"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <input
        className="rounded-xl border px-3 py-2 text-sm"
        placeholder="새 PIN"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
      />
      <input
        className="rounded-xl border px-3 py-2 text-sm"
        placeholder="새 PIN 확인"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button
        className="rounded-xl bg-slate-900 text-white text-sm px-3 py-2"
        onClick={handleChange}
      >
        변경
      </button>
    </div>
  );
};

export default AdminPanel;
