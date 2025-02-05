## 1. 전체 아키텍처 개요

### 1.1. 시스템 구성
- **백엔드 서버**:  
  - **FastAPI** 프레임워크를 사용하여 RESTful API를 구현  
  - 세션 기반 인증을 통한 사용자 로그인 및 권한 관리  
- **데이터베이스**:  
  - **PostgreSQL**를 사용하여 관계형 데이터 관리  
  - 주요 테이블: 사용자, 역할, 게시판, 게시물, 게시물 첨부파일, 권한, 강의실 정보  
- **인증/권한 관리**:  
  - 사용자 로그인 시 세션을 생성하고, 세션 데이터에 사용자 ID 및 역할 정보를 저장  
  - API 요청마다 세션을 참조하여 접근 제어를 수행  
- **정적 콘텐츠**:  
  - 학부 소개, 교수진 정보 등 변경 빈도가 낮은 페이지는 프론트엔드 정적 파일 또는 별도 CMS로 관리

### 1.2. 개발 및 협업 도구
- **버전 관리**: Git (GitHub 저장소 사용)
- **CI/CD**: GitHub Actions를 사용한 자동화 빌드, 테스트 및 배포
- **문서화**: Swagger/OpenAPI를 활용하여 API 문서 자동 생성 및 업데이트
- **테스트**: pytest 또는 FastAPI 내장 테스트 도구를 활용한 단위 및 통합 테스트

---

## 2. 데이터베이스 설계

각 테이블은 PostgreSQL을 기준으로 하며, 적절한 데이터 타입, 제약 조건, 외래키 및 인덱스를 적용합니다.

### 2.1. 사용자(User) 테이블
- **목적**: 시스템 사용자 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `username`: VARCHAR, UNIQUE, 로그인 아이디 (고유 식별)
  - `password`: VARCHAR, 암호화된 비밀번호 (bcrypt 또는 유사 해시 알고리즘 적용)
  - `email`: VARCHAR, 계정 찾기 및 학생 인증용
  - `school_info`: TEXT, 사용자의 학교 관련 정보
  - `role_id`: BIGINT, Foreign Key → 역할 테이블 (`role.id`)
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, 업데이트 시 자동 갱신

### 2.2. 역할(Role) 테이블
- **목적**: 사용자 그룹(역할) 정의
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `name`: VARCHAR, UNIQUE; 예: Administrator, Sub Administrator, Professor, Student, Anonymous
  - `description`: TEXT, 역할 설명 및 특이 사항
  - `created_at`: TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.3. 게시판(Board) 테이블
- **목적**: 각 게시판 정보 관리 (공지사항, 커뮤니티 등)
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `title`: VARCHAR, 게시판 제목
  - `metadata`: JSON 또는 TEXT, 공개 여부, 게시판 유형, 토픽, 학년, 전공 수업 관련 태그 등 추가 설정
  - `created_at`: TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.4. 게시물(Post) 테이블
- **목적**: 게시판에 작성된 게시물 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `board_id`: BIGINT, Foreign Key → 게시판(Board) 테이블
  - `title`: VARCHAR, 게시물 제목
  - `content`: LONGTEXT, HTML 형식으로 게시물 내용 저장
  - `author_id`: BIGINT, Foreign Key → 사용자(User) 테이블
  - `created_at`: TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.5. 게시물 첨부파일(PostAttachment) 테이블
- **목적**: 게시물에 첨부된 파일 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `post_id`: BIGINT, Foreign Key → 게시물(Post) 테이블
  - `metadata`: JSON 또는 TEXT, 파일 크기, MIME 타입, 업로드 일시 등
  - `url`: VARCHAR, 파일 접근 URL
  - `created_at`: TIMESTAMP

### 2.6. 권한(Permission) 테이블 (리소스 일반화 적용)
- **목적**: 역할별 리소스 접근 권한(CRUD) 관리  
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `role_id`: BIGINT, Foreign Key → 역할(Role) 테이블
  - `resource_type`: VARCHAR, 리소스 유형 (예: "board", "classroom")
  - `resource_id`: BIGINT, 해당 리소스의 식별자 (예: board.id, classroom.id)
  - `can_read`: BOOLEAN
  - `can_create`: BOOLEAN
  - `can_update`: BOOLEAN
  - `can_delete`: BOOLEAN
  - `created_at`: TIMESTAMP
  - `updated_at`: TIMESTAMP
- **특이사항**: 복합 인덱스(`role_id`, `resource_type`, `resource_id`)에 UNIQUE 제약 조건 적용

### 2.7. 강의실(Classroom) 테이블
- **목적**: 강의실 안내 및 추후 예약/신청 기능을 위한 정보 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `title`: VARCHAR, 강의실 제목
  - `metadata`: JSON 또는 TEXT, 강의실 위치, 크기, 시설 등 추가 정보
  - `created_at`: TIMESTAMP
  - `updated_at`: TIMESTAMP

---

## 3. 권한 및 인증 체계

### 3.1. 인증 방식
- **세션 기반 인증**:
  - 사용자 로그인 시 서버에서 세션을 생성하여 사용자 ID, 역할 등 필요한 정보를 저장  
  - 클라이언트에는 세션 ID를 포함한 쿠키를 발행하며, 이후 API 호출 시 쿠키를 통해 인증 정보 확인  
  - 세션 스토어는 Redis나 PostgreSQL의 별도 테이블을 활용할 수 있음

### 3.2. 권한 검사 로직
- **미들웨어 구현**:
  1. API 호출 시 요청 쿠키에서 세션 ID 추출 및 세션 검증  
  2. 세션 내 사용자 역할과 ID를 확인하여 요청한 리소스의 타입(예: "board")과 ID, 요청 액션(읽기, 생성, 수정, 삭제)을 결정  
  3. 권한(Permission) 테이블에서 `role_id`, `resource_type`, `resource_id`에 대해 해당 작업에 대한 권한(`can_read`, `can_create`, 등) 여부를 확인  
  4. 권한 부족 시 403 Forbidden 응답 반환  
- **Anonymous 처리**:
  - 비로그인 사용자는 기본적으로 `Anonymous` 역할로 간주되어, 권한 테이블에 등록된 열람 권한만 적용

---

## 4. API 설계

### 4.1. 엔드포인트 예시

#### 인증 및 사용자 관리
- `POST /api/auth/login`  
  - 로그인 (username, password) → 세션 생성 및 쿠키 발행
- `POST /api/auth/logout`  
  - 로그아웃 → 세션 삭제
- `POST /api/auth/register`  
  - 회원가입 (필요 시, 관리자 승인 후 활성화)
- `GET /api/users/me`  
  - 현재 로그인한 사용자의 정보 조회
- `PUT /api/users/me`  
  - 현재 사용자 정보 수정

#### 게시판 및 게시물 관리
- **게시판**
  - `GET /api/boards`  
    - 모든 게시판 목록 조회
  - `GET /api/boards/{board_id}`  
    - 특정 게시판 상세 정보 조회
  - **(관리자 전용)**  
    - `POST /api/boards` : 게시판 생성  
    - `PUT /api/boards/{board_id}` : 게시판 수정  
    - `DELETE /api/boards/{board_id}` : 게시판 삭제

- **게시물**
  - `GET /api/boards/{board_id}/posts`  
    - 특정 게시판의 게시물 목록 조회  
    - 토픽, 학년, 전공 등 필터링 지원 (쿼리 파라미터 활용)
  - `GET /api/posts/{post_id}`  
    - 특정 게시물 조회
  - `POST /api/boards/{board_id}/posts`  
    - 게시물 작성 (세션 및 권한 검사)
  - `PUT /api/posts/{post_id}`  
    - 게시물 수정 (작성자 또는 권한 검사)
  - `DELETE /api/posts/{post_id}`  
    - 게시물 삭제 (작성자 또는 권한 검사)

- **게시물 첨부파일**
  - `POST /api/posts/{post_id}/attachments`  
    - 파일 업로드 및 첨부 (파일 저장소 연동)
  - `GET /api/posts/{post_id}/attachments`  
    - 첨부파일 목록 조회

#### 강의실 관련
- `GET /api/classrooms`  
  - 강의실 정보 조회 (단순 안내용)
- *(추후 확장)*  
  - `POST /api/classrooms/{id}/reservations` : 예약/신청 관련 API

#### 관리자 전용 API
- **권한 관리**
  - `GET /api/permissions`  
    - 전체 권한 목록 조회 (필터: 역할, 리소스 타입 등)
  - `PUT /api/permissions/{permission_id}`  
    - 특정 권한 수정 (CRUD 값 변경)

---

## 5. 구현 및 확장 전략

### 5.1. 모듈 및 레이어 구조
- **컨트롤러 (Router)**: FastAPI의 APIRouter를 이용해 각 리소스별 엔드포인트 구현
- **서비스 레이어**: 비즈니스 로직(세션 관리, 권한 검사, 데이터 처리 등)을 별도 모듈로 분리
- **데이터 접근 계층 (Repository)**: SQLAlchemy 또는 async ORM(Tortoise ORM 등)을 활용하여 PostgreSQL과 상호작용
- **미들웨어**: 세션 관리, 인증/권한 검사, 로깅, 에러 핸들링 등을 구현

### 5.2. 리소스 일반화 적용
- **권한 테이블**: `resource_type`과 `resource_id` 컬럼을 활용하여 게시판, 강의실 등 다양한 리소스에 대해 일관된 권한 체계를 제공
- 추후 리소스가 추가되면, 해당 리소스의 CRUD 권한을 별도 권한 설정 없이 통합 테이블에서 관리 가능

### 5.3. CI/CD 및 테스트 전략
- **버전 관리**: Git을 사용하여 코드 관리 및 협업 진행
- **CI/CD**: GitHub Actions를 이용해 푸시, PR 시 자동 테스트, 빌드, (필요시) 배포 진행
- **테스트**: pytest 기반 단위 테스트 및 통합 테스트 작성  
  - API 테스트 시 FastAPI의 TestClient 활용
- **문서화**: FastAPI의 OpenAPI 자동 문서 기능(Swagger UI)로 최신 API 명세 유지

### 5.4. 보안 고려 사항
- 비밀번호는 bcrypt 등의 안전한 해시 함수로 암호화
- 세션 관리 시, CSRF 방지 및 세션 탈취 방지를 위한 추가 보안 설정 (예: HttpOnly, Secure 쿠키)
- HTML 컨텐츠 저장 시 XSS 필터링 적용
- HTTPS를 통한 안전한 통신 보장