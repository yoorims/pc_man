import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qxtpvfeequkrbcrhbvbo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dHB2ZmVlcXVrcmJjcmhidmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjI1MjUsImV4cCI6MjA3MzIzODUyNX0.MmUG__oKLbUo0SLOUi6PE5Dabu8qAAdkZaRGY7CIrDw'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export type SlotHour = 18 | 19 | 20;

export interface Booking {
  id: string
  pc_number: number
  date: string
  slot_hour: SlotHour
  name: string
  student_id: string
  phone: string
  department: string
  applied_at: string // 예약 신청 시간
  created_at: string
  updated_at: string
}

// 호환성을 위한 별칭
export type Reservation = Booking;

export interface AdminSettings {
  id: string
  admin_pin: string
  notice: string | null
  webhook_url: string | null
  blocked_weekdays: number[]
  blocked_slots: number[]
  is_blocked: boolean
  updated_at: string
}
