// 데이터 다운로드 유틸리티 함수들

export interface ExportData {
  date: string; // yy-mm-dd 형식
  name: string;
  studentId: string;
  department: string;
  phone: string;
  seat: string; // 이용좌석
  requestTime: string; // 신청 시간
  startTime: string; // 시작 시간
  endTime: string; // 완료 시간
}

// CSV 다운로드 함수
export const downloadCSV = (data: ExportData[], filename: string) => {
  if (data.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  // CSV 헤더
  const headers = ['날짜', '이름', '학번', '학과', '연락처', '이용좌석', '신청시간', '시작시간', '완료시간'];
  
  // CSV 데이터 생성
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.date,
      `"${row.name}"`,
      `"${row.studentId}"`,
      `"${row.department}"`,
      `"${row.phone}"`,
      `"${row.seat}"`,
      row.requestTime,
      row.startTime,
      row.endTime
    ].join(','))
  ].join('\n');

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 다운로드 실행
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 날짜 포맷 함수 (yy-mm-dd)
export const formatDateForExport = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 시간 포맷 함수 (HH:MM)
export const formatTimeForExport = (timeString: string): string => {
  const date = new Date(timeString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 스터디룸 데이터를 ExportData 형식으로 변환
export const convertStudyRoomData = (sessions: any[]): ExportData[] => {
  return sessions
    .filter(session => session.endAt) // 완료된 세션만
    .map(session => ({
      date: formatDateForExport(new Date(session.startAt).toISOString()),
      name: session.leader.name,
      studentId: session.leader.studentId,
      department: session.leader.department,
      phone: session.leader.phone,
      seat: session.roomNumber.toString(),
      requestTime: formatTimeForExport(new Date(session.createdAt).toISOString()),
      startTime: formatTimeForExport(new Date(session.startAt).toISOString()),
      endTime: formatTimeForExport(new Date(session.endAt).toISOString())
    }));
};

// PC실 데이터를 ExportData 형식으로 변환
export const convertPCData = (bookings: any[]): ExportData[] => {
  return bookings.map(booking => {
    // PC실 예약은 1시간 단위이므로 시작시간과 종료시간 계산
    const startTime = `${booking.slot_hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(booking.slot_hour + 1).toString().padStart(2, '0')}:00`;
    
    return {
      date: formatDateForExport(booking.date),
      name: booking.name,
      studentId: booking.student_id,
      department: booking.department || '경제학과', // 기본값
      phone: booking.phone,
      seat: booking.pc_number.toString(),
      requestTime: formatTimeForExport(new Date(booking.created_at).toISOString()),
      startTime,
      endTime
    };
  });
};
