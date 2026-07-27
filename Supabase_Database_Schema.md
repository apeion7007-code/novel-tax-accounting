# Supabase Database Schema Overview (노벨세무회계)

본 문서는 노벨세무회계 앱의 Supabase 데이터베이스 전체 테이블 구조 및 컬럼 사양서입니다.

---

## 1. Client (고객 정보 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `createdAt` | `timestamp without time zone` | 생성 일시 |
| `name` | `text` | 고객 성명 |
| `regNum` | `text` | 외국인등록번호 / 생년월일 |
| `country` | `text` | 국적 |
| `phone` | `text` | 전화번호 |
| `phoneComp` | `text` | 통신사 (SKT/KT/LGU+) |
| `company` | `text` | 현/전 근무처 회사명 |
| `visa` | `text` | 비자 종류 (E9, E10 등) |
| `hireDate` | `timestamp without time zone` | 입사일 |
| `visaExpireDate` | `timestamp without time zone` | 비자 만료일 |
| `bankAccount` | `text` | 환급 계좌번호 |
| `bank` | `text` | 환급 은행명 |
| `paybackProgress` | `text` | 환급 처리 상태 (◎경정상담중 등) |
| `address` | `text` | 주민등록상 주소지 |
| `isMonthlyTenant` | `boolean` | 월세 여부 |
| `taxReductionSentDate` | `timestamp without time zone` | 감면명세서 발송일 |
| `taxReductionSentStatus` | `text` | 감면명세서 제출상태 |
| `isAdditionalPayback` | `boolean` | 추가 신청 실적 여부 |
| `additionalApplyDate` | `timestamp without time zone` | 추가 신청 예정일 |
| `feeRate` | `double precision` | 수수료율 (22% 등) |
| `feeMethod` | `text` | 수수료 수납선택 |
| `clientRank` | `text` | 고객 등급 |
| `facebookName` | `text` | SNS (페이스북) 이름 |
| `facebookURL` | `text` | SNS 주소 |
| `hometaxId` | `text` | 홈택스 아이디 |
| `hometaxPw` | `text` | 홈택스 비밀번호 |
| `managerId` | `text` | 담당 매니저 ID / 이름 (Boram 등) |
| `teamId` | `integer` | 소속 팀 ID (FK -> Team.id) |
| `recordFileDate` | `timestamp without time zone` | 파일 기록 일시 |
| `taxReductionStatus` | `text` | 감면 상태 |
| `updatedAt` | `timestamp with time zone` | 최종 수정일시 |
| `rectificationRequestDate` | `timestamp with time zone` | 경정청구일 |
| `serial` | `integer` | 연번 |
| `refund_performance` | `bigint` | 환급 실적 금액 |
| `refund_performance_date` | `timestamp with time zone` | 환급 실적 일시 |
| `fee_performance` | `bigint` | 수수료 수납 실적 금액 |
| `fee_performance_date` | `timestamp with time zone` | 수수료 수납 일시 |

---

## 2. Manager (담당 매니저 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `text` | Primary Key (UUID) |
| `createdAt` | `timestamp without time zone` | 가입 신청일시 |
| `name` | `text` | 매니저 이름 |
| `teamId` | `integer` | 소속 팀 ID (FK -> Team.id) |
| `isAdmin` | `boolean` | 최고 관리자 권한 여부 |
| `isConfirmed` | `boolean` | 가입 승인 여부 |

---

## 3. Team (전담 팀 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Primary Key (Auto Increment) |
| `createdAt` | `timestamp without time zone` | 팀 생성일시 |
| `name` | `text` | 팀 이름 (미얀마팀, 베트남팀, 파키스탄 등) |

---

## 4. YearEndData (연말정산 & 세액 계산 데이터 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `integer / uuid` | Primary Key |
| `clientId` | `uuid` | 고객 ID (FK -> Client.id) |
| `year` | `integer` | 적용 연도 (2021 ~ 2025) |
| `regNum` | `character varying` | 외국인등록번호 |
| `companyName` | `character varying` | 근무처명 |
| `companyRegisterNumber` | `character varying` | 사업자등록번호 |
| `netSalaryFromReceipt` | `numeric` | 영수증 총급여액 |
| `netSalary` | `numeric` | 결정 총급여액 |
| `calculatedTax` | `numeric` | 산출세액 |
| `smallBusinessDeduction` | `numeric` | 중소기업 취업자 감면세액 |
| `isSmallBusinessDeduction` | `boolean` | 중소기업 감면 적용 여부 |
| `employmentInsurance` | `numeric` | 고용보험료 |
| `determinedTaxFromReceipt` | `numeric` | 영수증 결정세액 |
| `determinedTax` | `numeric` | 결정세액 (기존) |
| `localTax` | `numeric` | 지방소득세 |
| `totalTax` | `numeric` | 총 세액 |
| `changedEmployer` | `numeric` | 변경 근무처 세액 |
| `changedDeterminedTax` | `numeric` | 경정 후 결정세액 (소득세) |
| `changedLocalTax` | `numeric` | 경정 후 지방소득세 |
| `changedTotalTax` | `numeric` | 경정 후 총 세액 |
| `changedSmallBusinessDeduction` | `numeric` | 경정 후 감면액 |
| `localTaxRefund` | `numeric` | 지방세 환급예정액 |
| `totalTaxRefund` | `numeric` | 총 환급예정액 (국세+지방세) |
| `workPeriodStartDate` | `date` | 근무기간 시작일 |
| `workPeriodEndDate` | `date` | 근무기간 종료일 |
| `fileURL` | `text` | 원천징수영수증 PDF 스토리지 URL |
| `correction_file` | `text` | 경정청구 보완 서류 URL |
| `createdAt` | `timestamp without time zone` | 데이터 생성 일시 |
| `rentRefundTotal` | `numeric` | 월세 환급금 합계 |
| `rentRefundExpectNational` | `numeric` | 월세 환급금 국세 |
| `rentRefundExpectLocal` | `numeric` | 월세 환급금 지방세 |
| `dependentRefundTotal` | `numeric` | 부양가족 환급금 합계 |

---

## 5. ConsultMemo (상담 처리 로그 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Primary Key |
| `createdAt` | `timestamp without time zone` | 상담 기록일시 |
| `content` | `text` | 상담 메모 상세 내용 |
| `managerId` | `text` | 상담 진행 매니저 ID |
| `clientId` | `uuid` | 해당 고객 ID (FK -> Client.id) |

---

## 6. Field (검색 및 양식 필드 설정 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Primary Key |
| `createdAt` | `timestamp without time zone` | 생성일시 |
| `name` | `text` | 필드명 |
| `type` | `text` | 필드 타입 |
| `isSearchField` | `boolean` | 검색 조건 포함 여부 |
| `queryParamName` | `text` | 쿼리 파라미터 키 |

---

## 7. Option (필드 옵션 항목 테이블)
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Primary Key |
| `createdAt` | `timestamp without time zone` | 생성일시 |
| `name` | `text` | 옵션 항목명 |
| `fieldId` | `integer` | 소속 필드 ID (FK -> Field.id) |
