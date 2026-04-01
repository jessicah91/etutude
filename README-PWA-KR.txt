ETU-TUDE PWA 무료 배포 패키지

이 패키지는:
1) Vercel 무료 배포
2) Supabase 무료 DB 저장
3) 홈 화면에 추가 가능한 설치형 웹앱(PWA)

구성:
- public/index.html : 사용자 테스트 페이지
- public/admin-login.html : 관리자 로그인
- public/admin.html : 관리자 대시보드
- public/manifest.webmanifest : 설치형 웹앱 설정
- public/sw.js : 오프라인 캐시용 서비스 워커
- public/icons/* : 앱 아이콘
- api/* : Vercel 서버리스 함수
- supabase/schema.sql : Supabase 테이블 생성용 SQL
- .env.example : Vercel 환경변수 예시

정말 쉬운 다음 순서:
1. 이 패키지 압축을 풀고, 안의 파일로 GitHub repo 내용을 교체
2. Supabase 프로젝트 생성
3. SQL Editor에서 supabase/schema.sql 실행
4. Project Settings > API 에서
   - Project URL
   - service_role key
   복사
5. Vercel에서 GitHub repo import
6. 환경변수 입력
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   - ADMIN_SESSION_SECRET
7. Deploy

설치형 웹앱 사용:
- iPhone/iPad: Safari에서 열기 > 공유 > 홈 화면에 추가
- Android/Chrome/데스크톱 Chrome: 설치 배너가 뜨면 설치하기

주의:
- 이 패키지는 무료 구조 기준이라 Render 유료 디스크 없이도 사용 가능하도록 Supabase 저장 방식으로 되어 있음.
- 관리자 비밀번호는 반드시 바꿔서 배포하세요.
