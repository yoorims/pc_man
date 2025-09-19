-- PC실 예약 시스템 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pc_number INTEGER NOT NULL CHECK (pc_number >= 1 AND pc_number <= 60),
  date DATE NOT NULL,
  slot_hour INTEGER NOT NULL CHECK (slot_hour IN (18, 19, 20)),
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(50) NOT NULL DEFAULT '경제학과',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 예약 신청 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 설정 테이블
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_pin VARCHAR(10) NOT NULL DEFAULT '0423',
  notice TEXT,
  webhook_url TEXT,
  blocked_weekdays INTEGER[] DEFAULT '{}',
  blocked_slots INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reservations_date_slot ON reservations(date, slot_hour);
CREATE INDEX IF NOT EXISTS idx_reservations_pc_date_slot ON reservations(pc_number, date, slot_hour);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- 중복 예약 방지 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reservation 
ON reservations(pc_number, date, slot_hour);

-- RLS (Row Level Security) 설정
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 예약을 읽을 수 있도록 허용
CREATE POLICY "모든 사용자가 예약 조회 가능" ON reservations
  FOR SELECT USING (true);

-- 모든 사용자가 예약을 생성할 수 있도록 허용
CREATE POLICY "모든 사용자가 예약 생성 가능" ON reservations
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 자신의 예약을 삭제할 수 있도록 허용
CREATE POLICY "모든 사용자가 예약 삭제 가능" ON reservations
  FOR DELETE USING (true);

-- 관리자 설정은 모든 사용자가 읽을 수 있도록 허용
CREATE POLICY "모든 사용자가 관리자 설정 조회 가능" ON admin_settings
  FOR SELECT USING (true);

-- 관리자 설정은 모든 사용자가 수정할 수 있도록 허용 (실제로는 PIN으로 보호)
CREATE POLICY "모든 사용자가 관리자 설정 수정 가능" ON admin_settings
  FOR ALL USING (true);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_reservations_updated_at 
  BEFORE UPDATE ON reservations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON admin_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 관리자 설정 데이터 삽입
INSERT INTO admin_settings (admin_pin, notice, webhook_url, blocked_weekdays, blocked_slots)
VALUES ('0423', '', '', '{}', '{}')
ON CONFLICT DO NOTHING;
