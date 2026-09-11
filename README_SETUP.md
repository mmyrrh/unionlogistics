# UNION 원료 주간 입고 계획

구성:
- `index.html` : Vercel 루트 화면
- `inventory-weekly.html` : 편집 화면
- `team1-view.html` : 생산1팀 보기 화면
- `team2-view.html` : 생산2팀 보기 화면
- `app-shared.js` : 공통 Supabase/화면 로직
- `supabase-config.js` : Supabase Project URL + publishable/anon key
- `supabase_setup.sql` : Supabase 테이블/RLS/Realtime 설정

## 최초 설정
1. Supabase SQL Editor에서 `supabase_setup.sql` 전체 실행
2. GitHub에 파일 업로드/커밋
3. Vercel 프로젝트를 GitHub `mmyrrh/unionlogistics`와 연결
4. Production Deploy
5. 배포 주소에서 정상 동작 확인

현재 프로그램은 로그인 기능이 없으므로 SQL의 RLS 정책은 누구나 읽고 쓸 수 있는 프로토타입 정책입니다.
사내 실사용 전에는 Supabase Auth와 사용자별 RLS를 적용하세요.

## 회사 기본 양식 반영
- `union-logo.png`: 회사 Union 로고
- `union-footer.png`: 제공된 PPT 양식의 하단 청색/적색 라인
- 웹 화면은 PPT와 같은 흰색 바탕 + Union Blue/Red 중심으로 정리했습니다.
