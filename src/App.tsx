import { useExcelHandlers } from './hooks/useExcelHandlers';
import { usePdfHandlers } from './hooks/usePdfHandlers';
import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Lock,
  LogOut,
  X,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

import { generateHometaxFile, generateFreelancerHometaxFile } from './utils/hometaxGenerator';
import { ConsentPage } from './components/ConsentPage';
import { ContractPage } from './components/ContractPage';
import { HometaxExcelSyncModal } from './components/modals/HometaxExcelSyncModal';

import { DashboardView } from './components/views/DashboardView';
import { ChangePasswordView } from './components/views/ChangePasswordView';
import { StaffManagementView } from './components/views/StaffManagementView';
import { CustomerListView } from './components/views/CustomerListView';
import { AuthView } from './components/views/AuthView';
import { RegistrationView } from './components/views/RegistrationView';
import { HometaxValidatorView } from './components/views/HometaxValidatorView';

import { recalculateYearData } from './utils/taxCalculator';
import {
  supabase,
  fetchInitialClientsFromSupabase,
  fetchAllClientsParallelFromSupabase,
  saveRegistrationToSupabase,
  fetchTeamsFromSupabase,
  fetchManagersFromSupabase,
  createTeamInSupabase,
  deleteTeamInSupabase,
  updateManagerTeamInSupabase,
  approveManagerInSupabase,
  deleteManagerInSupabase,
  createManagerInSupabase,
  deleteClientsFromSupabase,
  updateClientManagerInSupabase
} from './utils/supabaseClient';
import { calculateCombinedRefund } from './utils/combinedTaxCalculator';


// Define customer interface
export interface Customer {
  id: number;
  uuid?: string;
  registeredDate: string;
  nationality: string;
  name: string;
  birthDate: string;
  visa: string;
  companyName: string;
  refundStatus: string;
  submissionStatus: string;
  monthlyRent: string;
  claimDate: string;
  additionalApplyDate?: string;
  additionalPerformance: number;
  managerCountry: string;
  managerName: string;
  phone?: string;
  consentStatus?: string;
  arcImageUrl?: string;
  signatureImageUrl?: string;
  visaExpireDate?: string;
  isNextYearApply?: boolean;
}

// Define manager interface
export interface Manager {
  name: string;
  country: string;
  email: string;
  phone: string;
  activeCount: number;
}

// Define Toast interface
interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Dynamic Country Code mapping helpers
const DEFAULT_COUNTRY_CODES: Record<string, string> = {
  vi: '베트남',
  mm: '미얀마',
  np: '네팔',
  kh: '캄보디아',
  id: '인도네시아',
  th: '태국',
  ph: '필리핀',
  lk: '스리랑카',
  bd: '방글라데시',
  uz: '우즈베키스탄',
  pk: '파키스탄',
  mn: '몽골',
  kg: '키르기스스탄',
  kz: '카자흐스탄',
  cn: '중국',
  kr: '한국',
  ko: '고려인',
  all: 'ALL'
};

const getCountryFromPath = (dbTeams: any[]): string | null => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const code = parts[0]?.toLowerCase();
  if (!code) return null;

  if (code === 'all') return 'ALL';

  if (dbTeams && dbTeams.length > 0) {
    const matched = dbTeams.find(t => t.code && t.code.trim().toLowerCase() === code);
    if (matched) {
      const name = matched.name ? matched.name.replace(/팀$/, '').trim() : '';
      if (name === '관리자') return 'ALL';
      return name;
    }
  }

  return DEFAULT_COUNTRY_CODES[code] || null;
};

const getCodeFromCountry = (dbTeams: any[], country: string): string => {
  if (!country) return 'all';
  if (country === 'ALL' || country === '관리자') return 'all';

  const cleanCountry = country.replace(/팀$/, '').trim();
  if (cleanCountry === '관리자') return 'all';

  if (dbTeams && dbTeams.length > 0) {
    const matched = dbTeams.find(t => {
      const cleanTeam = t.name ? t.name.replace(/팀$/, '').trim() : '';
      return cleanTeam === cleanCountry;
    });
    if (matched && matched.code) {
      return matched.code.trim().toLowerCase();
    }
  }

  const entry = Object.entries(DEFAULT_COUNTRY_CODES).find(([_, value]) => value === cleanCountry);
  return entry ? entry[0] : 'all';
};

function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [currentManager, setCurrentManager] = useState<any>(null);
  
  // Country URL routing state
  const [pathCountry, setPathCountry] = useState<string>('미얀마');

  // Navigation State: customer = List View, registration = Register/Detail View, dashboard = Analytics Dashboard, staff = Staff View, password = Password View, consent = Client Consent View, validator = Hometax Validator View, contract = Client Contract View
  const [currentView, setCurrentView] = useState<'customer' | 'registration' | 'dashboard' | 'staff' | 'password' | 'consent' | 'validator' | 'contract'>('customer');
  const [isHometaxExcelSyncModalOpen, setIsHometaxExcelSyncModalOpen] = useState<boolean>(false);
  const [consentToken, setConsentToken] = useState<string | null>(null);
  const [tempInlineEdits, setTempInlineEdits] = useState<Record<number, { nationality?: string; managerName?: string; managerCountry?: string }>>({});
  
  // Tab control state
  const [selectedTab, setSelectedTab] = useState<'all' | 'inProgress' | 'feeCompleted' | 'nextYear'>('all');

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab]);

  // Customer List State
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 24707,
      registeredDate: '26. 7. 15.',
      nationality: '인도네시아',
      name: 'HASANUDDIN',
      birthDate: '890528-5580013',
      visa: 'E10',
      companyName: '자이코마린주식회사',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎재직회사재출',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '인도네시아',
      managerName: 'Gaby',
    },
    {
      id: 24706,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'ACHARYA BISHNU',
      birthDate: '940927-5260047',
      visa: 'E10',
      companyName: '농업회사법인(주)에버그린풍성지',
      refundStatus: '대기',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24705,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'LAPCHA SUMAN',
      birthDate: '960809-5900027',
      visa: '-',
      companyName: '-',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24704,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'RAI KRISHNA KUMAR',
      birthDate: '920109-5140509',
      visa: '-',
      companyName: '(주)라임텍',
      refundStatus: '※감면명세서요청중',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24703,
      registeredDate: '26. 7. 15.',
      nationality: '인도네시아',
      name: 'SONHAJI',
      birthDate: '820723-5580014',
      visa: 'E10',
      companyName: '-',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '인도네시아',
      managerName: 'Gaby',
    },
    {
      id: 24702,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'GHIMIRE HARI SARAN',
      birthDate: '900327-5180307',
      visa: '-',
      companyName: '(주)낙농산업',
      refundStatus: '♥경정청구완료',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24701,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'CHHETRI ARJUN BAHADUR',
      birthDate: '901214-5760193',
      visa: '-',
      companyName: '서앤디전자-음성공장',
      refundStatus: '세로경정청구중',
      submissionStatus: '◎재직회사재출',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24700,
      registeredDate: '26. 7. 15.',
      nationality: '네팔',
      name: 'THAPA JANAK BAHADUR',
      birthDate: '870820-5140106',
      visa: '-',
      companyName: '민성소트',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎이전회사재출',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '네팔',
      managerName: '레누카',
    },
    {
      id: 24699,
      registeredDate: '26. 7. 15.',
      nationality: '인도네시아',
      name: 'KHAFIDUMAN',
      birthDate: '980201-5520034',
      visa: 'E10',
      companyName: '신형해수산(이인심)',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '인도네시아',
      managerName: 'Gaby',
    },
    {
      id: 24698,
      registeredDate: '26. 7. 15.',
      nationality: '파키스탄',
      name: 'KHAN NABEEL',
      birthDate: '940207-5320028',
      visa: 'E7',
      companyName: '(주)원신 경주외동공장',
      refundStatus: '◎경정상담중',
      submissionStatus: '◎제출이력없음',
      monthlyRent: '아니오',
      claimDate: '-',
      additionalPerformance: 0,
      managerCountry: '파키스탄',
      managerName: '아드난',
    },
  ]);

  // Staff State
  const [managers] = useState<Manager[]>([
    { name: 'Gaby', country: '인도네시아', email: 'gaby@novel-tax.kr', phone: '010-1234-5678', activeCount: 3 },
    { name: '레누카', country: '네팔', email: 'renuka@novel-tax.kr', phone: '010-2345-6789', activeCount: 6 },
    { name: '아드난', country: '파키스탄', email: 'adnan@novel-tax.kr', phone: '010-3456-7890', activeCount: 1 },
    { name: '타리크', country: '방글라데시', email: 'tariq@novel-tax.kr', phone: '010-4567-8901', activeCount: 0 },
    { name: '사비르', country: '우즈베키스탄', email: 'sabir@novel-tax.kr', phone: '010-5678-9012', activeCount: 0 },
  ]);

  // Selected Row IDs (for list view check/delete)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [selectedRefundStatus, setSelectedRefundStatus] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [filterBeforeDate, setFilterBeforeDate] = useState<string>('');
  const [filterCompanyName, setFilterCompanyName] = useState<string>('');
  const [filterVisaType, setFilterVisaType] = useState<string>('');
  const [filterBirthDate, setFilterBirthDate] = useState<string>('');
  const [filterForeignerNumber, setFilterForeignerNumber] = useState<string>('');
  const [filterRegDate, setFilterRegDate] = useState<string>('');
  const [filterMonthlyRent, setFilterMonthlyRent] = useState<string>('');

  // Dashboard Filter State
  const [dashYearFilter, setDashYearFilter] = useState<string>('전체');
  const [dashMonthFilter, setDashMonthFilter] = useState<string>('전체');

  // UI state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  // Supabase Staff Management State (Team & Manager)
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbManagers, setDbManagers] = useState<any[]>([]);
  const [consultMemos, setConsultMemos] = useState<any[]>([]);
  const [managerPage, setManagerPage] = useState<number>(1);
  const managerItemsPerPage = 10;

  // Dynamic All Available Teams/Countries List (Combining DB teams, default teams, and customer nationalities)
  const availableTeamList = useMemo(() => {
    const teams = new Set<string>();
    if (dbTeams && dbTeams.length > 0) {
      dbTeams.forEach(t => { 
        if (t && t.name && t.name !== '관리자' && t.name !== '관리자팀') {
          teams.add(t.name.replace(/팀$/, '').trim()); 
        }
      });
    }
    ['미얀마', '인도네시아', '베트남', '캄보디아', '몽골', '네팔', '방글라데시', '우즈베키스탄', '파키스탄', '필리핀', '태국', '스리랑카'].forEach(c => teams.add(c));
    if (customers && customers.length > 0) {
      customers.forEach(c => { 
        if (c && c.nationality && c.nationality !== '관리자' && c.nationality !== '관리자팀') {
          teams.add(c.nationality); 
        }
      });
    }
    return Array.from(teams).filter(Boolean);
  }, [dbTeams, customers]);

  // Dynamic All Available Managers List (Combining DB staff managers, default managers, and customer managers)
  const availableManagerList = useMemo(() => {
    const names = new Set<string>();
    if (dbManagers && dbManagers.length > 0) {
      dbManagers.forEach(m => { if (m && m.name) names.add(m.name.trim()); });
    }
    ['Boram', 'Jennie', '사이풀', 'Gaby', 'Linh', '소피아', '레누카', '아드난', '디노라', '안토', '한지윤', '이두원', '사공지희', '원호아', '예리', '마두', '게렐', 'Inosha'].forEach(n => names.add(n));
    if (customers && customers.length > 0) {
      customers.forEach(c => { if (c && c.managerName) names.add(c.managerName.trim()); });
    }
    return Array.from(names).filter(Boolean);
  }, [dbManagers, customers]);

  const currentManagerCountry = useMemo(() => {
    if (!currentManager) return null;
    // 이메일이 admin@novel.com이거나, isAdmin 플래그가 true이거나, 소속 팀ID가 1(관리자팀)인 경우 ALL 권한 부여
    if (
      currentManager.email === 'admin@novel.com' || 
      currentManager.isAdmin || 
      currentManager.teamId === 1
    ) {
      return 'ALL';
    }
    const team = dbTeams.find(t => t.id === currentManager.teamId);
    if (team) {
      const cleanName = team.name ? team.name.replace(/팀$/, '').trim() : '';
      if (cleanName === '관리자') return 'ALL';
      return cleanName || null;
    }
    return null;
  }, [currentManager, dbTeams]);


  

  // Hometax Submitter Modal States & Persistence
  const [isHometaxModalOpen, setIsHometaxModalOpen] = useState<boolean>(false);
  const [hometaxSubmitter, setHometaxSubmitter] = useState(() => {
    try {
      const saved = localStorage.getItem('hometax_submitter');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load hometax_submitter from localStorage:', e);
    }
    return {
      submitterType: '1', // 1: 세무대리인, 2: 법인, 3: 개인
      taxOfficeCode: '120', // Default 종로세무서
      agentNum: '',
      hometaxId: '',
      bizNum: '',
      companyName: '',
      deptName: '세무부',
      managerName: '',
      managerPhone: '',
      targetYear: '2025'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('hometax_submitter', JSON.stringify(hometaxSubmitter));
    } catch (e) {
      console.warn('Failed to save hometax_submitter to localStorage:', e);
    }
  }, [hometaxSubmitter]);

  const handleDownloadHometaxFile = () => {
    if (selectedIds.length === 0) {
      showToast('제출할 고객을 선택해 주세요.', 'error');
      return;
    }
    setIsHometaxModalOpen(true);
  };

  const handleGenerateHometaxFile = async (type: 'wage' | 'freelancer') => {
    if (selectedIds.length === 0) {
      showToast('제출할 고객을 선택해 주세요.', 'error');
      return;
    }

    if (!hometaxSubmitter.agentNum || !hometaxSubmitter.bizNum || !hometaxSubmitter.companyName) {
      showToast('세무대리인 정보 설정이 필요합니다. 먼저 [국세청 홈택스 전산매체 파일 생성]을 통해 설정해 주세요.', 'error');
      setIsHometaxModalOpen(true);
      return;
    }

    try {
      showToast('국세청 제출용 데이터를 불러오는 중입니다...', 'info');

      // 1. Fetch Client records from Supabase matching the selected serial numbers
      const { data: dbClients, error: clientErr } = await supabase
        .from('Client')
        .select('*')
        .in('serial', selectedIds);

      if (clientErr || !dbClients || dbClients.length === 0) {
        showToast('고객 상세 정보를 불러오지 못했습니다.', 'error');
        return;
      }

      const clientIds = dbClients.map(c => c.id).filter(Boolean);

      // 2. Fetch YearEndData records for these clients
      const { data: dbYearData, error: yearErr } = await supabase
        .from('YearEndData')
        .select('*')
        .in('clientId', clientIds);

      if (yearErr) {
        showToast('고객의 연말정산 소득 정보를 불러오지 못했습니다.', 'error');
        return;
      }

      // 3. Construct the detailed clients structure
      const yr = hometaxSubmitter.targetYear;
      
      const clientsWithData = dbClients.map(c => {
        const cYearRecords = dbYearData ? dbYearData.filter(y => y.clientId === c.id) : [];
        const yearsMap: Record<string, any> = {};
        const freelancerYearsMap: Record<string, any> = {};
        
        cYearRecords.forEach(y => {
          if (y.companyName && !y.freelancerActive) {
            // Wage record
            yearsMap[String(y.year)] = {
              active: true,
              workPlace: y.companyName || '',
              businessNumber: y.companyRegNo || '',
              salaryTotal: y.netSalary || 0,
              totalSalary: y.netSalary || 0,
              taxBase: y.calculatedTax || 0,
              childReduction: y.smallBusinessDeduction || 0,
              appliedTaxReduction: y.smallBusinessDeduction || 0,
              decisionTax: y.determinedTax || 0,
              originalDeterminedTax: y.determinedTax || 0,
              decisionTaxApplyAmt: y.changedDeterminedTax || 0,
              recalcDeterminedTax: y.changedDeterminedTax || 0,
              localTaxApplyAmt: y.changedLocalTax || 0,
              recalcLocalTax: y.changedLocalTax || 0,
              expectedRefundNational: y.determinedTaxRefund || 0,
              refundExpectNational: y.determinedTaxRefund || 0,
              expectedRefundLocal: y.localTaxRefund || 0,
              refundExpectLocal: y.localTaxRefund || 0,
              rentRefundTotal: y.rentRefundTotal || 0,
              rentRefundExpectNational: y.rentRefundExpectNational || 0,
              rentRefundExpectLocal: y.rentRefundExpectLocal || 0
            };
          } else if (y.freelancerActive || !y.companyName) {
            // Freelancer record
            freelancerYearsMap[String(y.year)] = {
              active: true,
              workPlace: y.freelancerCompanyName || '',
              businessNumber: y.freelancerCompanyRegNo || '',
              totalIncome: y.freelancerNetSalary || 0,
              withholdingTax3: y.freelancerDeterminedTax || 0,
              localTax03: y.freelancerLocalTax || 0,
              refundExpectNational: y.freelancerRefundExpectNational || 0,
              refundExpectLocal: y.freelancerRefundExpectLocal || 0,
              incomeTypeCode: y.freelancerIncomeTypeCode || '940909'
            };
          }
        });

        return {
          id: c.serial,
          consentStatus: c.consentStatus || '대기',
          name: c.name || '',
          regNum: c.regNum || '',
          foreignerNumber: c.regNum || '',
          nationality: c.country || '',
          isMonthlyRent: c.isMonthlyTenant ? '가' : '부',
          landlordName: c.landlordName || '',
          landlordRegNum: c.landlordRegNum || '',
          rentHousingType: c.rentHousingType || '',
          rentHousingSize: c.rentHousingSize || '',
          rentLeaseStart: c.rentLeaseStart || '',
          rentLeaseEnd: c.rentLeaseEnd || '',
          monthlyRentFee: c.monthlyRentFee || '',
          residentRegisterAddress: c.address || '',
          dependentsCount: c.dependentsCount || 0,
          seniorCount: c.seniorCount || 0,
          disabledCount: c.disabledCount || 0,
          childCount: c.childCount || 0,
          years: yearsMap,
          freelancerYears: freelancerYearsMap
        };
      }).filter(c => {
        const isConsentApproved = c.consentStatus === '수임완료';
        if (type === 'wage') {
          const yrData = c.years?.[yr];
          const hasSalary = yrData && (yrData.salaryTotal || yrData.totalSalary);
          return hasSalary && isConsentApproved;
        } else {
          const yrData = c.freelancerYears?.[yr];
          const hasIncome = yrData && yrData.totalIncome > 0;
          return hasIncome && isConsentApproved;
        }
      });

      if (clientsWithData.length === 0) {
        showToast(`${yr}년도 ${type === 'wage' ? '근로정산' : '프리랜서'} 소득 데이터가 있고 수임동의가 완료된 고객이 없습니다.`, 'error');
        return;
      }

      let blob: Blob;
      let filename: string;
      if (type === 'wage') {
        blob = generateHometaxFile(hometaxSubmitter, clientsWithData);
        filename = `근로소득지급명세서_${yr}_제출용.txt`;
      } else {
        blob = generateFreelancerHometaxFile(hometaxSubmitter, clientsWithData);
        filename = `사업소득지급명세서_${yr}_제출용.txt`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`${clientsWithData.length}명의 ${type === 'wage' ? '근로소득' : '사업소득(프리랜서)'} 전산매체 파일 다운로드가 완료되었습니다.`, 'success');
      setIsHometaxModalOpen(false);
    } catch (e: any) {
      console.error(e);
      showToast(`전산매체 파일 생성 실패: ${e.message}`, 'error');
    }
  };

  const [isAddManagerModalOpen, setIsAddManagerModalOpen] = useState<boolean>(false);
  const [newManagerData, setNewManagerData] = useState({
    name: '',
    teamId: '',
    phone: '',
    email: '',
    address: '',
    facebookMessenger: ''
  });

  const handleSaveNewManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManagerData.name.trim()) {
      showToast('매니저 이름을 입력해 주세요.', 'error');
      return;
    }
    if (!newManagerData.teamId) {
      showToast('소속 팀을 선택해 주세요.', 'error');
      return;
    }

    showToast('신규 매니저를 등록하는 중입니다...', 'info');
    const res = await createManagerInSupabase({
      name: newManagerData.name.trim(),
      teamId: Number(newManagerData.teamId),
      phone: newManagerData.phone,
      email: newManagerData.email,
      address: newManagerData.address,
      facebookMessenger: newManagerData.facebookMessenger
    });

    if (res.success) {
      showToast(`${newManagerData.name} 매니저가 성공적으로 등록되었습니다.`, 'success');
      setIsAddManagerModalOpen(false);
      setNewManagerData({ name: '', teamId: '', phone: '', email: '', address: '', facebookMessenger: '' });
      loadStaffData();
    } else {
      showToast(`매니저 등록 실패: ${res.error}`, 'error');
    }
  };

  const loadStaffData = async () => {
    const teams = await fetchTeamsFromSupabase();
    const mgrs = await fetchManagersFromSupabase();
    setDbTeams(teams);
    setDbManagers(mgrs);
  };

  // Team & Manager Handlers
  const handleCreateTeam = async () => {
    const teamName = window.prompt('신규 생성할 팀 이름을 입력하세요 (예: 파키스탄, 베트남팀):');
    if (!teamName || !teamName.trim()) return;

    const teamCode = window.prompt('해당 팀의 주소창용 영문 코드(2자리)를 입력하세요 (예: pk, vi):');
    if (!teamCode || !teamCode.trim()) return;

    showToast('팀을 생성하는 중입니다...', 'info');
    const res = await createTeamInSupabase(teamName.trim(), teamCode.trim());
    if (res.success) {
      showToast(`'${teamName}' 팀이 성공적으로 생성되었습니다.`, 'success');
      loadStaffData();
    } else {
      showToast(`팀 생성 실패: ${res.error}`, 'error');
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!window.confirm(`'${teamName}' 팀을 삭제하시겠습니까?`)) return;

    showToast('팀을 삭제하는 중입니다...', 'info');
    const res = await deleteTeamInSupabase(teamId);
    if (res.success) {
      showToast(`'${teamName}' 팀이 삭제되었습니다.`, 'info');
      loadStaffData();
    } else {
      showToast(`팀 삭제 실패: ${res.error}`, 'error');
    }
  };

  const handleUpdateManagerTeam = async (managerId: string, newTeamId: number) => {
    const res = await updateManagerTeamInSupabase(managerId, newTeamId);
    if (res.success) {
      showToast('매니저 소속 팀이 업데이트되었습니다.', 'success');
      setDbManagers(prev => prev.map(m => m.id === managerId ? { ...m, teamId: newTeamId } : m));
    } else {
      showToast(`팀 변경 실패: ${res.error}`, 'error');
    }
  };

  const handleApproveManager = async (managerId: string, managerName: string) => {
    const res = await approveManagerInSupabase(managerId);
    if (res.success) {
      showToast(`${managerName} 매니저 가입이 승인되었습니다.`, 'success');
      setDbManagers(prev => prev.map(m => m.id === managerId ? { ...m, isConfirmed: true } : m));
    } else {
      showToast(`가입 승인 실패: ${res.error}`, 'error');
    }
  };

  const handleDeleteManager = async (managerId: string, managerName: string) => {
    if (!window.confirm(`${managerName} 매니저를 삭제하시겠습니까?`)) return;

    const res = await deleteManagerInSupabase(managerId);
    if (res.success) {
      showToast(`${managerName} 매니저 정보가 삭제되었습니다.`, 'info');
      setDbManagers(prev => prev.filter(m => m.id !== managerId));
    } else {
      showToast(`매니저 삭제 실패: ${res.error}`, 'error');
    }
  };

  const formatKoreanDateTime = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12;
    return `${year}년 ${month}월 ${day}일 ${ampm} ${hours}:${minutes}`;
  };

  // Listen to Supabase Auth state changes and check session on mount
  useEffect(() => {
    async function checkUserSession() {
      try {
        const teamsList = await fetchTeamsFromSupabase();
        if (teamsList && teamsList.length > 0) {
          setDbTeams(teamsList);
        }
      } catch (err) {
        console.error('Fetch teams early error:', err);
      }

      // Check if client is accessing via consent URL
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || params.get('v');
      const tokenParam = params.get('token') || params.get('id');

      if (viewParam === 'consent' && tokenParam) {
        setConsentToken(tokenParam);
        setCurrentView('consent');
        setIsSessionChecking(false);
        return;
      }

      if (viewParam === 'contract' && tokenParam) {
        setConsentToken(tokenParam);
        setCurrentView('contract');
        setIsSessionChecking(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: managerData, error: managerErr } = await supabase
            .from('Manager')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!managerErr && managerData) {
            if (managerData.isConfirmed) {
              setIsLoggedIn(true);
              setCurrentManager({
                ...managerData,
                email: session.user.email
              });
              setRegForm(prev => ({ ...prev, managerName: managerData.name || 'Boram' }));
            } else {
              showToast('가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.', 'error');
              await supabase.auth.signOut();
              setIsLoggedIn(false);
              setCurrentManager(null);
            }
          } else {
            showToast('등록되지 않은 관리자 계정입니다.', 'error');
            await supabase.auth.signOut();
            setIsLoggedIn(false);
            setCurrentManager(null);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsSessionChecking(false);
      }
    }

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && session.user) {
        const { data: managerData } = await supabase
          .from('Manager')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (managerData) {
          if (managerData.isConfirmed) {
            setIsLoggedIn(true);
            setCurrentManager({
              ...managerData,
              email: session.user.email
            });
            setRegForm(prev => ({ ...prev, managerName: managerData.name || 'Boram' }));
          } else {
            showToast('가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.', 'error');
            await supabase.auth.signOut();
            setIsLoggedIn(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Supabase initial data with ultra-fast 2-stage parallel streaming & dynamic staff mapping
  useEffect(() => {
    if (!isLoggedIn) return;
    async function loadSupabaseData() {
      try {
        const teams = await fetchTeamsFromSupabase();
        const mgrs = await fetchManagersFromSupabase();
        setDbTeams(teams);
        setDbManagers(mgrs);

        const mgrMap = new Map((mgrs || []).map((m: any) => [m.id, m.name ? m.name.trim() : '']));
        const teamMap = new Map((teams || []).map((t: any) => [t.id, t.name ? t.name.trim() : '']));

        // Stage 1: Ultra-fast initial load (first 500 recent items in ~0.2s)
        const initialClients = await fetchInitialClientsFromSupabase();
        if (initialClients && initialClients.length > 0) {
          const mappedInitial: Customer[] = initialClients.map((c: any, idx: number) => {
            const registeredDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })
              : '26. 7. 15.';

            const parseDate = (val: any) => {
              if (!val || val === '-' || val === '') return '-';
              const s = String(val);
              if (s.includes('T')) return s.split('T')[0];
              return s;
            };

            const resolvedTeamName = teamMap.get(c.teamId) || '';
            const cleanTeamName = resolvedTeamName.replace(/팀$/, '').trim();
            const nat = (c.country && c.country.trim() !== '')
              ? c.country
              : (cleanTeamName !== '관리자' && cleanTeamName !== '' ? cleanTeamName : '인도네시아');
            const resolvedMgr = mgrMap.get(c.managerId) || c.managerName || (nat === '미얀마' ? 'Boram' : nat === '베트남' ? 'Linh' : nat === '네팔' ? '레누카' : nat === '방글라데시' ? '사이풀' : nat === '필리핀' ? 'Jennie' : 'Gaby');

            return {
              id: c.serial || (25000 + idx),
              uuid: c.id,
              registeredDate,
              nationality: nat,
              name: c.name || '미상',
              birthDate: c.regNum || '-',
              visa: c.visa || 'E9',
              companyName: c.company || '-',
              refundStatus: c.paybackProgress || c.status || c.refundStatus || '경정상담중',
              submissionStatus: c.taxReductionProgress || c.taxReductionSubmissionStatus || c.taxReductionStatus || c.deductionStatus || c.submissionStatus || '-',
              monthlyRent: c.isMonthlyRent || c.isMonthlyTenant ? '예' : '아니오',
              claimDate: parseDate(c.rectificationRequestDate || c.taxReductionSentDate || c.recordFileDate || c.claimDate || c.rectificationDate),
              additionalApplyDate: parseDate(c.additionalApplyDate),
              additionalPerformance: c.fee_performance || 0,
              managerCountry: nat,
              managerName: resolvedMgr,
              phone: c.phone || '',
              consentStatus: c.consentStatus || '대기',
              arcImageUrl: c.arcImageUrl || '',
              signatureImageUrl: c.signatureImageUrl || '',
              visaExpireDate: c.visaExpireDate || '',
              isNextYearApply: c.isNextYearApply || false
            };
          });

          setCustomers(mappedInitial);
        }

        // Stage 2: Parallel background load for ALL 24,634+ records (~1.8s)
        const allClients = await fetchAllClientsParallelFromSupabase();
        if (allClients && allClients.length > 0) {
          const mappedAll: Customer[] = allClients.map((c: any, idx: number) => {
            const registeredDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })
              : '26. 7. 15.';

            const parseDate = (val: any) => {
              if (!val || val === '-' || val === '') return '-';
              const s = String(val);
              if (s.includes('T')) return s.split('T')[0];
              return s;
            };

            const resolvedTeamName = teamMap.get(c.teamId) || '';
            const cleanTeamName = resolvedTeamName.replace(/팀$/, '').trim();
            const nat = (c.country && c.country.trim() !== '')
              ? c.country
              : (cleanTeamName !== '관리자' && cleanTeamName !== '' ? cleanTeamName : '인도네시아');
            const resolvedMgr = mgrMap.get(c.managerId) || c.managerName || (nat === '미얀마' ? 'Boram' : nat === '베트남' ? 'Linh' : nat === '네팔' ? '레누카' : nat === '방글라데시' ? '사이풀' : nat === '필리핀' ? 'Jennie' : 'Gaby');

            return {
              id: c.serial || (25000 + idx),
              uuid: c.id,
              registeredDate,
              nationality: nat,
              name: c.name || '미상',
              birthDate: c.regNum || '-',
              visa: c.visa || 'E9',
              companyName: c.company || '-',
              refundStatus: c.paybackProgress || c.status || c.refundStatus || '경정상담중',
              submissionStatus: c.taxReductionProgress || c.taxReductionSubmissionStatus || c.taxReductionStatus || c.deductionStatus || c.submissionStatus || '-',
              monthlyRent: c.isMonthlyRent || c.isMonthlyTenant ? '예' : '아니오',
              claimDate: parseDate(c.rectificationRequestDate || c.taxReductionSentDate || c.recordFileDate || c.claimDate || c.rectificationDate),
              additionalApplyDate: parseDate(c.additionalApplyDate),
              additionalPerformance: c.fee_performance || 0,
              managerCountry: nat,
              managerName: resolvedMgr,
              phone: c.phone || '',
              consentStatus: c.consentStatus || '대기',
              arcImageUrl: c.arcImageUrl || '',
              signatureImageUrl: c.signatureImageUrl || '',
              visaExpireDate: c.visaExpireDate || '',
              isNextYearApply: c.isNextYearApply || false
            };
          });

          setCustomers(mappedAll);
        }
      } catch (e) {
        console.warn('Supabase fetch catch:', e);
      }
    }
    loadSupabaseData();
  }, [isLoggedIn]);

  // SmeModal States for company details

  // New Customer detail data (matching the complex form layout from the screenshot)
  const [regForm, setRegForm] = useState({
    companyAddress: '',
    companyPhone: '',
    companyIndustry: '',
    clientId: '',
    serial: 0,
    // Basic Details
    name: '',
    foreignerNumber: '',
    nationality: '미얀마',
    managerName: 'Boram',
    telecom: 'SKT',
    phone: '',
    visaType: 'E10',
    residentAddress: '',
    visaExpiry: '',
    isMonthlyRent: '부',
    landlordName: '',
    landlordRegNum: '',
    rentHousingType: '오피스텔',
    rentHousingSize: '',
    rentContractor: '본인',
    rentHouseholder: '세대주',
    rentAllHouseholdsNoHouse: '부',
    monthlyRentFee: '',
    rentLeaseStart: '',
    rentLeaseEnd: '',
    rentContractDocFile: null as File | null,
    rentContractDocUrl: '',
    rentReceiptDocFile: null as File | null,
    rentReceiptDocUrl: '',
    refundBankName: 'KB국민은행',
    refundBank: '',
    refundStatus: '대기',
    residentRegisterAddress: '',
    deductionSubmissionStatus: '◎제출이력없음',
    deductionApplyPeriod: '',
    deductionSentDate: '',
    claimRequestDate: '',
    claimCompleteDate: '',
    additionalApplyPerformance: '',
    feePaymentStatus: '후불 22%',
    taxReductionApplyDateStart: '',
    taxReductionApplyDateEnd: '',
    isNextYearApply: false,

    // Yearly calculations: 2021 ~ 2025
    years: [
      { id: 'temp_2021', year: '2021', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      { id: 'temp_2022', year: '2022', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      { id: 'temp_2023', year: '2023', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      { id: 'temp_2024', year: '2024', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      { id: 'temp_2025', year: '2025', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
    ] as any[],
    deletedYearIds: [] as any[],

    // Customer Consultation Information
    snsName: '',
    snsAddress: '',
    hometaxId: '',
    hometaxPw: '',
    customerGrade: '',
    greenContractDate: '',
    consultMemo: '',
    refundPerformance: '0',
    refundPerformanceDate: '',
    feeReceivedPerformance: '0',
    feeReceivedDate: '',

    // Dependents & Tax Deduction Settings
    dependentsCount: 0,
    seniorCount: 0,
    disabledCount: 0,
    childCount: 0,
    familyDocUrl: [] as string[],
    remittanceDocUrl: [] as string[],
    familyDocFile: [] as File[],
    remittanceDocFile: [] as File[],

    // 3.3% Freelancer Income Years
    freelancerYears: {
      '2021': { active: false, isFileUploaded: false, pdfFile: null as File | null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2022': { active: false, isFileUploaded: false, pdfFile: null as File | null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2023': { active: false, isFileUploaded: false, pdfFile: null as File | null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2024': { active: false, isFileUploaded: false, pdfFile: null as File | null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2025': { active: false, isFileUploaded: false, pdfFile: null as File | null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' }
    } as Record<string, any>,
    consentStatus: '대기',
    arcImageUrl: '',
    signatureImageUrl: ''
  });

  // Dynamic Years for Settlement
  const [targetYears, setTargetYears] = useState<string[]>(['2021', '2022', '2023', '2024', '2025']);
  const [selectedFeeRate, setSelectedFeeRate] = useState<number>(22);
  const [invoiceLanguage, setInvoiceLanguage] = useState<string>('한국어');
  const [contractLanguage, setContractLanguage] = useState<string>('한국어');

  useEffect(() => {
    // Invoice Language Auto-Mapping
    if (regForm.nationality === '베트남') setInvoiceLanguage('베트남어');
    else if (regForm.nationality === '인도네시아') setInvoiceLanguage('인도네시아어');
    else if (regForm.nationality === '몽골') setInvoiceLanguage('몽골어');
    else if (regForm.nationality === '미얀마') setInvoiceLanguage('미얀마어');
    else if (regForm.nationality === '캄보디아') setInvoiceLanguage('캄보디아어');
    else if (regForm.nationality === '네팔') setInvoiceLanguage('네팔어');
    else if (regForm.nationality === '방글라데시') setInvoiceLanguage('방글라데시어');
    else if (regForm.nationality === '우즈베키스탄') setInvoiceLanguage('우즈베크어');
    else if (regForm.nationality === '파키스탄') setInvoiceLanguage('파키스탄어');
    else if (regForm.nationality === '태국') setInvoiceLanguage('태국어');
    else if (regForm.nationality === '필리핀') setInvoiceLanguage('필리핀어');
    else if (regForm.nationality === '스리랑카') setInvoiceLanguage('스리랑카어');
    else setInvoiceLanguage('한국어');

    // Contract Language Auto-Mapping (Prioritize Manager Country, fallback to Customer Nationality)
    const managerOrCustCountry = (currentManagerCountry && currentManagerCountry !== 'ALL') 
      ? currentManagerCountry 
      : regForm.nationality;

    if (managerOrCustCountry === '베트남') setContractLanguage('베트남어');
    else if (managerOrCustCountry === '인도네시아') setContractLanguage('인도네시아어');
    else if (managerOrCustCountry === '몽골') setContractLanguage('몽골어');
    else if (managerOrCustCountry === '미얀마') setContractLanguage('미얀마어');
    else if (managerOrCustCountry === '캄보디아') setContractLanguage('캄보디아어');
    else if (managerOrCustCountry === '네팔') setContractLanguage('네팔어');
    else if (managerOrCustCountry === '방글라데시') setContractLanguage('방글라데시어');
    else if (managerOrCustCountry === '우즈베키스탄') setContractLanguage('우즈베크어');
    else if (managerOrCustCountry === '파키스탄') setContractLanguage('파키스탄어');
    else if (managerOrCustCountry === '태국') setContractLanguage('태국어');
    else if (managerOrCustCountry === '필리핀') setContractLanguage('필리핀어');
    else if (managerOrCustCountry === '스리랑카') setContractLanguage('스리랑카어');
    else setContractLanguage((currentManagerCountry && currentManagerCountry !== 'ALL') ? '영어' : '한국어');
  }, [regForm.nationality, currentManagerCountry]);

  // Synchronize fee rate when feePaymentStatus changes
  useEffect(() => {
    const status = regForm.feePaymentStatus || '후불 22%';
    if (status.includes('선불') && status.includes('후불')) {
      const match = status.replace(/\s/g, '').match(/선불(\d+)%?,후불(\d+)%?/);
      if (match) {
        setSelectedFeeRate(Number(match[1]) + Number(match[2]));
      } else {
        setSelectedFeeRate(20);
      }
    } else if (status.includes('선불')) {
      const match = status.match(/(\d+)/);
      if (match) {
        setSelectedFeeRate(Number(match[1]));
      } else {
        setSelectedFeeRate(17);
      }
    } else {
      const match = status.match(/(\d+)/);
      if (match) {
        setSelectedFeeRate(Number(match[1]));
      } else {
        setSelectedFeeRate(22);
      }
    }
  }, [regForm.feePaymentStatus]);

  const onChangeRentInfo = (key: string, value: any) => {
    setRegForm((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const onChangeRentFile = (key: string, file: File | null) => {
    setRegForm((prev: any) => ({
      ...prev,
      [key]: file
    }));
  };

  // Real-time Youth Tax Reduction Calculation
  const youthTaxReductionInfo = useMemo(() => {
    const rrn = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
    const actualEmpDateStr = regForm.residentAddress ? regForm.residentAddress.trim() : '';

    const periods = (regForm.years || [])
      .map((y: any) => y.workPeriod)
      .filter((wp: string) => wp && wp.includes('~'))
      .map((wp: string) => wp.split('~')[0].trim())
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    
    const hasEmpDate = Boolean(actualEmpDateStr || periods.length > 0);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const employmentDateStr = actualEmpDateStr || (periods.length > 0 ? periods[0] : todayStr);

    let eligibleBirthRangeStr = '';
    let birthDateFormatted = '';
    let age = null;
    let isEligible = false;
    let hasRrn = false;

    // Calculate Eligible Birth Range
    if (employmentDateStr) {
      const empParts = employmentDateStr.split('-');
      if (empParts.length === 3) {
        const empYear = parseInt(empParts[0], 10);
        const empMonth = parseInt(empParts[1], 10);
        const empDay = parseInt(empParts[2], 10);

        const earliestBirthDate = new Date(empYear - 35, empMonth - 1, empDay + 1);
        const latestBirthDate = new Date(empYear - 15, empMonth - 1, empDay);

        const formatRangeDate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}년 ${m}월 ${day}일`;
        };
        eligibleBirthRangeStr = `${formatRangeDate(earliestBirthDate)} ~ ${formatRangeDate(latestBirthDate)}`;

        if (rrn && rrn.length >= 7) {
          const yy = rrn.substring(0, 2);
          const mm = rrn.substring(2, 4);
          const dd = rrn.substring(4, 6);
          const genderDigit = rrn.charAt(6);

          let century = '19';
          if (genderDigit === '1' || genderDigit === '2' || genderDigit === '5' || genderDigit === '6') {
            century = '19';
          } else if (genderDigit === '3' || genderDigit === '4' || genderDigit === '7' || genderDigit === '8') {
            century = '20';
          } else if (genderDigit === '9' || genderDigit === '0') {
            century = '18';
          } else {
            century = Number(yy) > 26 ? '19' : '20';
          }

          const birthYear = parseInt(`${century}${yy}`, 10);
          const birthMonth = parseInt(mm, 10);
          const birthDay = parseInt(dd, 10);

          birthDateFormatted = `${birthYear}년 ${mm}월 ${dd}일`;
          hasRrn = true;

          age = empYear - birthYear;
          if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
            age--;
          }

          isEligible = age >= 15 && age <= 34;
        }
      }
    }

    return {
      hasEmpDate,
      hasRrn,
      birthDateStr: birthDateFormatted,
      ageAtEmployment: age,
      isEligible,
      eligibleBirthRangeStr
    };
  }, [regForm.foreignerNumber, regForm.residentAddress, regForm.years]);

  // Automatically recalculate yearly tax data when foreigner number, employment date, fee rate, or monthly rent details change
  useEffect(() => {
    setRegForm(prev => {
      let changed = false;
      const updatedYears = (prev.years || []).map(yrData => {
        if (yrData && (yrData.active || yrData.isFileUploaded)) {
          const recalculated = recalculateYearData(
            yrData,
            prev.dependentsCount,
            prev.seniorCount,
            prev.disabledCount,
            prev.childCount,
            selectedFeeRate,
            prev.foreignerNumber,
            prev.residentAddress,
            prev
          );

          if (JSON.stringify(recalculated) !== JSON.stringify(yrData)) {
            changed = true;
            return recalculated;
          }
        }
        return yrData;
      });

      if (changed) {
        return {
          ...prev,
          years: updatedYears
        };
      }
      return prev;
    });
  }, [
    regForm.foreignerNumber,
    regForm.residentAddress,
    selectedFeeRate,
    regForm.isMonthlyRent,
    regForm.rentAllHouseholdsNoHouse,
    regForm.monthlyRentFee
  ]);

  // Redirect regular managers away from dashboard if they somehow access it
  useEffect(() => {
    if (currentView === 'dashboard' && currentManager?.email !== 'admin@novel.com') {
      setCurrentView('customer');
    }
  }, [currentView, currentManager]);

  const handleResetAll = () => {
    // 폼에 입력 내용이 있거나 기존 고객이 로드된 상태인 경우 경고창 띄우기
    const hasData = regForm.clientId || regForm.name || regForm.foreignerNumber || regForm.phone;
    if (hasData) {
      const confirmReset = window.confirm(
        '⚠️ 정말 초기화하시겠습니까?\n현재 불러온 고객 정보와 입력된 모든 내용이 초기화되며, 신규 저장 화면으로 이동합니다.'
      );
      if (!confirmReset) return;
    }

    const defaultNationality = (currentManagerCountry && currentManagerCountry !== 'ALL')
      ? currentManagerCountry
      : '미얀마';

    setRegForm({
      clientId: '',
      serial: 0,
      name: '',
      foreignerNumber: '',
      nationality: defaultNationality,
      companyAddress: '',
      companyPhone: '',
      companyIndustry: '',
      managerName: 'Boram',
      telecom: 'SKT',
      phone: '',
      visaType: 'E10',
      residentAddress: '',
      visaExpiry: '',
      isMonthlyRent: '부',
      landlordName: '',
      landlordRegNum: '',
      rentHousingType: '오피스텔',
      rentHousingSize: '',
      rentContractor: '본인',
      rentHouseholder: '세대주',
      rentAllHouseholdsNoHouse: '부',
      monthlyRentFee: '',
      rentLeaseStart: '',
      rentLeaseEnd: '',
      rentContractDocFile: null as File | null,
      rentContractDocUrl: '',
      rentReceiptDocFile: null as File | null,
      rentReceiptDocUrl: '',
      refundBankName: 'KB국민은행',
      refundBank: '',
      refundStatus: '대기',
      residentRegisterAddress: '',
      deductionSubmissionStatus: '◎제출이력없음',
      deductionApplyPeriod: '',
      deductionSentDate: '',
      claimRequestDate: '',
      claimCompleteDate: '',
      additionalApplyPerformance: '',
      feePaymentStatus: '후불 22%',
      taxReductionApplyDateStart: '',
      taxReductionApplyDateEnd: '',
      isNextYearApply: false,

      years: [
        { id: 'temp_2021', year: '2021', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        { id: 'temp_2022', year: '2022', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        { id: 'temp_2023', year: '2023', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        { id: 'temp_2024', year: '2024', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        { id: 'temp_2025', year: '2025', active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      ],
      deletedYearIds: [],

      snsName: '',
      snsAddress: '',
      hometaxId: '',
      hometaxPw: '',
      customerGrade: '',
      greenContractDate: '',
      consultMemo: '',
      refundPerformance: '0',
      refundPerformanceDate: '',
      feeReceivedPerformance: '0',
      feeReceivedDate: '',
      dependentsCount: 0,
      seniorCount: 0,
      disabledCount: 0,
      childCount: 0,
      familyDocUrl: [],
      remittanceDocUrl: [],
      familyDocFile: [],
      remittanceDocFile: [],
      freelancerYears: {
        '2021': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2022': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2023': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2024': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2025': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' }
      },
      consentStatus: '대기',
      arcImageUrl: '',
      signatureImageUrl: ''
    });
    setConsultMemos([]);
    setTargetYears(['2021', '2022', '2023', '2024', '2025']);
    showToast('고객 등록 정보 및 정산 데이터가 전체 초기화되었습니다.', 'info');
  };

  // Local recalculateYearData function removed; using imported version from taxCalculator.ts

  const updateDependentsCount = (key: 'dependentsCount' | 'seniorCount' | 'disabledCount' | 'childCount', delta: number) => {
    setRegForm(prev => {
      const newDepCount = key === 'dependentsCount' ? Math.max(0, prev.dependentsCount + delta) : prev.dependentsCount;
      const newSenCount = key === 'seniorCount' ? Math.max(0, prev.seniorCount + delta) : prev.seniorCount;
      const newDisCount = key === 'disabledCount' ? Math.max(0, prev.disabledCount + delta) : prev.disabledCount;
      const newChCount = key === 'childCount' ? Math.max(0, prev.childCount + delta) : prev.childCount;

      const updatedYears = (prev.years || []).map(yrData => {
        return recalculateYearData(
          yrData,
          newDepCount,
          newSenCount,
          newDisCount,
          newChCount,
          selectedFeeRate,
          prev.foreignerNumber,
          prev.residentAddress,
          prev
        );
      });

      const updatedFreelancerYears = { ...prev.freelancerYears };
      Object.keys(updatedFreelancerYears).forEach(yr => {
        if (updatedFreelancerYears[yr]?.active) {
          const income = Number(updatedFreelancerYears[yr].totalIncome) || 0;
          const tax3 = Math.round(income * 0.03);
          const tax03 = Math.round(tax3 * 0.1);
          const total33 = tax3 + tax03;
          const feeAmt = Math.round(total33 * (selectedFeeRate / 100));

          updatedFreelancerYears[yr] = {
            ...updatedFreelancerYears[yr],
            refundExpectNational: String(tax3),
            refundExpectLocal: String(tax03),
            courtFee: String(total33),
            expectedFeeAmt: String(feeAmt)
          };
        }
      });

      return {
        ...prev,
        dependentsCount: newDepCount,
        seniorCount: newSenCount,
        disabledCount: newDisCount,
        childCount: newChCount,
        years: updatedYears,
        freelancerYears: updatedFreelancerYears
      };
    });
  };

  const handleFeeRateChange = (rate: number) => {
    setSelectedFeeRate(rate);
    setRegForm(prev => {
      const updatedYears = (prev.years || []).map(yrData => {
        return recalculateYearData(
          yrData,
          prev.dependentsCount,
          prev.seniorCount,
          prev.disabledCount,
          prev.childCount,
          rate,
          prev.foreignerNumber,
          prev.residentAddress,
          prev
        );
      });
      return { ...prev, years: updatedYears };
    });
  };

  const getCombinedRefund = (yr: string) => {
    return calculateCombinedRefund(regForm, yr, selectedFeeRate);
  };

  const handleAddYear = () => {
    const rawYear = prompt('추가할 정산 연도를 입력해주세요 (예: 2024):');
    if (!rawYear) return;
    const cleanYear = rawYear.trim();
    if (!/^\d{4}$/.test(cleanYear)) {
      alert('올바른 4자리 연도를 입력해주세요 (예: 2026).');
      return;
    }

    setRegForm(prev => {
      const newId = 'temp_' + Date.now();
      const newYearObj = {
        id: newId,
        year: cleanYear,
        active: false,
        workPeriod: '',
        workPlace: '',
        businessNumber: '',
        birthDate: '',
        salaryTotal: '0',
        taxBase: '0',
        childReduction: '0',
        childDeduction: '0',
        decisionTax: '0',
        localTax: '0',
        taxRefundTotal: '0',
        childReductionApply: '90%',
        childReductionApplyAmt: '0',
        childDeductionApplyAmt: '0',
        decisionTaxApplyAmt: '0',
        localTaxApplyAmt: '0',
        decisionTaxRefundAmt: '0',
        refundExpectNational: '0',
        refundExpectLocal: '0',
        courtFee: '0',
        expectedFeeAmt: '0'
      };
      const updatedYears = [...(prev.years || []), newYearObj].sort((a, b) => {
        const yrA = Number(a.year) || 0;
        const yrB = Number(b.year) || 0;
        if (yrA !== yrB) return yrA - yrB;
        const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
        const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
        return dateA.localeCompare(dateB);
      });
      return { ...prev, years: updatedYears };
    });
    showToast(`${cleanYear}년도가 정산 연도에 추가되었습니다.`, 'success');
  };

  const handleRemoveYear = (idToRemove: string, yearLabel: string) => {
    if (window.confirm(`정말 ${yearLabel}의 근로소득 정보를 삭제하시겠습니까?`)) {
      setRegForm(prev => {
        const itemToRemove = (prev.years || []).find((y: any) => y.id === idToRemove);
        const updatedDeletedIds = [...(prev.deletedYearIds || [])];
        if (itemToRemove && itemToRemove.id && !String(itemToRemove.id).startsWith('temp_')) {
          updatedDeletedIds.push(itemToRemove.id);
        }
        const updatedYears = (prev.years || []).filter((y: any) => y.id !== idToRemove);
        return {
          ...prev,
          years: updatedYears,
          deletedYearIds: updatedDeletedIds
        };
      });
      showToast(`${yearLabel} 데이터가 삭제되었습니다. 고객 업데이트 시 영구 적용됩니다.`, 'info');
    }
  };

  const handleRemoveFreelancerYear = (yr: string) => {
    if (window.confirm(`정말 ${yr}년도의 3.3% 사업소득 정보를 삭제하시겠습니까?`)) {
      setRegForm((prev: any) => {
        const updatedFreelancerYears = { ...prev.freelancerYears };
        if (updatedFreelancerYears[yr]) {
          updatedFreelancerYears[yr] = {
            ...updatedFreelancerYears[yr],
            active: false,
            totalIncome: '0',
            withholdingTax3: '0',
            localTax03: '0',
            totalWithholding33: '0',
            refundExpectNational: '0',
            refundExpectLocal: '0',
            courtFee: '0',
            expectedFeeAmt: '0',
            workPlace: '',
            businessNumber: ''
          };
        }
        return {
          ...prev,
          freelancerYears: updatedFreelancerYears
        };
      });
      showToast(`${yr}년도 3.3% 사업소득 데이터가 삭제되었습니다. 고객 업데이트 시 영구 적용됩니다.`, 'info');
    }
  };



  // Options List
  const nationalities = [
    '네팔',
    '캄보디아',
    '인도네시아',
    '베트남',
    '태국',
    '미얀마',
    '필리핀',
    '스리랑카',
    '방글라데시',
    '우즈베키스탄',
    '파키스탄',
    '몽골',
    '키르기스스탄',
    '고려인',
    '카자흐스탄',
    '중국',
    '한국',
    '기타국가'
  ];
  const refundStatuses = [
    '대기',
    '◎경정상담중',
    '자격안됨',
    '◎자격안됨(확인완료)',
    '고객취소',
    '홈택스가입불가',
    '◆간편인증서류가입요청',
    '◆간편인증서류완료',
    '◆녹취계약요청',
    '◆녹취계약완료',
    '※감면명세서요청중',
    '◇경청청구요청',
    '노벨경정청구중',
    '세로경정청구중',
    '♥경정청구완료',
    '경정청구반려',
    '▲경정청구기각',
    '♡수수료요청',
    '♡국세수수료수납완료',
    '◆지방세수수료수납완료',
    '♠지방세수수료수납완료',
    '◆수수료 연체'
  ];
  const visaTypes = [
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'E7',
    'E9',
    'E10',
    'D10',
    'H2',
    '한국국적',
    '기타'
  ];
  const bankList = [
    'KB국민은행',
    'SC제일은행',
    '경남은행',
    '광주은행',
    '기업은행',
    '농협',
    '대구은행',
    '부산은행',
    '산업은행',
    '새마을금고',
    '수협',
    '신한은행',
    '신협',
    '우리은행',
    '우체국',
    '전북은행',
    '축협',
    '카카오',
    '케이뱅크',
    '하나은행',
    '한국씨티은행',
    '토스뱅크'
  ];
  const submissionStatuses = [
    '◎제출이력없음',
    '◎이전회사재출',
    '◎재직회사재출',
    '우편발송',
    '◆팩스발송',
    '◆사진발송',
    '▶명세서 홈텍스반영',
    '♡감면신청서처리',
    '감면명세서 요망',
    '기타'
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const {
    handleDownloadPdf,
    handleSingleYearPdfUpload,
    handleFreelancerSingleYearPdfUpload,
    handleReanalyzeYearPdf,
    handleBulkPdfUpload
  } = usePdfHandlers(
    regForm,
    setRegForm,
    selectedFeeRate,
    setTargetYears,
    showToast
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync Manager Countries
  const handleInlineManagerChange = (customerId: number, managerName: string) => {
    const dbMgr = dbManagers.find(m => m.name === managerName);
    const matchedTeam = dbTeams.find(t => t.id === dbMgr?.teamId);
    const matchedCountry = matchedTeam?.name || '';

    setTempInlineEdits(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        managerName,
        ...(matchedCountry ? { managerCountry: matchedCountry } : {})
      }
    }));
  };

  const handleInlineCountryChange = (customerId: number, nationality: string) => {
    setTempInlineEdits(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        nationality
      }
    }));
  };

  const handleSaveRow = async (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const edit = tempInlineEdits[customerId] || {};
      const targetCountry = edit.nationality || customer.nationality;
      const targetManager = edit.managerName || customer.managerName;

      showToast(`${customer.name}님의 담당자 정보를 DB에 저장 중입니다...`, 'info');
      const res = await updateClientManagerInSupabase(customer.id, targetManager, targetCountry);
      if (res.success) {
        setCustomers(prev =>
          prev.map(c =>
            c.id === customerId
              ? {
                  ...c,
                  nationality: targetCountry,
                  managerName: targetManager,
                  managerCountry: edit.managerCountry || customer.managerCountry
                }
              : c
          )
        );
        setTempInlineEdits(prev => {
          const next = { ...prev };
          delete next[customerId];
          return next;
        });
        showToast(`${customer.name}님의 담당자(${targetCountry}팀 / ${targetManager})가 DB 및 대시보드에 성공적으로 반영되었습니다!`, 'success');
      } else {
        showToast(`${customer.name}님의 담당자 정보 저장에 실패했습니다: ${res.error || 'Unknown Error'}`, 'error');
      }
    }
  };

  const handleOpenCustomerRegistration = async (customer: Customer) => {
    try {
      showToast(`${customer.name || '고객'} 님의 상세 정보를 불러오는 중입니다...`, 'info');

      // Query Client records using multiple matching strategies to handle duplicate/legacy entries in Supabase
      let clientRecords: any[] = [];
      if (customer.id) {
        const { data } = await supabase
          .from('Client')
          .select('*')
          .eq('serial', customer.id);
        if (data && data.length > 0) clientRecords = data;
      }

      if (clientRecords.length === 0 && customer.birthDate) {
        const { data } = await supabase
          .from('Client')
          .select('*')
          .eq('regNum', customer.birthDate);
        if (data && data.length > 0) clientRecords = data;
      }

      if (clientRecords.length === 0 && customer.name) {
        const { data } = await supabase
          .from('Client')
          .select('*')
          .ilike('name', `%${customer.name.trim()}%`);
        if (data && data.length > 0) clientRecords = data;
      }

      const clientDetails = clientRecords[0] || null;
      const clientIds = clientRecords.map(c => c.id).filter(Boolean);

      const customerNat = clientDetails?.country || customer.nationality;
      if (customerNat && currentManagerCountry && currentManagerCountry !== 'ALL' && customerNat !== currentManagerCountry) {
        const confirmAccess = window.confirm(`⚠️ 이 고객은 [${customerNat}팀] 고객입니다. 귀하는 [${currentManagerCountry}팀] 매니저입니다. 계속해서 이 고객의 상세 정보를 조회/수정하시겠습니까?`);
        if (!confirmAccess) {
          return;
        }
      }

      let yearRecords: any[] = [];
      if (clientIds.length > 0) {
        const { data: yData } = await supabase
          .from('YearEndData')
          .select('*')
          .in('clientId', clientIds);
        if (yData && yData.length > 0) yearRecords = yData;
      }

      // Fetch ConsultMemo logs for this client
      let consultMemosList: any[] = [];
      if (clientDetails?.id) {
        const { data: memoData, error: memoErr } = await supabase
          .from('ConsultMemo')
          .select('*')
          .eq('clientId', clientDetails.id)
          .order('createdAt', { ascending: false });
        if (!memoErr && memoData) {
          consultMemosList = memoData;
        }
      }
      setConsultMemos(consultMemosList);

      const loadedYearsList: any[] = [];
      const loadedYearsSet = new Set<string>();

      for (const yr of yearRecords) {
        if (yr.freelancerActive) continue; // Skip freelancer-only records for wage table
        const yrKey = String(yr.year);
        loadedYearsSet.add(yrKey);

        const workPeriodStr = (yr.workPeriodStart && yr.workPeriodEnd) 
          ? `${yr.workPeriodStart} ~ ${yr.workPeriodEnd}` 
          : (yr.workPeriodStart || yr.workPeriodEnd || yr.workPeriod || '');

        const totalSal = yr.netSalary || yr.netSalaryFromReceipt || yr.netSalaryFromAllCompany || 0;
        const calcTax = yr.calculatedTax || 0;
        const smallDed = yr.smallBusinessYouthTaxCredit || yr.smallBusinessDeduction || 0;
        const detTax = yr.determinedTax || yr.determineTax || yr.determinedTaxFromReceipt || 0;
        const locTax = yr.localTax || 0;
        const changedDetTax = yr.changedDeterminedTax || yr.changedDetermineTax || 0;
        const changedLocTax = yr.changedLocalTax || 0;
        const totalRef = yr.totalTaxRefund || yr.determinedTaxRefund || 0;
        const localRef = yr.localTaxRefund || 0;

        const isWageActive = Boolean(yr.companyName || totalSal > 0 || detTax > 0 || yr.fileURL);
        const rentRefundTotal = yr.rentRefundTotal || 0;
        const rentRefundExpectNational = yr.rentRefundExpectNational || 0;
        const rentRefundExpectLocal = yr.rentRefundExpectLocal || 0;
        const dependentRefundTotal = yr.dependentRefundTotal || 0;

        const rawYrData = {
          id: String(yr.id),
          active: isWageActive,
          isFileUploaded: Boolean(yr.fileURL),
          pdfFile: null,
          fileURL: yr.fileURL || '',
          pdfUrl: yr.fileURL || '',
          year: yrKey,
          workPeriod: workPeriodStr,
          workPlace: yr.companyName || '',
          businessNumber: yr.companyRegNo || yr.companyRegisterNumber || '',
          companyRegNum: yr.companyRegNo || yr.companyRegisterNumber || '',
          birthDate: yr.regNum || customer.birthDate || '',
          
          salaryTotal: totalSal,
          totalSalary: totalSal,
          taxBase: calcTax,
          childReduction: smallDed,
          appliedTaxReduction: smallDed,
          decisionTax: detTax,
          originalDeterminedTax: detTax,
          localTax: locTax,
          taxRefundTotal: yr.totalTax || 0,
          childReductionApply: yr.isSmallBusinessDeduction ? '90%' : '90%',
          childReductionApplyAmt: smallDed,
          decisionTaxApplyAmt: changedDetTax,
          recalcDeterminedTax: changedDetTax,
          localTaxApplyAmt: changedLocTax,
          recalcLocalTax: changedLocTax,
          decisionTaxRefundAmt: (changedDetTax + changedLocTax),
          refundExpectNational: totalRef,
          expectedRefundNational: totalRef,
          refundExpectLocal: localRef,
          expectedRefundLocal: localRef,
          courtFee: totalRef,
          isReductionEligible: (yr.isSmallBusiness || yr.isSmallBusinessDeduction) ? '여' : '부',
          correctionFileUrl: yr.correction_file || yr.correction_file_url || '',
          isRefundOverridden: false,
          rentRefundTotal,
          rentRefundExpectNational,
          rentRefundExpectLocal,
          dependentRefundTotal,
          dependentsCount: yr.dependentsCount !== null && yr.dependentsCount !== undefined ? Number(yr.dependentsCount) : undefined,
          seniorCount: yr.seniorCount !== null && yr.seniorCount !== undefined ? Number(yr.seniorCount) : undefined,
          disabledCount: yr.disabledCount !== null && yr.disabledCount !== undefined ? Number(yr.disabledCount) : undefined,
          childCount: yr.childCount !== null && yr.childCount !== undefined ? Number(yr.childCount) : undefined
        };

        const tempRegForm = {
          isMonthlyRent: clientDetails?.isMonthlyTenant || clientDetails?.isMonthlyRent ? '가' : '부',
          rentAllHouseholdsNoHouse: clientDetails?.rentAllHouseholdsNoHouse || '부',
          monthlyRentFee: clientDetails?.monthlyRentFee ? String(clientDetails.monthlyRentFee) : '',
          dependentsCount: Number(clientDetails?.dependentsCount) || 0,
          seniorCount: Number(clientDetails?.seniorCount) || 0,
          disabledCount: Number(clientDetails?.disabledCount) || 0,
          childCount: Number(clientDetails?.childCount) || 0
        };

        const yrDep = rawYrData.dependentsCount !== undefined ? rawYrData.dependentsCount : (Number(clientDetails?.dependentsCount) || 0);
        const yrSen = rawYrData.seniorCount !== undefined ? rawYrData.seniorCount : (Number(clientDetails?.seniorCount) || 0);
        const yrDis = rawYrData.disabledCount !== undefined ? rawYrData.disabledCount : (Number(clientDetails?.disabledCount) || 0);
        const yrChild = rawYrData.childCount !== undefined ? rawYrData.childCount : (Number(clientDetails?.childCount) || 0);

        let calculatedYrData = recalculateYearData(
          rawYrData,
          yrDep,
          yrSen,
          yrDis,
          yrChild,
          selectedFeeRate,
          clientDetails?.regNum || '',
          clientDetails?.hireDate ? clientDetails.hireDate.split('T')[0] : '',
          tempRegForm
        );

        // Check if calculated refund matches database saved refund. If not, it's a manual override!
        const calcNat = Number(calculatedYrData.refundExpectNational) || 0;
        const calcLoc = Number(calculatedYrData.refundExpectLocal) || 0;
        const savedNat = Number(totalRef) || 0;
        const savedLoc = Number(localRef) || 0;

        if (calcNat !== savedNat || calcLoc !== savedLoc) {
          rawYrData.isRefundOverridden = true;
          rawYrData.refundExpectNational = savedNat;
          rawYrData.refundExpectLocal = savedLoc;
          calculatedYrData = recalculateYearData(
            rawYrData,
            yrDep,
            yrSen,
            yrDis,
            yrChild,
            selectedFeeRate,
            clientDetails?.regNum || '',
            clientDetails?.hireDate ? clientDetails.hireDate.split('T')[0] : '',
            tempRegForm
          );
        }

        loadedYearsList.push(calculatedYrData);
      }

      const defaultYears = ['2021', '2022', '2023', '2024', '2025'];
      for (const defYr of defaultYears) {
        if (!loadedYearsSet.has(defYr)) {
          loadedYearsList.push({
            id: `temp_${defYr}`,
            year: defYr,
            active: false,
            isFileUploaded: false,
            pdfFile: null,
            fileURL: '',
            pdfUrl: '',
            workPeriod: '',
            workPlace: '',
            businessNumber: '',
            companyRegNum: '',
            birthDate: '',
            salaryTotal: 0,
            totalSalary: 0,
            taxBase: 0,
            childReduction: 0,
            appliedTaxReduction: 0,
            decisionTax: 0,
            originalDeterminedTax: 0,
            localTax: 0,
            taxRefundTotal: 0,
            childReductionApply: '90%',
            childReductionApplyAmt: 0,
            decisionTaxApplyAmt: 0,
            recalcDeterminedTax: 0,
            localTaxApplyAmt: 0,
            recalcLocalTax: 0,
            decisionTaxRefundAmt: 0,
            refundExpectNational: 0,
            expectedRefundNational: 0,
            refundExpectLocal: 0,
            expectedRefundLocal: 0,
            courtFee: 0,
            isReductionEligible: '가',
            correctionFileUrl: ''
          });
        }
      }

      loadedYearsList.sort((a, b) => {
        const yrA = Number(a.year) || 0;
        const yrB = Number(b.year) || 0;
        if (yrA !== yrB) return yrA - yrB;
        const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
        const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
        return dateA.localeCompare(dateB);
      });

      const yearsObj = loadedYearsList;

      // 3.3% 프리랜서 사업소득 데이터 로드 로직 추가
      const freelancerYearsObj: Record<string, any> = {
        '2021': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2022': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2023': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2024': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2025': { active: false, isFileUploaded: false, pdfFile: null, workPlace: '', businessNumber: '', totalIncome: '0', withholdingTax3: '0', localTax03: '0', totalWithholding33: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' }
      };

      for (const yr of yearRecords) {
        if (!yr.freelancerActive) continue; // Skip pure wage records
        const yrKey = String(yr.year);
        if (yr.freelancerActive || yr.freelancerNetSalary > 0 || yr.freelancerCourtFee > 0 || yr.freelancerFileURL) {
          freelancerYearsObj[yrKey] = {
            active: true,
            isFileUploaded: Boolean(yr.freelancerFileURL),
            pdfFile: null,
            fileURL: yr.freelancerFileURL || '',
            pdfUrl: yr.freelancerFileURL || '',
            workPlace: yr.freelancerCompanyName || '',
            businessNumber: yr.freelancerCompanyRegNo || '',
            totalIncome: String(yr.freelancerNetSalary || 0),
            withholdingTax3: String(yr.freelancerDeterminedTax || 0),
            localTax03: String(yr.freelancerLocalTax || 0),
            totalWithholding33: String((yr.freelancerDeterminedTax || 0) + (yr.freelancerLocalTax || 0)),
            refundExpectNational: String(yr.freelancerRefundExpectNational || 0),
            refundExpectLocal: String(yr.freelancerRefundExpectLocal || 0),
            courtFee: String(yr.freelancerCourtFee || 0),
            expectedFeeAmt: String(yr.freelancerExpectedFeeAmt || 0),
            incomeTypeCode: yr.freelancerIncomeTypeCode || '3.3%',
            isNonRefundable: Boolean(yr.freelancerIsNonRefundable)
          };
        }
      }

      setRegForm(prev => ({
        ...prev,
        clientId: clientDetails?.id || '',
        serial: clientDetails?.serial || customer.id || 0,
        name: clientDetails?.name || customer.name,
        foreignerNumber: clientDetails?.regNum || customer.birthDate,
        nationality: clientDetails?.country || customer.nationality,
        managerName: customer.managerName || 'Boram',
        phone: clientDetails?.phone || '',
        telecom: clientDetails?.phoneComp || clientDetails?.phoneCompany || 'KT',
        visaType: clientDetails?.visa || customer.visa,
        visaExpiry: clientDetails?.visaExpireDate ? clientDetails.visaExpireDate.split('T')[0] : '',
        isMonthlyRent: clientDetails?.isMonthlyTenant || clientDetails?.isMonthlyRent ? '가' : '부',
        refundBankName: clientDetails?.bank || '',
        refundBank: clientDetails?.bankAccount || '',
        refundStatus: clientDetails?.paybackProgress || customer.refundStatus || '◎경정상담중',
        residentRegisterAddress: clientDetails?.address || '',
        residentAddress: clientDetails?.hireDate ? clientDetails.hireDate.split('T')[0] : '',
        deductionSubmissionStatus: clientDetails?.taxReductionProgress || '◎제출이력없음',
        deductionSentDate: clientDetails?.taxReductionSentDate ? clientDetails.taxReductionSentDate.split('T')[0] : '',
        additionalApplyPerformance: clientDetails?.isAdditionalPayback || clientDetails?.isAdditionalApply ? '가' : '부',
        claimCompleteDate: clientDetails?.rectificationRequestDate ? clientDetails.rectificationRequestDate.split('T')[0] : '',
        claimRequestDate: clientDetails?.additionalApplyDate ? clientDetails.additionalApplyDate.split('T')[0] : '',
        feePaymentStatus: clientDetails?.feeMethod || '후불 22%',
        taxReductionApplyDateStart: clientDetails?.taxReductionApplyDateStart ? clientDetails.taxReductionApplyDateStart.split('T')[0] : '',
        taxReductionApplyDateEnd: clientDetails?.taxReductionApplyDateEnd ? clientDetails.taxReductionApplyDateEnd.split('T')[0] : '',
        hometaxId: clientDetails?.hometaxId || '',
        hometaxPw: clientDetails?.hometaxPw || '',
        snsName: clientDetails?.facebookName || '',
        snsAddress: clientDetails?.facebookURL || '',
        customerGrade: clientDetails?.clientRank || '',
        greenContractDate: clientDetails?.recordFileDate ? clientDetails.recordFileDate.split('T')[0] : '',
        landlordName: clientDetails?.landlordName || '',
        landlordRegNum: clientDetails?.landlordRegNum || '',
        rentHousingType: clientDetails?.rentHousingType || '오피스텔',
        rentHousingSize: clientDetails?.rentHousingSize ? String(clientDetails.rentHousingSize) : '',
        rentLeaseStart: clientDetails?.rentLeaseStart ? clientDetails.rentLeaseStart.split('T')[0] : '',
        rentLeaseEnd: clientDetails?.rentLeaseEnd ? clientDetails.rentLeaseEnd.split('T')[0] : '',
        monthlyRentFee: clientDetails?.monthlyRentFee ? String(clientDetails.monthlyRentFee) : '',
        rentContractor: clientDetails?.rentContractor || '본인',
        rentHouseholder: clientDetails?.rentHouseholder || '세대주',
        rentAllHouseholdsNoHouse: clientDetails?.rentAllHouseholdsNoHouse || '부',
        rentContractDocUrl: clientDetails?.rentContractDocUrl || '',
        rentReceiptDocUrl: clientDetails?.rentReceiptDocUrl || '',
        dependentsCount: Number(clientDetails?.dependentsCount) || 0,
        seniorCount: Number(clientDetails?.seniorCount) || 0,
        disabledCount: Number(clientDetails?.disabledCount) || 0,
        childCount: Number(clientDetails?.childCount) || 0,
        familyDocUrl: Array.isArray(clientDetails?.familyDocUrl) 
          ? clientDetails.familyDocUrl 
          : (clientDetails?.familyDocUrl ? [clientDetails.familyDocUrl] : []),
        remittanceDocUrl: Array.isArray(clientDetails?.remittanceDocUrl) 
          ? clientDetails.remittanceDocUrl 
          : (clientDetails?.remittanceDocUrl ? [clientDetails.remittanceDocUrl] : []),
        familyDocFile: [] as File[],
        remittanceDocFile: [] as File[],
        refundPerformance: String(clientDetails?.refund_performance || 0),
        refundPerformanceDate: clientDetails?.refund_performance_date ? clientDetails.refund_performance_date.split('T')[0] : '',
        feeReceivedPerformance: String(clientDetails?.fee_performance || 0),
        feeReceivedDate: clientDetails?.fee_performance_date ? clientDetails.fee_performance_date.split('T')[0] : '',
        companyAddress: clientDetails?.companyAddress || '',
        companyPhone: clientDetails?.companyPhone || '',
        companyIndustry: clientDetails?.companyIndustry || '',
        consentStatus: clientDetails?.consentStatus || '대기',
        arcImageUrl: clientDetails?.arcImageUrl || '',
        signatureImageUrl: clientDetails?.signatureImageUrl || '',
        isNextYearApply: clientDetails?.isNextYearApply || false,
        years: yearsObj,
        freelancerYears: freelancerYearsObj
      }));

      setCurrentView('registration');
      showToast(`${customer.name} 님의 고객 등록 관리 화면을 열었습니다.`, 'success');
    } catch (err) {
      console.error('Error loading customer details:', err);
      setRegForm(prev => ({
        ...prev,
        name: customer.name,
        foreignerNumber: customer.birthDate,
        nationality: customer.nationality,
        visaType: customer.visa,
      }));
      setCurrentView('registration');
    }
  };

  // Restore view state from URL query parameters on initial load or login
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!currentManagerCountry) return;

    let parsedCountry = getCountryFromPath(dbTeams);

    if (!parsedCountry) {
      const managerCountry = currentManagerCountry || '미얀마';
      const code = getCodeFromCountry(dbTeams, managerCountry);
      const params = new URLSearchParams(window.location.search);
      const newSearch = params.toString();
      const newUrl = `/${code}` + (newSearch ? '?' + newSearch : '');
      window.history.replaceState({}, document.title, newUrl);
      setPathCountry(managerCountry);
      parsedCountry = managerCountry;
    } else {
      setPathCountry(parsedCountry);
    }

    if (currentManagerCountry && currentManagerCountry !== 'ALL' && parsedCountry !== currentManagerCountry) {
      const confirmAccess = window.confirm(`⚠️ 귀하는 [${currentManagerCountry}팀] 매니저입니다. 현재 [${parsedCountry}팀] 고객 정보를 열람/수정하시겠습니까?`);
      if (!confirmAccess) {
        const code = getCodeFromCountry(dbTeams, currentManagerCountry);
        const params = new URLSearchParams(window.location.search);
        const newSearch = params.toString();
        const newUrl = `/${code}` + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, document.title, newUrl);
        setPathCountry(currentManagerCountry);
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const serial = params.get('serial');
    if (view === 'registration' && serial) {
      const serialNum = Number(serial);
      if (serialNum) {
        handleOpenCustomerRegistration({ id: serialNum } as any);
      }
    }
  }, [isLoggedIn, currentManagerCountry, dbTeams]);

  // Synchronize view state to URL query parameters
  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (currentView === 'registration' && regForm.serial) {
      params.set('view', 'registration');
      params.set('serial', String(regForm.serial));
    } else {
      params.delete('view');
      params.delete('serial');
    }
    const newSearch = params.toString();
    const activeCountry = (currentView === 'registration' && regForm.nationality)
      ? regForm.nationality
      : pathCountry;
    const code = getCodeFromCountry(dbTeams, activeCountry);
    const newUrl = `/${code}` + (newSearch ? '?' + newSearch : '');
    window.history.replaceState({}, document.title, newUrl);
  }, [currentView, regForm.serial, regForm.nationality, isLoggedIn, pathCountry, dbTeams]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredCustomers.map(c => c.id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const handleDeleteCustomers = async () => {
    if (selectedIds.length === 0) {
      showToast('삭제할 항목을 체크박스로 선택해 주세요.', 'error');
      return;
    }
    if (window.confirm(`선택한 ${selectedIds.length}건의 데이터를 정말 삭제하시겠습니까?`)) {
      const targetIds = [...selectedIds];
      setCustomers(prev => prev.filter(c => !targetIds.includes(c.id)));
      setSelectedIds([]);
      showToast('선택한 고객 데이터를 삭제하는 중입니다...', 'info');
      await deleteClientsFromSupabase(targetIds);
      showToast(`${targetIds.length}건의 고객 데이터 삭제가 완벽히 처리되었습니다.`, 'success');
    }
  };

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      showToast('내보낼 데이터가 없습니다.', 'error');
      return;
    }
    const headers = ['번호', '등록일', '국적', '이름', '생년월일', '비자', '회사명', '환급처리상태', '월세여부', '담당자'];
    const csvRows = [headers.join(',')];

    filteredCustomers.forEach(c => {
      csvRows.push([
        c.id,
        `"${c.registeredDate}"`,
        `"${c.nationality}"`,
        `"${c.name}"`,
        `"${c.birthDate}"`,
        `"${c.visa}"`,
        `"${c.companyName}"`,
        `"${c.refundStatus}"`,
        `"${c.monthlyRent}"`,
        `"${c.managerName}"`
      ].join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `노벨세무회계_고객목록_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('엑셀 다운로드가 완료되었습니다.', 'success');
  };

  // Save complex registration form
  const handleSaveRegistration = async () => {
    if (!regForm.name) {
      showToast('신청인 이름은 필수입니다.', 'error');
      return;
    }

    if (pathCountry && pathCountry !== 'ALL' && regForm.nationality !== pathCountry) {
      const confirmSave = window.confirm(`⚠️ 현재 작업 중인 경로(팀 영역)는 [${pathCountry}]입니다. 저장하려는 고객의 국적은 [${regForm.nationality}]입니다. 이 국적으로 저장을 계속 진행하시겠습니까?`);
      if (!confirmSave) {
        return;
      }
    }

    const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 24708;
    const today = new Date();
    const formattedDate = `${String(today.getFullYear()).slice(-2)}. ${today.getMonth() + 1}. ${today.getDate()}.`;

    // Gather uploaded PDF file objects dynamically mapping by each yrData's id
    const pdfFiles: Record<string, File | null> = {};
    (regForm.years || []).forEach((y: any) => {
      if (y.pdfFile) {
        pdfFiles[y.id] = y.pdfFile;
      }
    });

    showToast('Supabase 클라우드 저장소에 고객 정보 및 PDF 파일 동기화를 진행 중입니다...', 'info');

    try {
      const res = await saveRegistrationToSupabase(regForm, pdfFiles);
      if (res && res.success) {
        // Map registration form to simplified list view customer using actual serial from DB
        const isUpdate = regForm.serial && regForm.serial > 0;
        const actualSerial = res.serial || regForm.serial || nextId;
        
        let companyName = '-';
        for (let i = (regForm.years || []).length - 1; i >= 0; i--) {
          const yrData = regForm.years[i];
          if (yrData?.active && yrData.workPlace) {
            companyName = yrData.workPlace;
            break;
          }
        }

        const savedCustomerItem: Customer = {
          id: actualSerial,
          uuid: res.clientId || regForm.clientId || undefined,
          registeredDate: formattedDate,
          nationality: regForm.nationality,
          name: regForm.name.toUpperCase(),
          birthDate: regForm.foreignerNumber,
          visa: regForm.visaType,
          companyName: companyName,
          refundStatus: regForm.refundStatus,
          submissionStatus: regForm.deductionSubmissionStatus,
          monthlyRent: regForm.isMonthlyRent === '가' ? '예' : '아니오',
          claimDate: regForm.claimCompleteDate || '-',
          additionalApplyDate: regForm.claimRequestDate || '-',
          additionalPerformance: Number(regForm.additionalApplyPerformance) || 0,
          managerCountry: regForm.nationality,
          managerName: regForm.managerName || managers.find(m => m.country === regForm.nationality)?.name || managers[0].name,
          phone: regForm.phone || '',
          consentStatus: regForm.consentStatus || '대기',
          arcImageUrl: regForm.arcImageUrl || '',
          signatureImageUrl: regForm.signatureImageUrl || '',
          visaExpireDate: regForm.visaExpiry || '',
          isNextYearApply: regForm.isNextYearApply
        };

        if (isUpdate) {
          setCustomers(prev => prev.map(c => c.id === regForm.serial ? savedCustomerItem : c));
        } else {
          setCustomers(prev => [savedCustomerItem, ...prev]);
        }

        // Update temp IDs with real DB IDs, clear deletedYearIds, and update serial/clientId
        setRegForm(prev => {
          const updatedYears = (prev.years || []).map((y: any) => {
            if (res.updatedYearIdsMap && res.updatedYearIdsMap[y.id]) {
              return { ...y, id: String(res.updatedYearIdsMap[y.id]) };
            }
            return y;
          });
          return {
            ...prev,
            clientId: res.clientId || prev.clientId,
            serial: actualSerial,
            years: updatedYears,
            deletedYearIds: [],
            familyDocFile: [],
            remittanceDocFile: [],
            familyDocUrl: res.familyDocUrl || prev.familyDocUrl,
            remittanceDocUrl: res.remittanceDocUrl || prev.remittanceDocUrl
          };
        });

        showToast('고객 정보, 정산 결과 및 PDF 파일이 Supabase DB에 완벽히 동기화되었습니다!', 'success');
      } else {
        const errObj = (res.error || {}) as any;
        const errMsg = errObj.message || (typeof res.error === 'string' ? res.error : '알 수 없는 DB 오류');
        const errCode = errObj.code || 'N/A';
        const errDetails = errObj.details || '없음';
        const errHint = errObj.hint || '없음';

        alert(
          "[Supabase 저장 실패 상세 안내]\n\n" +
          "• 에러 메시지: " + errMsg + "\n" +
          "• 에러 코드 (SQLSTATE): " + errCode + "\n" +
          "• 상세 내용: " + errDetails + "\n" +
          "• 힌트: " + errHint + "\n\n" +
          "[전송한 입력값 정보]\n" +
          "- 신청인 이름: " + regForm.name + "\n" +
          "- 외국인 등록번호: " + regForm.foreignerNumber + "\n" +
          "- 담당자 이름: " + regForm.managerName + "\n" +
          "- 고객 UUID (clientId): " + (regForm.clientId || "신규 등록 (없음)") + "\n" +
          "- 고객 일련번호 (serial): " + (regForm.serial || "신규 등록 (없음)") + "\n\n" +
          "이 팝업 내용을 캡처하거나 텍스트를 복사하여 개발자에게 전달해 주세요."
        );
        showToast(`Supabase 저장 실패: ${errMsg}`, 'error');
      }
    } catch (err: any) {
      console.warn('Supabase save error:', err);
      alert(
        "[Supabase 저장 예외 발생]\n\n" +
        "• 예외 메시지: " + (err.message || err) + "\n" +
        "• Stack Trace: " + (err.stack || "없음") + "\n\n" +
        "이 팝업 내용을 캡처하거나 텍스트를 복사하여 개발자에게 전달해 주세요."
      );
      showToast(`Supabase 저장 예외: ${err.message || err}`, 'error');
    }

    // setCurrentView('customer'); // Return to list view
  };

  

  



  const handleSaveConsultInfo = async () => {
    if (!regForm.clientId) {
      showToast('상담 정보를 저장할 고객이 선택되지 않았습니다.', 'error');
      return;
    }
    showToast('상담 정보를 저장 중입니다...', 'info');
    try {
      const { error } = await supabase
        .from('Client')
        .update({
          facebookName: regForm.snsName || '',
          facebookURL: regForm.snsAddress || '',
          hometaxId: regForm.hometaxId || '',
          hometaxPw: regForm.hometaxPw || '',
          clientRank: regForm.customerGrade || '',
          recordFileDate: (regForm.greenContractDate && regForm.greenContractDate !== '') ? new Date(regForm.greenContractDate).toISOString() : null,
          refund_performance: Number(regForm.refundPerformance) || 0,
          refund_performance_date: (regForm.refundPerformanceDate && regForm.refundPerformanceDate !== '') ? new Date(regForm.refundPerformanceDate).toISOString() : null,
          fee_performance: Number(regForm.feeReceivedPerformance) || 0,
          fee_performance_date: (regForm.feeReceivedDate && regForm.feeReceivedDate !== '') ? new Date(regForm.feeReceivedDate).toISOString() : null,
          companyAddress: regForm.companyAddress || '',
          companyPhone: regForm.companyPhone || '',
          companyIndustry: regForm.companyIndustry || '',
          updatedAt: new Date().toISOString()
        })
        .eq('id', regForm.clientId);

      if (error) {
        throw error;
      }

      showToast('상담 정보가 Supabase DB에 성공적으로 저장되었습니다.', 'success');
    } catch (err: any) {
      console.error('Error saving consult info:', err);
      showToast('상담 정보 저장 실패: ' + err.message, 'error');
    }
  };

  const {
    triggerConsolidatedExcelDownload,
    triggerExcelDownload,
    triggerKoreanInvoiceDownload
  } = useExcelHandlers(
    regForm,
    selectedFeeRate,
    targetYears,
    invoiceLanguage,
    showToast,
    handleSaveConsultInfo
  );
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setCurrentManager(null);
      showToast('로그아웃되었습니다.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
      setIsLoggedIn(false);
      setCurrentManager(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedNationality('');
    setSelectedRefundStatus('');
    setSelectedManager('');
    setFilterBeforeDate('');
    setFilterCompanyName('');
    setFilterVisaType('');
    setFilterBirthDate('');
    setFilterForeignerNumber('');
    setFilterRegDate('');
    setFilterMonthlyRent('');
    showToast('필터가 초기화되었습니다.', 'info');
  };

  // 탭별 카운트 계산
  const tabCounts = useMemo(() => {
    let all = 0;
    let inProgress = 0;
    let feeCompleted = 0;
    let nextYear = 0;

    const excludedStatuses = [
      '♥경정청구완료', 
      '♡국세수수료수납완료', 
      '◆지방세수수료수납완료', 
      '♠지방세수수료수납완료', 
      '자격안됨', 
      '◎자격안됨(확인완료)', 
      '고객취소', 
      '홈택스가입불가', 
      '▲경정청구기각'
    ];

    customers.forEach(c => {
      const activeCountryFilter = pathCountry && pathCountry !== 'ALL' ? pathCountry : null;
      const matchesManagerCountry = activeCountryFilter
        ? c.nationality === activeCountryFilter
        : true;
      if (!matchesManagerCountry) return;

      all++;
      if (!excludedStatuses.includes(c.refundStatus)) {
        inProgress++;
      }
      if (c.refundStatus === '♡국세수수료수납완료' || c.refundStatus === '◆지방세수수료수납완료' || c.refundStatus === '♠지방세수수료수납완료') {
        feeCompleted++;
      }
      if (c.isNextYearApply) {
        nextYear++;
      }
    });

    return { all, inProgress, feeCompleted, nextYear };
  }, [customers, pathCountry]);

  const filteredCustomers = customers.filter(c => {
    // 국가 권한 필터링 (베트남 담당자면 베트남것만, 인도네시아면 인도네시아것만)
    const activeCountryFilter = pathCountry && pathCountry !== 'ALL' ? pathCountry : null;
    const matchesManagerCountry = activeCountryFilter
      ? c.nationality === activeCountryFilter
      : true;

    if (!matchesManagerCountry) return false;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.id).includes(searchQuery) ||
      (c.birthDate && c.birthDate.replace(/-/g, '').includes(searchQuery.replace(/-/g, '')));
    
    const matchesNationality = selectedNationality ? c.nationality === selectedNationality : true;
    const matchesRefundStatus = selectedRefundStatus ? c.refundStatus === selectedRefundStatus : true;
    const matchesManager = selectedManager ? c.managerName === selectedManager : true;

    // Helper to parse dates formatted as "26. 7. 22."
    const parseRegisteredDate = (dateStr: string): Date | null => {
      if (!dateStr || dateStr === '-') return null;
      const parts = dateStr.split('.').map(p => p.trim()).filter(Boolean);
      if (parts.length === 3) {
        const year = 2000 + parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return null;
    };

    let matchesBeforeDate = true;
    if (filterBeforeDate) {
      const bDate = new Date(filterBeforeDate);
      bDate.setHours(0, 0, 0, 0);
      const regDate = parseRegisteredDate(c.registeredDate);
      if (regDate) {
        regDate.setHours(0, 0, 0, 0);
        matchesBeforeDate = regDate < bDate;
      } else {
        matchesBeforeDate = false;
      }
    }

    let matchesRegDate = true;
    if (filterRegDate) {
      const targetDate = new Date(filterRegDate);
      targetDate.setHours(0, 0, 0, 0);
      const regDate = parseRegisteredDate(c.registeredDate);
      if (regDate) {
        regDate.setHours(0, 0, 0, 0);
        matchesRegDate = regDate.getTime() === targetDate.getTime();
      } else {
        matchesRegDate = false;
      }
    }

    const matchesCompanyName = filterCompanyName
      ? c.companyName.toLowerCase().includes(filterCompanyName.toLowerCase())
      : true;

    const matchesVisaType = filterVisaType
      ? c.visa.toLowerCase().includes(filterVisaType.toLowerCase())
      : true;

    const matchesBirthDate = filterBirthDate
      ? c.birthDate.replace(/-/g, '').includes(filterBirthDate.replace(/-/g, ''))
      : true;

    const matchesForeignerNumber = filterForeignerNumber
      ? c.birthDate && c.birthDate.replace(/-/g, '').includes(filterForeignerNumber.replace(/-/g, ''))
      : true;

    const matchesMonthlyRent = filterMonthlyRent
      ? c.monthlyRent === filterMonthlyRent
      : true;

    // 탭 필터링
    let matchesTab = true;
    if (selectedTab === 'inProgress') {
      const excludedStatuses = [
        '♥경정청구완료', 
        '♡국세수수료수납완료', 
        '◆지방세수수료수납완료', 
        '♠지방세수수료수납완료', 
        '자격안됨', 
        '◎자격안됨(확인완료)', 
        '고객취소', 
        '홈택스가입불가', 
        '▲경정청구기각'
      ];
      matchesTab = !excludedStatuses.includes(c.refundStatus);
    } else if (selectedTab === 'feeCompleted') {
      matchesTab = c.refundStatus === '♡국세수수료수납완료' || c.refundStatus === '◆지방세수수료수납완료' || c.refundStatus === '♠지방세수수료수납완료';
    } else if (selectedTab === 'nextYear') {
      matchesTab = c.isNextYearApply === true;
    }

    return matchesSearch &&
      matchesNationality &&
      matchesRefundStatus &&
      matchesManager &&
      matchesBeforeDate &&
      matchesRegDate &&
      matchesCompanyName &&
      matchesVisaType &&
      matchesBirthDate &&
      matchesForeignerNumber &&
      matchesMonthlyRent &&
      matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const displayedCustomers = filteredCustomers
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map(c => {
      const edit = tempInlineEdits[c.id];
      if (edit) {
        return {
          ...c,
          ...edit
        };
      }
      return c;
    });

  return (
    <>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} color={toast.type === 'error' ? '#ff4b4b' : '#2db74f'} />
          <span>{toast.message}</span>
        </div>
      )}

      {currentView === 'consent' && (
        <ConsentPage token={consentToken || ''} onBackToLogin={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView('customer');
        }} />
      )}

      {currentView === 'contract' && (
        <ContractPage token={consentToken || ''} onBackToLogin={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView('customer');
        }} />
      )}

      {isSessionChecking && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', flexDirection: 'column', gap: '16px', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          <span>보안 인증 세션을 확인하는 중입니다...</span>
        </div>
      )}

      {!isLoggedIn && !isSessionChecking && currentView !== 'consent' && currentView !== 'contract' && (
        <AuthView
          setIsLoggedIn={setIsLoggedIn}
          setCurrentManager={setCurrentManager}
          setRegForm={setRegForm}
          showToast={showToast}
          dbTeams={dbTeams}
        />
      )}

      {isLoggedIn && currentView !== 'consent' && currentView !== 'contract' && (
        <div className="app-container notranslate" translate="no">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <img src="/logo_n.png" alt="Novel Tax Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
              <div className="sidebar-logo-text">
                <span className="logo-title">노벨 세무회계 연구</span>
                <span className="logo-subtitle">TAX & ACCOUNTING</span>
              </div>
            </div>

            <nav className="sidebar-menu">
              <button
                className={`sidebar-item ${currentView === 'customer' || currentView === 'registration' ? 'active' : ''}`}
                onClick={() => setCurrentView('customer')}
              >
                <UserCheck size={18} />
                고객등록 관리
              </button>
              {currentManager?.email === 'admin@novel.com' && (
                <button
                  className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  <BarChart3 size={18} />
                  통계 및 실적 대시보드
                </button>
              )}
              <button
                className={`sidebar-item ${currentView === 'staff' ? 'active' : ''}`}
                onClick={() => setCurrentView('staff')}
              >
                <Users size={18} />
                직원 관리
              </button>



              <button
                className={`sidebar-item ${currentView === 'password' ? 'active' : ''}`}
                onClick={() => setCurrentView('password')}
              >
                <Lock size={18} />
                비밀번호 변경
              </button>
            </nav>

            <div className="sidebar-footer">
              <button className="sidebar-item" onClick={handleLogout}>
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="main-content">
            
            {/* 1. Customer List View */}
            {currentView === 'customer' && (
              <CustomerListView
                setCurrentView={setCurrentView}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isFilterModalOpen={isFilterModalOpen}
                setIsFilterModalOpen={setIsFilterModalOpen}
                selectedNationality={selectedNationality}
                setSelectedNationality={setSelectedNationality}
                selectedRefundStatus={selectedRefundStatus}
                setSelectedRefundStatus={setSelectedRefundStatus}
                selectedManager={selectedManager}
                setSelectedManager={setSelectedManager}
                filterVisaType={filterVisaType}
                setFilterVisaType={setFilterVisaType}
                filterCompanyName={filterCompanyName}
                setFilterCompanyName={setFilterCompanyName}
                filterBirthDate={filterBirthDate}
                setFilterBirthDate={setFilterBirthDate}
                filterForeignerNumber={filterForeignerNumber}
                setFilterForeignerNumber={setFilterForeignerNumber}
                filterRegDate={filterRegDate}
                setFilterRegDate={setFilterRegDate}
                filterBeforeDate={filterBeforeDate}
                setFilterBeforeDate={setFilterBeforeDate}
                filterMonthlyRent={filterMonthlyRent}
                setFilterMonthlyRent={setFilterMonthlyRent}
                isHometaxExcelSyncModalOpen={isHometaxExcelSyncModalOpen}
                setIsHometaxExcelSyncModalOpen={setIsHometaxExcelSyncModalOpen}
                isHometaxModalOpen={isHometaxModalOpen}
                setIsHometaxModalOpen={setIsHometaxModalOpen}
                filteredCustomers={filteredCustomers}
                displayedCustomers={displayedCustomers}
                totalPages={totalPages}
                availableTeamList={availableTeamList}
                availableManagerList={availableManagerList}
                nationalities={nationalities}
                refundStatuses={refundStatuses}
                selectedIds={selectedIds}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                countAll={tabCounts.all}
                countInProgress={tabCounts.inProgress}
                countFeeCompleted={tabCounts.feeCompleted}
                countNextYear={tabCounts.nextYear}
                handleResetFilters={handleResetFilters}
                handleResetAll={handleResetAll}
                handleDeleteCustomers={handleDeleteCustomers}
                handleExportExcel={handleExportExcel}
                handleDownloadHometaxFile={handleDownloadHometaxFile}
                handleOpenCustomerRegistration={handleOpenCustomerRegistration}
                handleSelectAll={handleSelectAll}
                handleSelectRow={handleSelectRow}
                handleInlineCountryChange={handleInlineCountryChange}
                handleInlineManagerChange={handleInlineManagerChange}
                handleSaveRow={handleSaveRow}
              />
            )}

            {/* 2. Complex New Registration & Detail Page */}
            {currentView === 'registration' && (
              <RegistrationView
                regForm={regForm}
                setRegForm={setRegForm}
                selectedFeeRate={selectedFeeRate}
                invoiceLanguage={invoiceLanguage}
                setInvoiceLanguage={setInvoiceLanguage}
                contractLanguage={contractLanguage}
                setContractLanguage={setContractLanguage}
                nationalities={nationalities}
                visaTypes={visaTypes}
                bankList={bankList}
                refundStatuses={refundStatuses}
                submissionStatuses={submissionStatuses}
                dbManagers={dbManagers}
                availableManagerList={availableManagerList}
                showToast={showToast}
                setCurrentView={setCurrentView}
                handleResetAll={handleResetAll}
                handleSaveRegistration={handleSaveRegistration}
                updateDependentsCount={updateDependentsCount}
                handleSingleYearPdfUpload={handleSingleYearPdfUpload}
                handleFreelancerSingleYearPdfUpload={handleFreelancerSingleYearPdfUpload}
                handleBulkPdfUpload={handleBulkPdfUpload}
                handleReanalyzeYearPdf={handleReanalyzeYearPdf}
                handleDownloadPdf={handleDownloadPdf}
                triggerExcelDownload={triggerExcelDownload}
                triggerConsolidatedExcelDownload={triggerConsolidatedExcelDownload}
                triggerKoreanInvoiceDownload={triggerKoreanInvoiceDownload}
                onChangeRentInfo={onChangeRentInfo}
                onChangeRentFile={onChangeRentFile}
                consultMemos={consultMemos}
                setConsultMemos={setConsultMemos}
                setCustomers={setCustomers}
                handleSaveConsultInfo={handleSaveConsultInfo}
                targetYears={targetYears}
                handleAddYear={handleAddYear}
                handleRemoveYear={handleRemoveYear}
                handleFeeRateChange={handleFeeRateChange}
                handleRemoveFreelancerYear={handleRemoveFreelancerYear}
                getCombinedRefund={getCombinedRefund}
                youthTaxReductionInfo={youthTaxReductionInfo}
              />
            )}

            {/* 2. Dashboard & Analytics View */}
            {currentView === 'dashboard' && (
              <DashboardView
                dashYearFilter={dashYearFilter}
                setDashYearFilter={setDashYearFilter}
                dashMonthFilter={dashMonthFilter}
                setDashMonthFilter={setDashMonthFilter}
                customers={customers}
                selectedFeeRate={selectedFeeRate}
                showToast={showToast}
              />
            )}

            {/* 3. Staff Management View (Matching Screenshot 100% with Team & Manager Supabase Integration) */}
            {currentView === 'staff' && (
              <StaffManagementView
                dbTeams={dbTeams}
                dbManagers={dbManagers}
                managerPage={managerPage}
                setManagerPage={setManagerPage}
                managerItemsPerPage={managerItemsPerPage}
                isAddManagerModalOpen={isAddManagerModalOpen}
                setIsAddManagerModalOpen={setIsAddManagerModalOpen}
                newManagerData={newManagerData}
                setNewManagerData={setNewManagerData}
                handleCreateTeam={handleCreateTeam}
                handleDeleteTeam={handleDeleteTeam}
                handleUpdateManagerTeam={handleUpdateManagerTeam}
                handleApproveManager={handleApproveManager}
                handleDeleteManager={handleDeleteManager}
                handleSaveNewManager={handleSaveNewManager}
                formatKoreanDateTime={formatKoreanDateTime}
              />
            )}



            {currentView === 'validator' && (
              <HometaxValidatorView />
            )}

            {currentView === 'password' && (
              <ChangePasswordView
                showToast={showToast}
                setCurrentView={setCurrentView}
              />
            )}

          </main>
        </div>
      )}

      {isHometaxExcelSyncModalOpen && (
        <HometaxExcelSyncModal 
          onClose={() => setIsHometaxExcelSyncModalOpen(false)} 
          showToast={showToast}
          onSyncCompleted={() => {
            window.location.reload();
          }}
        />
      )}

      {isHometaxModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }} onClick={() => setIsHometaxModalOpen(false)}>
          <div className="modal-content" style={{ width: '480px', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid #cbd5e1' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📁</span> 국세청 홈택스 전산매체 파일 생성
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }} onClick={() => setIsHometaxModalOpen(false)}><X size={20} /></button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
              A레코드에 포함될 자료제출자(세무대리인)의 정보를 입력해 주세요. 입력된 정보는 브라우저에 저장됩니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>제출자 구분</label>
                  <select 
                    className="form-control" 
                    style={{ width: '100%', height: '36px', fontSize: '13px' }}
                    value={hometaxSubmitter.submitterType}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, submitterType: e.target.value }))}
                  >
                    <option value="1">1: 세무대리인</option>
                    <option value="2">2: 법인</option>
                    <option value="3">3: 개인</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>귀속 연도</label>
                  <select 
                    className="form-control" 
                    style={{ width: '100%', height: '36px', fontSize: '13px' }}
                    value={hometaxSubmitter.targetYear}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, targetYear: e.target.value }))}
                  >
                    <option value="2025">2025년</option>
                    <option value="2024">2024년</option>
                    <option value="2023">2023년</option>
                    <option value="2022">2022년</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>관할 세무서 코드</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="예: 120 (종로)"
                    value={hometaxSubmitter.taxOfficeCode}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, taxOfficeCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>세무대리인 관리번호</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="세무대리인인 경우 필수"
                    disabled={hometaxSubmitter.submitterType !== '1'}
                    value={hometaxSubmitter.agentNum}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, agentNum: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>홈택스 ID</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="hometax_id"
                    value={hometaxSubmitter.hometaxId}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, hometaxId: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>사업자등록번호</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="10자리 숫자"
                    value={hometaxSubmitter.bizNum}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, bizNum: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>법인명 (상호)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  placeholder="예: 노벨세무법인"
                  value={hometaxSubmitter.companyName}
                  onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>담당자 부서</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    value={hometaxSubmitter.deptName}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, deptName: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>담당자 성명</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '36px', fontSize: '13px' }}
                    value={hometaxSubmitter.managerName}
                    onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, managerName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>담당자 전화번호</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  placeholder="예: 02-123-4567"
                  value={hometaxSubmitter.managerPhone}
                  onChange={(e) => setHometaxSubmitter((prev: any) => ({ ...prev, managerPhone: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setIsHometaxModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => handleGenerateHometaxFile('wage')}
              >
                근로소득 파일 다운로드
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => handleGenerateHometaxFile('freelancer')}
              >
                사업소득(3.3%) 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
