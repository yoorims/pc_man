# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성/로그인
2. "New Project" 클릭
3. 프로젝트 이름: `pc-reservation-system`
4. 데이터베이스 비밀번호 설정 (기억해두세요!)
5. 지역 선택: `Northeast Asia (Seoul)` (한국에서 가장 빠름)
6. "Create new project" 클릭

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `database/schema.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼 클릭하여 실행

## 3. 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성
2. Supabase 대시보드에서 "Settings" → "API" 클릭
3. 다음 정보를 복사하여 `.env.local`에 입력:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. 앱에서 Supabase 사용하도록 변경

현재는 localStorage를 사용하고 있습니다. Supabase를 사용하려면:

1. `src/App.tsx`에서 import 변경:
```typescript
// 기존
import { useBookings } from "./hooks/useBookings";
import { useAdmin } from "./hooks/useAdmin";

// 변경
import { useSupabaseBookings } from "./hooks/useSupabaseBookings";
import { useSupabaseAdmin } from "./hooks/useSupabaseAdmin";
```

2. 훅 사용 부분 변경:
```typescript
// 기존
const { bookings, ... } = useBookings();
const { adminPin, ... } = useAdmin();

// 변경
const { bookings, ... } = useSupabaseBookings();
const { adminPin, ... } = useSupabaseAdmin();
```

## 5. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 예약 생성/취소 테스트
3. Supabase 대시보드의 "Table Editor"에서 데이터 확인

## 6. 관리자 대시보드

Supabase 대시보드에서:
- **Table Editor**: 예약 데이터 직접 조회/수정
- **SQL Editor**: 복잡한 쿼리 실행
- **API**: REST API 엔드포인트 확인
- **Auth**: 사용자 인증 설정 (필요시)

## 7. 백업 및 보안

- **자동 백업**: Supabase에서 자동으로 백업 제공
- **RLS**: Row Level Security로 데이터 보호
- **API 키**: 환경 변수로 안전하게 관리

## 문제 해결

### 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 권한 오류
- RLS 정책이 올바르게 설정되었는지 확인
- API 키가 올바른지 확인

### 데이터 동기화 문제
- 네트워크 연결 확인
- 브라우저 개발자 도구의 콘솔에서 에러 확인
