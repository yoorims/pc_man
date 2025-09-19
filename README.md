# PC실 예약 시스템

경제학과 PC실 및 스터디룸 예약 시스템입니다.

## 🚀 Vercel 배포 가이드

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 다음 테이블 생성:

```sql
-- 예약 테이블
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pc_number INTEGER NOT NULL,
  date DATE NOT NULL,
  slot_hour INTEGER NOT NULL,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 설정 테이블
CREATE TABLE admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  admin_pin TEXT NOT NULL DEFAULT '1234',
  notice TEXT,
  webhook_url TEXT,
  blocked_weekdays INTEGER[] DEFAULT '{}',
  blocked_slots INTEGER[] DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스터디룸 세션 테이블
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number INTEGER NOT NULL,
  leader_name TEXT NOT NULL,
  leader_student_id TEXT NOT NULL,
  leader_department TEXT NOT NULL,
  leader_phone TEXT NOT NULL,
  others JSONB DEFAULT '[]',
  duration INTEGER NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스터디룸 설정 테이블
CREATE TABLE study_room_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  blocked_weekdays INTEGER[] DEFAULT '{}',
  blocked_study_hours INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 모든 작업 허용 (개발용)
CREATE POLICY "Enable all operations for all users" ON reservations FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON admin_settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON study_sessions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON study_room_settings FOR ALL USING (true);
```

### 2. Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경변수 설정:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key

### 3. 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정하세요:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠️ 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local 파일 생성)
cp env.example .env.local
# .env.local 파일을 편집하여 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

## 📋 기능

- PC실 좌석 예약 (18:00, 19:00, 20:00)
- 스터디룸 예약 (3-6명, 15-120분)
- 관리자 패널 (예약 관리, 공지사항, 설정)
- 데이터 다운로드 (CSV)
- 실시간 예약 현황

## 🔧 기술 스택

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database + Auth)
- Vercel (Hosting)