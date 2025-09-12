import React from "react";
import { PCS, NON_RESERVABLE } from "../types";
import type { Booking, SlotHour } from "../types";

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
  const baseClasses = "inline-flex items-center justify-center h-10 rounded-lg border text-sm font-medium w-12";
  
  const getButtonClasses = () => {
    if (isDisabled) {
      return `${baseClasses} border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed`;
    }
    if (isReserved) {
      return `${baseClasses} border-amber-300 bg-amber-50 text-amber-900`;
    }
    if (isSelected) {
      return `${baseClasses} border-sky-500 bg-sky-50 text-sky-800`;
    }
    return `${baseClasses} border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-white`;
  };

  const getTooltip = () => {
    if (isDisabled) return "예약 불가";
    if (isReserved) return "이미 예약됨";
    return "예약 가능";
  };

  return (
    <button
      className={getButtonClasses()}
      disabled={isDisabled}
      onClick={() => onSelect(seatNumber)}
      title={getTooltip()}
    >
      {seatNumber}
    </button>
  );
};

interface SeatGridProps {
  selectedSeat: number | null;
  occupiedSeats: Map<number, Booking>;
  isPastDate: boolean;
  onSeatSelect: (seatNumber: number | null) => void;
}

const SeatGrid: React.FC<SeatGridProps> = ({
  selectedSeat,
  occupiedSeats,
  isPastDate,
  onSeatSelect
}) => {
  const rows = Array.from({ length: 5 }, (_, rowIndex) =>
    PCS.slice(rowIndex * 12, rowIndex * 12 + 12)
  );

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="text-base font-semibold mb-3">좌석 배치도</h3>
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-12 gap-1">
            {row.map((seatNumber) => (
              <SeatButton
                key={seatNumber}
                seatNumber={seatNumber}
                isReserved={occupiedSeats.has(seatNumber)}
                isSelected={selectedSeat === seatNumber}
                isDisabled={NON_RESERVABLE.has(seatNumber) || isPastDate}
                onSelect={onSeatSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatGrid;
