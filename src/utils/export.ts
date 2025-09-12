import * as XLSX from "xlsx";
import { downloadBlob, toCsv } from "./index";
import { fmtSlot } from "../types";
import type { Booking } from "../types";

// XLSX 쓰기 시도 (실패 시 CSV 폴백)
export function tryXlsxWrite(
  wb: XLSX.WorkBook,
  filename: string,
  csvFallbackRows?: (string | number)[][]
): void {
  try {
    XLSX.writeFile(wb, filename);
  } catch (e) {
    console.error("XLSX write failed, falling back to CSV:", e);
    if (csvFallbackRows) {
      downloadBlob(filename.replace(/\.xlsx$/, ".csv"), toCsv(csvFallbackRows), "text/csv");
      alert("엑셀 저장에 문제가 있어 CSV로 내려받았습니다.");
    } else {
      alert("엑셀 저장에 실패했습니다.");
    }
  }
}

// 특정 날짜의 예약 데이터를 XLSX로 내보내기
export function exportXlsxByDate(bookings: Booking[], date: string): void {
  try {
    const data = bookings
      .filter((b) => b.date === date)
      .sort((a, b) => a.pc - b.pc || a.slotHour - b.slotHour);
    
    const rows = [
      ["PC", "Slot", "Name", "Student ID", "Phone", "Dept", "Created At"],
      ...data.map((b) => [
        b.pc,
        fmtSlot(b.slotHour),
        b.name,
        b.studentId,
        b.phone || "",
        b.department,
        new Date(b.createdAt).toLocaleString()
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, date.slice(5));
    tryXlsxWrite(wb, `pclab_${date}.xlsx`, rows);
  } catch (e) {
    exportCsvByDate(bookings, date);
  }
}

// 전체 예약 데이터를 XLSX로 내보내기
export function exportXlsxAll(bookings: Booking[]): void {
  try {
    const wb = XLSX.utils.book_new();
    const byDate: Record<string, Booking[]> = {};
    
    bookings.forEach((b) => {
      (byDate[b.date] ||= []).push(b);
    });
    
    const header = ["PC", "Slot", "Name", "Student ID", "Phone", "Dept", "Created At"];

    Object.keys(byDate)
      .sort()
      .forEach((d) => {
        const rows = byDate[d]
          .sort((a, b) => a.pc - b.pc || a.slotHour - b.slotHour)
          .map((b) => [
            b.pc,
            fmtSlot(b.slotHour),
            b.name,
            b.studentId,
            b.phone || "",
            b.department,
            new Date(b.createdAt).toLocaleString()
          ]);
        
        const ws = XLSX.utils.aoa_to_sheet([[`Date: ${d}`], header, ...rows]);
        ws["!freeze"] = { xSplit: 0, ySplit: 2 };
        ws["!cols"] = [
          { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
          { wch: 12 }, { wch: 10 }, { wch: 22 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, d.slice(5));
      });

    // 요약 시트 생성
    const dates = Object.keys(byDate).sort();
    const sumHeader = ["Date", "18:00", "19:00", "20:00", "Total"];
    const sumRows = dates.map((d) => {
      const base = { 18: 0, 19: 0, 20: 0 } as Record<18 | 19 | 20, number>;
      byDate[d].forEach((b) => {
        base[b.slotHour]++;
      });
      const total = base[18] + base[19] + base[20];
      return [d, base[18], base[19], base[20], total];
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet([sumHeader, ...sumRows]);
    ws2["!freeze"] = { xSplit: 1, ySplit: 1 };
    ws2["!cols"] = [
      { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    // CSV 폴백용 데이터 준비
    const csvRows: (string | number)[][] = [
      ["Date", "PC", "Slot", "Name", "Student ID", "Phone", "Dept", "Created At"]
    ];
    dates.forEach((d) => {
      byDate[d]
        .sort((a, b) => a.pc - b.pc || a.slotHour - b.slotHour)
        .forEach((b) =>
          csvRows.push([
            d,
            b.pc,
            fmtSlot(b.slotHour),
            b.name,
            b.studentId,
            b.phone || "",
            b.department,
            new Date(b.createdAt).toLocaleString()
          ])
        );
    });

    tryXlsxWrite(wb, `pclab_all.xlsx`, csvRows);
  } catch (e) {
    exportCsvAll(bookings);
  }
}

// 특정 날짜의 예약 데이터를 CSV로 내보내기
export function exportCsvByDate(bookings: Booking[], date: string): void {
  const data = bookings
    .filter((b) => b.date === date)
    .sort((a, b) => a.pc - b.pc || a.slotHour - b.slotHour);
  
  const rows: (string | number)[][] = [
    ["PC", "Slot", "Name", "Student ID", "Phone", "Dept", "Created At"],
    ...data.map((b) => [
      b.pc,
      fmtSlot(b.slotHour),
      b.name,
      b.studentId,
      b.phone || "",
      b.department,
      new Date(b.createdAt).toLocaleString()
    ])
  ];
  
  downloadBlob(`pclab_${date}.csv`, toCsv(rows), "text/csv");
}

// 전체 예약 데이터를 CSV로 내보내기
export function exportCsvAll(bookings: Booking[]): void {
  const byDate: Record<string, Booking[]> = {};
  bookings.forEach((b) => {
    (byDate[b.date] ||= []).push(b);
  });
  
  const dates = Object.keys(byDate).sort();
  const rows: (string | number)[][] = [
    ["Date", "PC", "Slot", "Name", "Student ID", "Phone", "Dept", "Created At"]
  ];
  
  dates.forEach((d) => {
    byDate[d]
      .sort((a, b) => a.pc - b.pc || a.slotHour - b.slotHour)
      .forEach((b) =>
        rows.push([
          d,
          b.pc,
          fmtSlot(b.slotHour),
          b.name,
          b.studentId,
          b.phone || "",
          b.department,
          new Date(b.createdAt).toLocaleString()
        ])
      );
  });
  
  downloadBlob(`pclab_all.csv`, toCsv(rows), "text/csv");
}
