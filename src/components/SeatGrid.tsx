import React, { useState } from 'react';
import { Booking } from '../lib/supabase';
import { maskName, maskStudentId } from '../utils/masking';

const PCS = Array.from({ length: 60 }, (_, i) => i + 1);
const NON_RESERVABLE = new Set([57, 58, 59, 60]);

interface SeatButtonProps {
  seatNumber: number;
  isReserved: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (seatNumber: number) => void;
}

const SeatButton: React.FC<SeatButtonProps> = ({
  seatNumber,
  isReserved,
  isSelected,
  isDisabled,
  onSelect
}) => {
  const getButtonClasses = () => {
    if (isDisabled) {
      return "w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed";
    }
    if (isReserved) {
      return "w-12 h-12 bg-rose-100 border border-rose-200 rounded-lg text-rose-700 cursor-pointer";
    }
    if (isSelected) {
      return "w-12 h-12 bg-sky-600 border border-sky-600 rounded-lg text-white cursor-pointer shadow";
    }
    return "w-12 h-12 bg-white border border-sky-300 rounded-lg text-sky-800 cursor-pointer hover:bg-sky-50";
  };

  const getTooltip = () => {
    if (isDisabled) return "예약 불가";
    if (isReserved) return "이미 예약됨";
    return "예약 가능";
  };

  return (
    <button
      className={`${getButtonClasses()} flex flex-col items-center justify-center text-xs font-bold transition-all duration-200`}
      disabled={isDisabled}
      onClick={() => onSelect(seatNumber)}
      title={getTooltip()}
    >
      <span className="text-sm font-semibold">{seatNumber}</span>
    </button>
  );
};

interface SeatGridProps {
  selectedSeat: number | null;
  occupiedSeats: Booking[];
  onSeatSelect: (seatNumber: number) => void;
  onRemoveBooking?: (id: string) => Promise<void>;
}

interface SeatGridProps {
  selectedSeat: number | null;
  occupiedSeats: Booking[];
  onSeatSelect: (seatNumber: number) => void;
  onRemoveBooking?: (id: string) => Promise<void>;
  selectedDate?: string;
  selectedSlot?: number;
}

const SeatGrid: React.FC<SeatGridProps> = ({
  selectedSeat,
  occupiedSeats,
  onSeatSelect,
  onRemoveBooking,
  selectedDate,
  selectedSlot
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [currentSlot, setCurrentSlot] = useState(18);

  const rows = Array.from({ length: 5 }, (_, rowIndex) =>
    PCS.slice(rowIndex * 12, rowIndex * 12 + 12)
  );

  const isPastDate = false; // 날짜 체크 로직 추가 필요

  // 현재 선택된 날짜와 시간대의 예약 목록 (props에서 받은 값 우선 사용)
  const displayDate = selectedDate || currentDate;
  const displaySlot = selectedSlot || currentSlot;
  
  const currentBookings = occupiedSeats.filter(
    booking => booking.date === displayDate && booking.slot_hour === displaySlot
  );

  const handleCancel = async (bookingId: string) => {
    if (onRemoveBooking) {
      try {
        await onRemoveBooking(bookingId);
      } catch (err) {
        console.error('취소 오류:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 좌석 배치도 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-sky-800">좌석 배치도</h3>
          <p className="text-xs text-slate-500">PC실 60개 좌석 실시간 현황</p>
        </div>
        
        {/* 범례 */}
        <div className="flex flex-wrap gap-3 text-[12px] text-slate-600 mb-4 p-4 bg-gray-50 rounded-lg">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-sky-500"></span>
            <span>선택</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-white border border-sky-300"></span>
            <span>가능</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-rose-100 border border-rose-200"></span>
            <span>예약됨</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
            <span>예약불가(57~60)</span>
          </span>
        </div>

        {/* 좌석 그리드 */}
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-12 gap-3 justify-items-center">
              {row.map((seatNumber) => (
                <SeatButton
                  key={seatNumber}
                  seatNumber={seatNumber}
                  isReserved={occupiedSeats.some(booking => booking.pc_number === seatNumber)}
                  isSelected={selectedSeat === seatNumber}
                  isDisabled={NON_RESERVABLE.has(seatNumber) || isPastDate}
                  onSelect={onSeatSelect}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 안내사항 */}
        <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <h4 className="text-sm font-medium text-sky-900 mb-1">예약 안내</h4>
          <p className="text-sm text-sky-800">
            예약 가능 시간: 18:00-21:00 (1시간 단위) · 예약 불가 좌석: 57-60번
          </p>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-sky-800">해당 시간대 예약 목록</h3>
          <p className="text-xs text-slate-500">현재 예약된 좌석 현황</p>
        </div>
        
        {currentBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">예약이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 예약자가 되어보세요!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {currentBookings.map((booking) => (
              <div key={booking.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">
                        {booking.pc_number}번
                      </span>
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {maskName(booking.name)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="truncate">
                        학번: {maskStudentId(booking.student_id)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-medium rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 flex-shrink-0"
                  >
                    취소
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatGrid;