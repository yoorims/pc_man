// UUID 생성
export const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// 오늘 날짜 문자열 생성 (YYYY-MM-DD)
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};


// localStorage 헬퍼 함수들
export function load<T>(key: string, init: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : init;
  } catch {
    return init;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

// 전화번호 정규화 (한국)
export function normalizePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;
  
  // +82 10 xxxx xxxx => 0 10 xxxx xxxx
  if (digits.startsWith("8210") && digits.length === 12) {
    return "0" + digits.slice(2);
  }
  
  if (digits.startsWith("82") && digits.length >= 10) {
    const after = digits.slice(2);
    if (after.startsWith("1") && (after.length === 9 || after.length === 10)) {
      return "0" + after;
    }
  }
  
  // 로컬 모바일: 01x...
  if (digits.startsWith("01")) {
    if (digits.length === 10 || digits.length === 11) {
      return digits;
    }
  }
  
  return null;
}

// 전화번호 포맷팅
export function formatPhone(digits?: string): string {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return digits;
}

// 파일 다운로드 헬퍼
export function downloadBlob(filename: string, data: Blob | string, type = "text/csv"): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// CSV 변환
export function toCsv(rows: (string | number)[][]): string {
  const escape = (v: any) => {
    const s = (v ?? "").toString();
    if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return rows.map((r) => r.map(escape).join(",")).join("\n");
}

// 클립보드 복사
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    alert("클립보드에 복사되었습니다.");
  } catch {
    alert("복사 실패: 브라우저 권한을 확인하세요.");
  }
}
