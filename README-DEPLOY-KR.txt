ETU-TUDE 배포용 패키지

이 폴더는 GitHub + Render 배포 기준으로 정리된 버전입니다.

구성
- public/index.html : 사용자 테스트 페이지
- public/admin-login.html : 관리자 로그인
- public/admin.html : 관리자 대시보드
- server.js : 결과 저장 + 관리자 로그인 서버
- render.yaml : Render 배포 설정
- .env.example : 관리자 계정 예시

GitHub 업로드
1. GitHub에서 새 repository 생성
2. 이 폴더 안 파일을 전부 업로드
3. main 브랜치에 올리기

Render 배포
1. Render 로그인
2. New > Web Service
3. GitHub repository 연결
4. render.yaml 자동 인식되면 그대로 생성
5. Environment Variables 에서
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   값을 꼭 넣기

중요
- Free Render Web Service 는 로컬 파일이 영구 보존되지 않습니다.
- 결과 로그를 계속 남기려면
  1) 유료 Web Service + Persistent Disk 사용 후 DATA_DIR 설정
  또는
  2) DB 방식으로 변경
  이 필요합니다.

관리자 주소
- /admin-login
- /admin

배포 후 테스트
- 테스트를 1번 완료
- 관리자 로그인
- 로그가 보이는지 확인
