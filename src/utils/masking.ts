// 개인정보 마스킹 유틸리티 함수들

/**
 * 이름을 마스킹합니다 (첫 글자만 표시, 나머지는 **)
 * @param name 원본 이름
 * @returns 마스킹된 이름 (예: "김철수" -> "김**")
 */
export const maskName = (name: string): string => {
  if (!name || name.length === 0) return '';
  if (name.length === 1) return name;
  return name.charAt(0) + '**';
};

/**
 * 학번을 마스킹합니다
 * @param studentId 원본 학번
 * @returns 마스킹된 학번
 * - 8자리(학부생): 20 이후 6자리를 *로 표시 (예: "20201234" -> "20******")
 * - 9자리(대학원생): 120, 220, 320 이후 6자리를 *로 표시 (예: "202012345" -> "202******")
 */
export const maskStudentId = (studentId: string): string => {
  if (!studentId || studentId.length === 0) return '';
  
  // 8자리 학부생 (20으로 시작)
  if (studentId.length === 8 && studentId.startsWith('20')) {
    return studentId.substring(0, 2) + '******';
  }
  
  // 9자리 대학원생 (120, 220, 320으로 시작)
  if (studentId.length === 9 && (studentId.startsWith('120') || studentId.startsWith('220') || studentId.startsWith('320'))) {
    return studentId.substring(0, 3) + '******';
  }
  
  // 기타 경우 (기존 로직 유지)
  if (studentId.length <= 3) return studentId;
  return studentId.substring(0, 3) + '**'.repeat(Math.max(1, studentId.length - 3));
};

/**
 * 전화번호를 마스킹합니다 (앞 3자리와 뒤 4자리만 표시)
 * @param phone 원본 전화번호
 * @returns 마스킹된 전화번호 (예: "010-1234-5678" -> "010-****-5678")
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length === 0) return '';
  
  // 하이픈이 있는 경우
  if (phone.includes('-')) {
    const parts = phone.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
  }
  
  // 하이픈이 없는 경우 (11자리)
  if (phone.length === 11) {
    return `${phone.substring(0, 3)}-****-${phone.substring(7)}`;
  }
  
  // 기타 경우
  if (phone.length > 7) {
    return `${phone.substring(0, 3)}-****-${phone.substring(phone.length - 4)}`;
  }
  
  return phone;
};
