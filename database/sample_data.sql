-- PC실 예약 시스템 목데이터
-- Supabase SQL Editor에서 실행하세요

-- 관리자 설정 초기 데이터 (이미 스키마에서 생성됨)
-- INSERT INTO admin_settings (admin_pin, notice, webhook_url, blocked_weekdays, blocked_slots)
-- VALUES ('0423', 'PC실 예약 시스템입니다. 예약 시 정확한 정보를 입력해주세요.', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', '{0,6}', '{18}');

-- 예약 목데이터 (다양한 시나리오)
INSERT INTO reservations (pc_number, date, slot_hour, name, student_id, phone, department, applied_at) VALUES
-- 오늘 예약들
(1, CURRENT_DATE, 18, '김철수', '2024123456', '010-1234-5678', '경제학과', CURRENT_DATE - INTERVAL '2 days' + TIME '09:30:00'),
(2, CURRENT_DATE, 18, '이영희', '2024234567', '010-2345-6789', '경영학과', CURRENT_DATE - INTERVAL '1 day' + TIME '14:15:00'),
(3, CURRENT_DATE, 19, '박민수', '2024345678', '010-3456-7890', '경제학과', CURRENT_DATE - INTERVAL '3 days' + TIME '11:45:00'),
(4, CURRENT_DATE, 19, '최지영', '2024456789', '010-4567-8901', '통계학과', CURRENT_DATE - INTERVAL '1 day' + TIME '16:20:00'),
(5, CURRENT_DATE, 20, '정현우', '2024567890', '010-5678-9012', '경제학과', CURRENT_DATE - INTERVAL '2 days' + TIME '13:10:00'),

-- 내일 예약들
(10, CURRENT_DATE + INTERVAL '1 day', 18, '한소영', '2024678901', '010-6789-0123', '경영학과'),
(15, CURRENT_DATE + INTERVAL '1 day', 18, '윤태호', '2024789012', '010-7890-1234', '경제학과'),
(20, CURRENT_DATE + INTERVAL '1 day', 19, '강미래', '2024890123', '010-8901-2345', '통계학과'),
(25, CURRENT_DATE + INTERVAL '1 day', 19, '임동현', '2024901234', '010-9012-3456', '경제학과'),
(30, CURRENT_DATE + INTERVAL '1 day', 20, '서유진', '2024012345', '010-0123-4567', '경영학과'),

-- 모레 예약들
(35, CURRENT_DATE + INTERVAL '2 days', 18, '조성민', '2024123456', '010-1234-5679', '경제학과'),
(40, CURRENT_DATE + INTERVAL '2 days', 18, '노하은', '2024234567', '010-2345-6780', '통계학과'),
(45, CURRENT_DATE + INTERVAL '2 days', 19, '배준호', '2024345678', '010-3456-7891', '경영학과'),
(50, CURRENT_DATE + INTERVAL '2 days', 19, '신예린', '2024456789', '010-4567-8902', '경제학과'),
(55, CURRENT_DATE + INTERVAL '2 days', 20, '오준석', '2024567890', '010-5678-9013', '경제학과'),

-- 이번 주말 예약들
(8, CURRENT_DATE + INTERVAL '3 days', 18, '김다은', '2024678901', '010-6789-0124', '경영학과'),
(12, CURRENT_DATE + INTERVAL '3 days', 18, '이준혁', '2024789012', '010-7890-1235', '경제학과'),
(18, CURRENT_DATE + INTERVAL '3 days', 19, '박서연', '2024890123', '010-8901-2346', '통계학과'),
(22, CURRENT_DATE + INTERVAL '3 days', 19, '최민재', '2024901234', '010-9012-3457', '경제학과'),
(28, CURRENT_DATE + INTERVAL '3 days', 20, '정수빈', '2024012345', '010-0123-4568', '경영학과'),

-- 다음 주 예약들
(33, CURRENT_DATE + INTERVAL '7 days', 18, '한지훈', '2024123456', '010-1234-5680', '경제학과'),
(37, CURRENT_DATE + INTERVAL '7 days', 18, '윤서아', '2024234567', '010-2345-6781', '통계학과'),
(42, CURRENT_DATE + INTERVAL '7 days', 19, '강도현', '2024345678', '010-3456-7892', '경영학과'),
(47, CURRENT_DATE + INTERVAL '7 days', 19, '임채원', '2024456789', '010-4567-8903', '경제학과'),
(52, CURRENT_DATE + INTERVAL '7 days', 20, '서현수', '2024567890', '010-5678-9014', '경제학과'),

-- 과거 예약들 (최근 1주일)
(6, CURRENT_DATE - INTERVAL '1 day', 18, '김민지', '2024678901', '010-6789-0125', '경제학과'),
(14, CURRENT_DATE - INTERVAL '1 day', 19, '이성호', '2024789012', '010-7890-1236', '경영학과'),
(21, CURRENT_DATE - INTERVAL '1 day', 20, '박지은', '2024890123', '010-8901-2347', '통계학과'),

(9, CURRENT_DATE - INTERVAL '2 days', 18, '최우진', '2024901234', '010-9012-3458', '경제학과'),
(16, CURRENT_DATE - INTERVAL '2 days', 19, '정하늘', '2024012345', '010-0123-4569', '경영학과'),
(24, CURRENT_DATE - INTERVAL '2 days', 20, '한승우', '2024123456', '010-1234-5690', '경제학과'),

(11, CURRENT_DATE - INTERVAL '3 days', 18, '윤지현', '2024234567', '010-2345-6791', '통계학과'),
(19, CURRENT_DATE - INTERVAL '3 days', 19, '강민규', '2024345678', '010-3456-7802', '경제학과'),
(26, CURRENT_DATE - INTERVAL '3 days', 20, '임소영', '2024456789', '010-4567-8913', '경영학과'),

(13, CURRENT_DATE - INTERVAL '4 days', 18, '서준영', '2024567890', '010-5678-9024', '경제학과'),
(17, CURRENT_DATE - INTERVAL '4 days', 19, '조예나', '2024678901', '010-6789-0135', '통계학과'),
(23, CURRENT_DATE - INTERVAL '4 days', 20, '노현석', '2024789012', '010-7890-1246', '경제학과'),

(7, CURRENT_DATE - INTERVAL '5 days', 18, '배지윤', '2024890123', '010-8901-2357', '경영학과'),
(29, CURRENT_DATE - INTERVAL '5 days', 19, '신민아', '2024901234', '010-9012-3468', '경제학과'),
(31, CURRENT_DATE - INTERVAL '5 days', 20, '오태준', '2024012345', '010-0123-4579', '통계학과'),

(4, CURRENT_DATE - INTERVAL '6 days', 18, '김하늘', '2024123456', '010-1234-5691', '경제학과'),
(38, CURRENT_DATE - INTERVAL '6 days', 19, '이준서', '2024234567', '010-2345-6702', '경영학과'),
(44, CURRENT_DATE - INTERVAL '6 days', 20, '박서윤', '2024345678', '010-3456-7813', '경제학과'),

(2, CURRENT_DATE - INTERVAL '7 days', 18, '최민호', '2024456789', '010-4567-8924', '통계학과'),
(36, CURRENT_DATE - INTERVAL '7 days', 19, '정유진', '2024567890', '010-5678-9035', '경제학과'),
(48, CURRENT_DATE - INTERVAL '7 days', 20, '한지원', '2024678901', '010-6789-0146', '경영학과');
