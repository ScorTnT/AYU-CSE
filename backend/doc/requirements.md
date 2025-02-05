# 백엔드 개발 계획서

## 1. 전체 아키텍처 개요

### 1.1. 시스템 구성
- **백엔드 서버**:  
  - **FastAPI**를 사용하여 RESTful API를 구현합니다.
  - 세션 기반 인증을 통해 사용자 로그인 및 권한 관리를 수행합니다.
- **데이터베이스**:  
  - **PostgreSQL**을 사용하여 관계형 데이터를 관리합니다.
  - 주요 테이블: 사용자, 역할, 게시판, 게시물, 게시물 첨부파일, 권한, 강의실, 세션
- **인증/권한 관리**:  
  - 사용자가 로그인하면 서버에서 세션을 생성하고, 세션 테이블에 사용자 ID, 역할, 생성/만료 시간 등의 정보를 저장합니다.
  - API 요청 시 클라이언트 쿠키의 세션 토큰을 확인하여, 세션 테이블을 참조한 후 인증 및 권한 검사를 수행합니다.
- **정적 콘텐츠**:  
  - 학부 소개, 교수진 정보 등 변경 빈도가 낮은 페이지는 프론트엔드 정적 파일 또는 별도 CMS로 관리합니다.

### 1.2. 개발 및 협업 도구
- **버전 관리**: Git (GitHub 사용)
- **CI/CD**: GitHub Actions를 통한 자동 빌드, 테스트 및 배포
- **문서화**: Swagger/OpenAPI를 활용한 API 문서 자동 생성
- **테스트**: pytest 및 FastAPI의 TestClient를 활용한 단위 및 통합 테스트

---

## 2. 데이터베이스 설계

각 테이블은 PostgreSQL을 기준으로 하며, 적절한 데이터 타입, 제약 조건, 외래키 및 인덱스를 적용합니다.

### 2.1. 사용자(User) 테이블
- **목적**: 시스템 사용자 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment  
  - `username`: VARCHAR, UNIQUE  
    *로그인 아이디 (예: username)*
  - `password`: VARCHAR  
    *암호화된 비밀번호 (bcrypt 등 사용)*
  - `email`: VARCHAR  
    *계정 찾기 및 학생 인증용*
  - `school_info`: TEXT  
    *사용자의 학교 관련 정보*
  - `role_id`: BIGINT, Foreign Key → 역할(Role) 테이블  
    *단일 역할 적용 (관리자, 서브 관리자, 교수님, 학생, Anonymous)*
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, 업데이트 시 자동 갱신 (또는 애플리케이션 로직으로 처리)

### 2.2. 역할(Role) 테이블
- **목적**: 사용자 그룹(역할) 정의
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `name`: VARCHAR, UNIQUE  
    *(예: Administrator, Sub Administrator, Professor, Student, Anonymous)*
  - `description`: TEXT  
    *역할 설명 및 특이 사항*
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.3. 게시판(Board) 테이블
- **목적**: 각 게시판 정보 관리 (공지사항, 커뮤니티 등)
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `title`: VARCHAR  
    *게시판 제목*
  - `metadata`: JSON 또는 TEXT  
    *게시판 설정 – 공개 여부, 게시판 유형, 토픽, 학년, 전공 수업 관련 태그 등*
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.4. 게시물(Post) 테이블
- **목적**: 게시판에 작성된 게시물 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `board_id`: BIGINT, Foreign Key → 게시판(Board) 테이블
  - `title`: VARCHAR  
    *게시물 제목*
  - `content`: LONGTEXT  
    *HTML 형식의 게시물 내용*
  - `author_id`: BIGINT, Foreign Key → 사용자(User) 테이블
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.5. 게시물 첨부파일(PostAttachment) 테이블
- **목적**: 게시물에 첨부된 파일 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `post_id`: BIGINT, Foreign Key → 게시물(Post) 테이블
  - `metadata`: JSON 또는 TEXT  
    *파일 크기, MIME 타입, 업로드 일시 등*
  - `url`: VARCHAR  
    *파일 접근 URL*
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.6. 권한(Permission) 테이블 (리소스 일반화 적용)
- **목적**: 역할별 리소스 접근 권한(CRUD) 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `role_id`: BIGINT, Foreign Key → 역할(Role) 테이블
  - `resource_type`: VARCHAR  
    *리소스 유형 (예: "board", "classroom")*
  - `resource_id`: BIGINT  
    *해당 리소스의 식별자 (예: board.id, classroom.id)*
  - `can_read`: BOOLEAN
  - `can_create`: BOOLEAN
  - `can_update`: BOOLEAN
  - `can_delete`: BOOLEAN
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP
- **인덱싱**: (`role_id`, `resource_type`, `resource_id`) 복합 인덱스 및 UNIQUE 제약 조건

### 2.7. 강의실(Classroom) 테이블
- **목적**: 강의실 안내 및 추후 예약/신청 기능 확장을 위한 정보 관리
- **컬럼**:
  - `id`: BIGINT, Primary Key, Auto Increment
  - `title`: VARCHAR  
    *강의실 제목*
  - `metadata`: JSON 또는 TEXT  
    *강의실 위치, 크기, 시설 등 추가 정보*
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP

### 2.8. 세션(Session) 테이블
- **목적**: 세션 기반 인증 관리를 위한 임시 데이터 저장  
  세션 데이터는 빠르게 생성되고 삭제되며, 예측 불가능한 값(예: UUID 기반 토큰)을 사용하여 보안을 강화합니다.
- **컬럼**:
  - `session_id`: UUID 또는 VARCHAR, Primary Key  
    *예측 불가능한 세션 식별자 (Auto Increment 대신 UUID 사용)*
  - `user_id`: BIGINT, Foreign Key → 사용자(User) 테이블
  - `created_at`: TIMESTAMP, 기본값 CURRENT_TIMESTAMP  
    *세션 생성 시각*
  - `expires_at`: TIMESTAMP  
    *세션 만료 시각 (예: 30분, 1시간 후 만료)*
  - `ip_address`: VARCHAR  
    *(선택 사항) 로그인 시 클라이언트 IP 기록*
  - `user_agent`: VARCHAR  
    *(선택 사항) 클라이언트 브라우저 정보 기록*
  - **업데이트 타임스탬프**: 필요 시 갱신 처리 (세션 갱신 로직에 따라 적용)

---

## 3. 권한 및 인증 체계

### 3.1. 인증 방식: 세션 기반 인증
- **로그인**:  
  - 사용자가 로그인하면, 서버에서 사용자의 인증 정보를 확인한 후 UUID 기반의 세션 토큰을 생성합니다.
  - 생성된 세션 정보는 세션 테이블에 저장되며, 클라이언트에는 해당 세션 토큰을 HttpOnly, Secure 쿠키로 전달합니다.
- **API 요청 시**:  
  - 클라이언트는 쿠키에 저장된 `session_id`를 함께 전송합니다.
  - 미들웨어는 세션 테이블에서 해당 `session_id`를 조회하여 세션의 유효성 및 만료 여부를 확인합니다.
  - 유효한 세션의 경우, 관련 사용자 정보(사용자 ID, 역할)를 요청 컨텍스트에 포함시켜 권한 검사를 수행합니다.
- **로그아웃**:  
  - 로그아웃 API 호출 시, 해당 `session_id`에 대한 세션 레코드를 삭제하거나 만료 처리합니다.

### 3.2. 권한 검사 로직
- 모든 API 요청에 대해 아래 단계를 미들웨어에서 수행합니다:
  1. 요청 쿠키에서 `session_id` 추출 및 세션 테이블 조회  
  2. 세션 유효성(존재 및 만료 여부) 확인  
  3. 세션으로부터 사용자 ID 및 역할을 확인한 후, 요청된 리소스의 타입(예: "board")과 ID, 요청 작업(읽기, 생성, 수정, 삭제)을 파악
  4. 권한(Permission) 테이블을 조회하여 해당 역할의 작업 권한(`can_read`, `can_create`, `can_update`, `can_delete`)을 확인
  5. 권한 부족 시 403 Forbidden 응답 반환
- **Anonymous 처리**:  
  - 비로그인 사용자는 기본적으로 `Anonymous` 역할로 간주되어, 등록된 열람 권한만 부여합니다.

---

## 4. API 설계

### 4.1. 인증 및 사용자 관리 엔드포인트
- `POST /api/auth/login`  
  - **입력**: username, password  
  - **동작**: 인증 후 세션 생성 → UUID 기반 `session_id`를 쿠키에 설정하여 응답
- `POST /api/auth/logout`  
  - **동작**: 요청된 세션 토큰 기반으로 세션 테이블에서 해당 세션 삭제 또는 만료 처리
- `POST /api/auth/register`  
  - **동작**: 회원가입 (필요 시, 관리자 승인 후 활성화)
- `GET /api/users/me`  
  - **동작**: 현재 로그인한 사용자의 정보 조회
- `PUT /api/users/me`  
  - **동작**: 현재 사용자 정보 수정

### 4.2. 게시판 및 게시물 관리 엔드포인트
- **게시판**
  - `GET /api/boards`  
    - 모든 게시판 목록 조회
  - `GET /api/boards/{board_id}`  
    - 특정 게시판 상세 정보(메타데이터 포함) 조회
  - **(관리자 전용)**  
    - `POST /api/boards` : 게시판 생성  
    - `PUT /api/boards/{board_id}` : 게시판 수정  
    - `DELETE /api/boards/{board_id}` : 게시판 삭제
- **게시물**
  - `GET /api/boards/{board_id}/posts`  
    - 특정 게시판의 게시물 목록 조회  
    - (토픽, 학년, 전공 등 필터 지원)
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
    - 파일 업로드 및 첨부 (외부 파일 저장소 연동)
  - `GET /api/posts/{post_id}/attachments`  
    - 첨부파일 목록 조회

### 4.3. 강의실 관련 엔드포인트
- `GET /api/classrooms`  
  - 강의실 정보 조회 (초기에는 단순 안내용)
- *(추후 확장)*  
  - 예: `POST /api/classrooms/{id}/reservations` – 예약/신청 관련 API

### 4.4. 관리자 전용 API
- **권한 관리**
  - `GET /api/permissions`  
    - 전체 권한 목록 조회 (필터: 역할, 리소스 타입 등)
  - `PUT /api/permissions/{permission_id}`  
    - 특정 권한 수정 (CRUD 플래그 변경)
- **동적 설정** (향후 관리자 페이지 연계)  
  - 게시판, 강의실 등 리소스에 대한 권한 동적 변경 및 추가

---

## 5. 구현 및 확장 전략

### 5.1. 모듈 및 레이어 구조
- **컨트롤러 (Router)**:  
  - FastAPI의 APIRouter를 사용하여 리소스별 엔드포인트를 구현합니다.
- **서비스 레이어**:  
  - 비즈니스 로직(세션 관리, 권한 검사, 데이터 처리 등)을 별도 모듈로 분리합니다.
- **데이터 접근 계층 (Repository)**:  
  - SQLAlchemy 또는 async ORM(Tortoise ORM 등)을 사용하여 PostgreSQL과 상호작용합니다.
- **미들웨어**:  
  - 세션 추출, 인증/권한 검사, 로깅, 에러 핸들링 등을 구현합니다.

### 5.2. 리소스 일반화
- **권한 테이블**의 `resource_type`과 `resource_id` 컬럼을 활용하여, 게시판 외에 강의실 등 다른 리소스에 대해서도 일관된 권한 관리 체계를 적용합니다.
- 새로운 리소스 유형이 추가되더라도 별도의 권한 테이블 분리 없이 통합 관리할 수 있도록 설계합니다.

### 5.3. CI/CD 및 테스트 전략
- **버전 관리**: Git 및 GitHub를 사용하여 코드 관리 및 협업합니다.
- **CI/CD**: GitHub Actions를 통해 코드 푸시 및 PR 시 자동 테스트, 빌드, (필요시) 배포를 진행합니다.
- **테스트**: pytest와 FastAPI TestClient를 활용한 단위 및 통합 테스트를 작성합니다.
- **문서화**: FastAPI의 OpenAPI(Swagger UI)를 통해 최신 API 문서를 자동 생성합니다.

### 5.4. 보안 고려 사항
- **비밀번호 암호화**: bcrypt 등의 안전한 해시 알고리즘 사용
- **세션 관리**:  
  - UUID 기반 세션 토큰 사용  
  - HttpOnly 및 Secure 쿠키 설정  
  - CSRF 방어
- **입력 검증 및 XSS 방어**: HTML 콘텐츠 저장 시 필터링 적용
- **HTTPS 적용**: 모든 통신은 HTTPS로 암호화