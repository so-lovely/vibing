1) 핵심 요약 (한눈에)
목적: 개발자 대상 소프트웨어(라이브러리, CLI, SaaS 구독, 바이너리 등) 판매용 오픈마켓
핵심 특성: 제품 카탈로그, 결제(구독/일회성), 라이선스 키/다운로드, 판매자 대시보드, 리뷰·평점, 검색·카테고리·필터
스택:
Frontend: React + TypeScript + Vite
UI / 스타일: Tailwind CSS + shadcn/ui (Radix) + lucide-react 아이콘 (또는 Heroicons) — (원하면 Mantine 대안 가능)
State/Data fetching: TanStack Query (react-query) + React Context or Zustand
Backend: Go (Golang) + Fiber
DB: PostgreSQL
파일저장: S3 호환 (AWS S3 / DigitalOcean Spaces)
캐시/세션: Redis
결제/구독: Stripe (국내 상황에 따라 Paddle 고려)
인증: JWT + refresh token / OAuth (GitHub, Google)
배포: Docker + CI (GitHub Actions) → AWS ECS/Fargate 또는 Render / Vercel(프론트)
인프라 IaC: Terraform (선택사항)
2) 디자인 & 스타일 가이드 (깔끔 · 현대 · 세련)
테마 토큰
Primary: #0f172a (진한 네이비) 또는 #0ea5a4 (터키블루 계열) — 개발자 느낌 + 모던
Accent: #7c3aed (라일락) 또는 #06b6d4
Surface / Background: #0f172a / #0b1220 (어두운 테마) + #ffffff / #f8fafc (라이트 테마)
Muted text: #64748b
Success / Danger: #10b981, #ef4444
Border / Divider: rgba(15,23,42,0.06)
(테마는 다크 우선 + 라이트 옵션 제공 — 개발자 대상이라 다크 모드 기본 제안)
타이포그래피
폰트 패밀리: Inter (UI) + JetBrains Mono (코드 블록)
계층:
H1: 36px / 700
H2: 28px / 600
H3: 20px / 600
Body: 16px / 400
Small: 14px / 400
라인하이트 권장: 1.4 ~ 1.6
디자인 원칙
충분한 여백(간격 단위: 4px 기반, 8/12/16/24/32)
그리드: 컨테이너 1200px 중심, 반응형: sm/ md / lg / xl 브레이크포인트
카드 기반 레이아웃, 최소 12px radius for soft corners
아이콘은 라인 아이콘(간결) — lucide-react 권장
접근성
색 대비 WCAG AA 이상
폼 라벨/에러 메시지 ARIA 태그
키보드 네비게이션(탭순), 스크린리더 라벨
이미지 대체 텍스트 필수
컴포넌트 목록 (디자인 시스템)
프레임/레이아웃: Header, Footer, Main container, Grid/List
탐색: 검색 바(자동완성), 카테고리 사이드바, 태그
상품: Product Card, Product Detail (readme/스크린샷/릴리즈 노트), 파일 다운로드 버튼
판매자: Seller Dashboard, Product Upload Form, Sales Report
결제: Checkout 페이지, 결제 상태 페이지, 구독 관리
계정: 로그인/회원가입, 프로필, 라이선스 관리, 구매내역
모달/툴팁/드롭다운/Toast/배지
코드 블록, changelog / release notes 뷰 (syntax highlight)

3) 프로젝트 구조 및 현재 구현 상태
Frontend 구조:
- `data/auth/` - 인증 관련 목 데이터 및 API 시뮬레이션 ✅
- `data/products/` - 제품 목 데이터 및 카테고리 정보 ✅
- `contexts/` - React Context (AuthContext, ProductsContext for 전역 상태) ✅  
- `components/auth/` - 인증 관련 컴포넌트 (로그인, 회원가입, 사용자 메뉴, 보호된 라우트) ✅
- `components/ui/` - shadcn/ui 기반 디자인 시스템 컴포넌트 ✅
- `components/` - 제품 관련 컴포넌트 (ProductCard, ProductGrid, ProductFilters, CategorySidebar) ✅
- `pages/` - 페이지 컴포넌트 (ProductsPage) ✅

인증 시스템:
- 목 데이터를 사용한 로그인/회원가입 기능 구현
- 역할 기반 접근 제어 (구매자/판매자/관리자)
- 반응형 디자인 및 접근성 준수
- 테스트 계정: developer@example.com, seller@example.com, admin@vibing.com (비밀번호: password123)

제품 카탈로그 시스템:
- 12개 제품 목 데이터 (다양한 카테고리: 라이브러리, CLI, 웹템플릿, AI/ML, 디자인, 보안, 모바일, 데이터베이스, 패키지관리)
- 10개 카테고리 분류 및 아이콘 매핑
- 검색, 정렬, 가격 필터링 기능
- 페이지네이션 (12개씩)
- 좋아요 토글 기능

구현 완료 항목:
✅ 목 데이터 인증 시스템
✅ 로그인/회원가입 모달 컴포넌트  
✅ 사용자 메뉴 및 드롭다운
✅ 인증 컨텍스트 및 상태 관리
✅ 보호된 라우트 컴포넌트
✅ 헤더에 인증 상태 반영
✅ 반응형 디자인 유지

✅ 제품 카탈로그 시스템
✅ 제품 목 데이터 (12개 다양한 카테고리)
✅ 제품 컨텍스트 및 상태 관리 (ProductsContext)
✅ 카테고리 사이드바 (활성 상태 및 필터링)
✅ 제품 필터 컴포넌트 (검색, 정렬, 가격 필터)
✅ 제품 그리드 (페이지네이션, 로딩 상태)
✅ 전용 제품 페이지 (/products, /categories 라우트)
✅ 검색 기능 (제목, 설명, 작성자, 태그)

✅ 관리자 패널 시스템
✅ 관리자 컨텍스트 및 상태 관리 (AdminContext)
✅ 관리자 대시보드 레이아웃 (AdminDashboard)
✅ 사용자 관리 (역할 변경, 삭제)
✅ 제품 관리 (승인, 삭제, 상세보기)
✅ 통계 카드 (사용자 수, 제품 수, 매출 정보)
✅ 관리자 전용 접근 제어 (/admin 라우트)
✅ 사용자 메뉴에 관리자 패널 링크 추가

- Maintain overall design while implement any
- Keep responsive design
- Divide by components or contexts while implementing