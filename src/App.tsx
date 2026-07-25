import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Lock,
  LogOut,
  Trash2,
  X,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { extractTextFromPdf, parsePdfText } from './utils/pdfParser';
import { generateHometaxFile } from './utils/hometaxGenerator';
import { ConsentPage } from './components/ConsentPage';
import { HometaxExcelSyncModal } from './components/modals/HometaxExcelSyncModal';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { WageSettlementTable } from './components/WageSettlementTable';
import { FreelancerSettlementTable } from './components/FreelancerSettlementTable';
import { CombinedSummaryTable } from './components/CombinedSummaryTable';
import { SmeVerification } from './components/SmeVerification';
import { DashboardView } from './components/views/DashboardView';
import { ChangePasswordView } from './components/views/ChangePasswordView';
import { StaffManagementView } from './components/views/StaffManagementView';
import { CustomerListView } from './components/views/CustomerListView';
import { CustomerBasicInfoForm } from './components/views/CustomerBasicInfoForm';
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

// Helper to determine youth tax reduction eligibility based on RRN and Employment Date
export const checkYouthEligibility = (rrnStr: string, empDateStr: string, yearsObj?: any) => {
  const rrn = rrnStr ? rrnStr.replace(/-/g, '').trim() : '';
  let employmentDateStr = empDateStr ? empDateStr.trim() : '';

  if (!employmentDateStr && yearsObj) {
    const periods = Object.values(yearsObj || {})
      .map((y: any) => y.workPeriod)
      .filter((wp: string) => wp && wp.includes('~'))
      .map((wp: string) => wp.split('~')[0].trim())
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    if (periods.length > 0) {
      employmentDateStr = periods[0];
    }
  }

  if (!employmentDateStr) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    employmentDateStr = `${yyyy}-${mm}-${dd}`;
  }

  if (!rrn || rrn.length < 7) {
    return { isEligible: true, age: null }; // Default to true if RRN is not fully entered
  }

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

  const empParts = employmentDateStr.split('-');
  if (empParts.length !== 3) {
    return { isEligible: true, age: null };
  }
  const empYear = parseInt(empParts[0], 10);
  const empMonth = parseInt(empParts[1], 10);
  const empDay = parseInt(empParts[2], 10);

  let age = empYear - birthYear;
  if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
    age--;
  }

  const isEligible = age >= 15 && age <= 34;
  return { isEligible, age };
};

function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [loginPw, setLoginPw] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordChangeText, setPasswordChangeText] = useState({ current: '', new: '', confirm: '' });
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [currentManager, setCurrentManager] = useState<any>(null);

  // Sign Up State
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>('');
  const [signUpTeamId, setSignUpTeamId] = useState<number>(1);

  // Navigation State: customer = List View, registration = Register/Detail View, dashboard = Analytics Dashboard, staff = Staff View, password = Password View, consent = Client Consent View
  const [currentView, setCurrentView] = useState<'customer' | 'registration' | 'dashboard' | 'staff' | 'password' | 'consent'>('customer');
  const [isHometaxExcelSyncModalOpen, setIsHometaxExcelSyncModalOpen] = useState<boolean>(false);
  const [consentToken, setConsentToken] = useState<string | null>(null);
  const [tempInlineEdits, setTempInlineEdits] = useState<Record<number, { nationality?: string; managerName?: string; managerCountry?: string }>>({});

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

  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [tempModalTeam, setTempModalTeam] = useState<string>('');
  const [tempModalManager, setTempModalManager] = useState<string>('');

  const handleApplyManagerChange = () => {
    setRegForm(prev => ({
      ...prev,
      nationality: tempModalTeam,
      managerName: tempModalManager
    }));
    setIsManagerModalOpen(false);
    showToast(`담당 정보가 ${tempModalTeam}팀 ${tempModalManager} 매니저로 변경되었습니다.`, 'success');
  };

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

  const handleDownloadHometaxFile = async () => {
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
        
        cYearRecords.forEach(y => {
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
            refundExpectLocal: y.localTaxRefund || 0
          };
        });

        return {
          id: c.serial,
          consentStatus: c.consentStatus || '대기',
          name: c.name || '',
          regNum: c.regNum || '',
          foreignerNumber: c.regNum || '',
          nationality: c.country || '',
          years: yearsMap
        };
      }).filter(c => {
        const yrData = c.years?.[yr];
        // Only include clients with salary data AND who are '수임완료'
        const hasSalary = yrData && (yrData.salaryTotal || yrData.totalSalary);
        const isConsentApproved = c.consentStatus === '수임완료';
        return hasSalary && isConsentApproved;
      });

      if (clientsWithData.length === 0) {
        showToast(`${yr}년도 근로정산 소득 데이터가 있고 수임동의가 완료된 고객이 없습니다.`, 'error');
        return;
      }

      const blob = generateHometaxFile(hometaxSubmitter, clientsWithData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `근로소득지급명세서_${yr}_제출용.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`${clientsWithData.length}명의 전산매체 파일 다운로드가 완료되었습니다.`, 'success');
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

    showToast('팀을 생성하는 중입니다...', 'info');
    const res = await createTeamInSupabase(teamName.trim());
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
              signatureImageUrl: c.signatureImageUrl || ''
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
              signatureImageUrl: c.signatureImageUrl || ''
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
  const [smeModalOpen, setSmeModalOpen] = useState(false);

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
    familyDocUrl: '',
    remittanceDocUrl: '',
    familyDocFile: null as File | null,
    remittanceDocFile: null as File | null,

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
  useEffect(() => {
    if (regForm.nationality === '베트남') setInvoiceLanguage('베트남어');
    else if (regForm.nationality === '인도네시아') setInvoiceLanguage('인도네시아어');
    else if (regForm.nationality === '몽골') setInvoiceLanguage('몽골어');
    else if (regForm.nationality === '미얀마') setInvoiceLanguage('미얀마어');
    else if (regForm.nationality === '캄보디아') setInvoiceLanguage('캄보디아어');
    else if (regForm.nationality === '네팔') setInvoiceLanguage('네팔어');
    else setInvoiceLanguage('한국어');
  }, [regForm.nationality]);

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

  // Automatically recalculate yearly tax data when foreigner number, employment date, or fee rate changes
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
            prev.residentAddress
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
  }, [regForm.foreignerNumber, regForm.residentAddress, selectedFeeRate]);

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
      familyDocUrl: '',
      remittanceDocUrl: '',
      familyDocFile: null,
      remittanceDocFile: null,
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

  const recalculateYearData = (
    yrData: any, 
    depCount: number, 
    senCount: number, 
    disCount: number, 
    chCount: number, 
    feeRate: number,
    rrn?: string,
    empDate?: string
  ) => {
    if (!yrData || (!yrData.active && !yrData.isFileUploaded)) return yrData;

    const rrnVal = rrn !== undefined ? rrn : regForm.foreignerNumber;
    const empDateVal = empDate !== undefined ? empDate : regForm.residentAddress;
    const eligibility = checkYouthEligibility(rrnVal, empDateVal);

    const originalDecisionTax = Number(yrData.decisionTax) || 0;
    const originalLocalTax = Number(yrData.localTax) || 0;
    const calculatedTax = Number(yrData.taxBase) || 0;
    const childDeduction = Number(yrData.childDeduction) || 0;

    const isReductionApplied = eligibility.isEligible && yrData.childReductionApply !== 'N' && yrData.childReductionApply !== '0';
    const reductionAmt = isReductionApplied ? Math.min(1500000, Math.round(calculatedTax * 0.9)) : 0;
    
    // 부양가족 소득공제 (인당 150만, 경로우대 +100만, 장애인 +200만)
    const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
    // 소득공제에 따른 세액 절감액 (기본 6% 적용)
    const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);

    // 자녀 세액공제 (인당 15만 원)
    const extraChildTaxCredit = chCount * 150000;

    const remainingTaxAfterReduction = Math.max(0, calculatedTax - reductionAmt - extraTaxReductionFromDeduction);
    const changedChildDeduction = calculatedTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / calculatedTax)) : 0;

    const changedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);
    const changedLocalTax = Math.round(changedDecisionTax * 0.1);

    const refundNational = Math.max(0, originalDecisionTax - changedDecisionTax);
    const refundLocal = Math.max(0, originalLocalTax - changedLocalTax);
    const totalCourtFee = refundNational + refundLocal;
    const expectedFee = Math.round(totalCourtFee * (feeRate / 100));

    // Calculate extra refund generated purely by dependent family deductions
    const remainingWithoutDeps = Math.max(0, calculatedTax - reductionAmt);
    const childDeductionWithoutDeps = calculatedTax > 0 ? Math.round(childDeduction * (remainingWithoutDeps / calculatedTax)) : 0;
    const decisionTaxWithoutDeps = Math.max(0, remainingWithoutDeps - childDeductionWithoutDeps);
    const refundNationalWithoutDeps = Math.max(0, originalDecisionTax - decisionTaxWithoutDeps);
    const refundLocalWithoutDeps = Math.max(0, originalLocalTax - Math.round(decisionTaxWithoutDeps * 0.1));
    const totalRefundWithoutDeps = refundNationalWithoutDeps + refundLocalWithoutDeps;

    const dependentRefundTotal = Math.max(0, totalCourtFee - totalRefundWithoutDeps);

    return {
      ...yrData,
      childReductionApplyAmt: String(reductionAmt),
      childDeductionApplyAmt: String(changedChildDeduction + extraChildTaxCredit),
      decisionTaxApplyAmt: String(changedDecisionTax),
      localTaxApplyAmt: String(changedLocalTax),
      decisionTaxRefundAmt: String(changedDecisionTax + changedLocalTax),
      refundExpectNational: String(refundNational),
      refundExpectLocal: String(refundLocal),
      courtFee: String(totalCourtFee),
      expectedFeeAmt: String(expectedFee),
      dependentRefundTotal: String(dependentRefundTotal)
    };
  };

  const updateDependentsCount = (key: 'dependentsCount' | 'seniorCount' | 'disabledCount' | 'childCount', delta: number) => {
    setRegForm(prev => {
      const newDepCount = key === 'dependentsCount' ? Math.max(0, prev.dependentsCount + delta) : prev.dependentsCount;
      const newSenCount = key === 'seniorCount' ? Math.max(0, prev.seniorCount + delta) : prev.seniorCount;
      const newDisCount = key === 'disabledCount' ? Math.max(0, prev.disabledCount + delta) : prev.disabledCount;
      const newChCount = key === 'childCount' ? Math.max(0, prev.childCount + delta) : prev.childCount;

      const updatedYears = (prev.years || []).map(yrData => {
        return recalculateYearData(yrData, newDepCount, newSenCount, newDisCount, newChCount, selectedFeeRate);
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
        return recalculateYearData(yrData, prev.dependentsCount, prev.seniorCount, prev.disabledCount, prev.childCount, rate);
      });
      return { ...prev, years: updatedYears };
    });
  };

  const getCombinedRefund = (yr: string) => {
    const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
    const freeData = regForm.freelancerYears?.[yr];

    const hasWage = matchingWageDataList.length > 0;
    const hasFree = freeData?.active;

    if (!hasWage && !hasFree) return { refund: 0, fee: 0 };
    
    // Case 1: Only wage active
    if (hasWage && !hasFree) {
      let refund = 0;
      let fee = 0;
      matchingWageDataList.forEach((yrData: any) => {
        refund += (Number(yrData.refundExpectNational) || 0) + (Number(yrData.refundExpectLocal) || 0);
        fee += Number(yrData.expectedFeeAmt) || 0;
      });
      return { refund, fee };
    }

    // Case 2: Only freelancer active
    if (!hasWage && hasFree) {
      const refund = (Number(freeData.refundExpectNational) || 0) + (Number(freeData.refundExpectLocal) || 0);
      const fee = Number(freeData.expectedFeeAmt) || 0;
      return { refund, fee };
    }

    // Case 3: Both active -> Combined tax calculation
    let wageCalcTax = 0;
    let wagePaidTax = 0;
    let wagePaidLocalTax = 0;
    let childDeduction = 0;
    let childReductionApply = 'Y';
    
    matchingWageDataList.forEach((yrData: any) => {
      wageCalcTax += Number(yrData.taxBase) || 0;
      wagePaidTax += Number(yrData.decisionTax) || 0;
      wagePaidLocalTax += Number(yrData.localTax) || 0;
      childDeduction += Number(yrData.childDeduction) || 0;
      if (yrData.childReductionApply === 'N' || yrData.childReductionApply === '0') {
        childReductionApply = 'N';
      }
    });

    const freeIncome = Number(freeData.totalIncome) || 0;
    
    const deriveTaxableIncome = (calcTax: number): number => {
      if (calcTax <= 840000) return calcTax / 0.06;
      if (calcTax <= 6240000) return (calcTax + 1260000) / 0.15;
      return (calcTax + 5760000) / 0.24;
    };
    const wageTaxable = deriveTaxableIncome(wageCalcTax);
    const freeTaxable = freeIncome * 0.359;
    const combinedTaxable = wageTaxable + freeTaxable;
    
    let combinedCalcTax = 0;
    if (combinedTaxable <= 14000000) {
      combinedCalcTax = combinedTaxable * 0.06;
    } else if (combinedTaxable <= 50000000) {
      combinedCalcTax = combinedTaxable * 0.15 - 1260000;
    } else {
      combinedCalcTax = combinedTaxable * 0.24 - 5760000;
    }
    combinedCalcTax = Math.max(0, Math.round(combinedCalcTax));

    const isReductionApplied = childReductionApply !== 'N' && childReductionApply !== '0';
    const reductionAmt = isReductionApplied ? Math.min(1500000, Math.round(combinedCalcTax * 0.9)) : 0;

    const depCount = Number(regForm.dependentsCount) || 0;
    const senCount = Number(regForm.seniorCount) || 0;
    const disCount = Number(regForm.disabledCount) || 0;
    const chCount = Number(regForm.childCount) || 0;

    const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
    const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);
    const extraChildTaxCredit = chCount * 150000;

    const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt - extraTaxReductionFromDeduction);
    
    const changedChildDeduction = combinedCalcTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

    const combinedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);
    const combinedLocalTax = Math.round(combinedDecisionTax * 0.1);

    const freePaidTax = Number(freeData.withholdingTax3) || 0;
    const freePaidLocalTax = Number(freeData.localTax03) || 0;

    const refundNational = Math.max(0, (wagePaidTax + freePaidTax) - combinedDecisionTax);
    const refundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - combinedLocalTax);
    
    const totalRefund = refundNational + refundLocal;
    const expectedFee = Math.round(totalRefund * (selectedFeeRate / 100));

    return { refund: totalRefund, fee: expectedFee };
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



  const handleDownloadPdf = async (targetId: string, yrLabel: string) => {
    const yearData = (regForm.years || []).find((y: any) => y.id === targetId);
    const yr = yearData?.year || '';

    // 1. Memory uploaded file
    if (yearData?.pdfFile) {
      const url = URL.createObjectURL(yearData.pdfFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = yearData.pdfFile.name || `${yrLabel}_원천징수영수증.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`[${yrLabel}] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
      return;
    }

    // 1-2. Supabase Storage uploaded file URL
    if ((yearData as any)?.fileURL) {
      window.open((yearData as any).fileURL, '_blank');
      showToast(`[${yrLabel}] Supabase 스토리지 원본 PDF 파일을 엽니다.`, 'success');
      return;
    }

    // 2. Try fetching from public/${yr}.pdf
    try {
      const pdfUrl = `/${yr}.pdf`;
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${yrLabel}_원천징수영수증.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`[${yrLabel}] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
        return;
      }
    } catch (e) {
      console.warn('PDF fetch error:', e);
    }

    // 3. Fallback text file
    const textContent = `[노벨세무회계 연구] ${yrLabel} 근로소득 원천징수영수증 정산 데이터\n\n` +
      `신청인: ${regForm.name || '-'}\n` +
      `외국인등록번호: ${regForm.foreignerNumber || '-'}\n` +
      `근무처: ${yearData?.workPlace || '-'}\n` +
      `근무기간: ${yearData?.workPeriod || '-'}\n` +
      `총급여액: ${Number(yearData?.salaryTotal || 0).toLocaleString()}원\n` +
      `산출세액: ${Number(yearData?.taxBase || 0).toLocaleString()}원\n` +
      `기존 결정세액(소득세): ${Number(yearData?.decisionTax || 0).toLocaleString()}원\n` +
      `기존 결정세액(지방세): ${Number(yearData?.localTax || 0).toLocaleString()}원\n` +
      `청년세액감면 적용액: ${Number(yearData?.childReductionApplyAmt || 0).toLocaleString()}원\n` +
      `예상 환급금 합계: ${Number(yearData?.courtFee || 0).toLocaleString()}원\n`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${yrLabel}_원천징수영수증_정산서.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`[${yrLabel}] 정산서 다운로드를 완료했습니다.`, 'success');
  };

  const handleSingleYearPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`PDF 분석을 시작합니다 (${file.name})...`, 'info');
      const text = await extractTextFromPdf(file);
      const parsed = parsePdfText(text);

      const yr = parsed.year;
      if (!yr || !/^\d{4}$/.test(yr)) {
        showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
        return;
      }

      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

      setRegForm(prev => {
        const updatedYears = [...(prev.years || [])];
        
        let targetIndex = -1;
        if (targetId) {
          targetIndex = updatedYears.findIndex(y => y.id === targetId);
        }
        
        // If not found by ID, try to find an inactive column for the parsed year to occupy
        if (targetIndex === -1) {
          targetIndex = updatedYears.findIndex(y => y.year === yr && !y.active && !y.isFileUploaded);
        }

        const rawYrData = {
          id: targetIndex !== -1 ? updatedYears[targetIndex].id : ('temp_' + Date.now()),
          active: true,
          isFileUploaded: true,
          pdfFile: file,
          year: yr,
          workPeriod: parsed.workPeriod || (targetIndex !== -1 ? updatedYears[targetIndex].workPeriod : '') || '',
          workPlace: parsed.workPlace || (targetIndex !== -1 ? updatedYears[targetIndex].workPlace : '') || '',
          businessNumber: parsed.businessNumber || (targetIndex !== -1 ? updatedYears[targetIndex].businessNumber : '') || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : (targetIndex !== -1 ? updatedYears[targetIndex].birthDate : '') || '',
          salaryTotal: parsed.salaryTotal || '0',
          taxBase: parsed.decisionTax || parsed.taxBase || '0',
          childReduction: parsed.childReduction || '0',
          childDeduction: parsed.childDeduction || '0',
          decisionTax: parsed.determinedIncomeTax || '0',
          localTax: parsed.determinedLocalTax || '0',
          taxRefundTotal: String(originalDecisionTax + originalLocalTax),
          childReductionApply: 'Y',
        };

        const updatedBasic: any = {};
        if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber && !prev.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

        if (parsed.workPeriod) {
          const start = parsed.workPeriod.split('~')[0].trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
            const currentAddress = prev.residentAddress || updatedBasic.residentAddress;
            if (!currentAddress) {
              updatedBasic.residentAddress = start;
            } else if (start < currentAddress) {
              updatedBasic.residentAddress = start;
            }
          }
        }

        const newRrn = updatedBasic.foreignerNumber || prev.foreignerNumber;
        const newEmpDate = updatedBasic.residentAddress || prev.residentAddress;

        const recalculated = recalculateYearData(
          rawYrData, 
          prev.dependentsCount, 
          prev.seniorCount, 
          prev.disabledCount, 
          prev.childCount, 
          selectedFeeRate,
          newRrn,
          newEmpDate
        );

        if (targetIndex !== -1) {
          updatedYears[targetIndex] = recalculated;
        } else {
          updatedYears.push(recalculated);
        }

        updatedYears.sort((a, b) => {
          const yrA = Number(a.year) || 0;
          const yrB = Number(b.year) || 0;
          if (yrA !== yrB) return yrA - yrB;
          const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
          const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
          return dateA.localeCompare(dateB);
        });

        return {
          ...prev,
          ...updatedBasic,
          years: updatedYears
        };
      });

      showToast(`PDF 자동 분석 완료! [${yr}년도] 칸에 데이터가 자동으로 반영되었습니다.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`PDF 분석 중 오류가 발생했습니다: ${err.message || err}`, 'error');
    }
  };

  const handleFreelancerSingleYearPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`프리랜서 지급명세서 PDF 분석을 시작합니다 (${file.name})...`, 'info');
      const text = await extractTextFromPdf(file);
      const parsed = parsePdfText(text, fallbackYr);

      const yr = parsed.year || fallbackYr;
      if (!yr || !/^\d{4}$/.test(yr)) {
        showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
        return;
      }

      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (!isBusiness && !isOther) {
        showToast(`프리랜서(사업소득/기타소득) 지급명세서 양식이 아닙니다. 근로소득 정산 테이블을 확인해주세요.`, 'info');
        return;
      }

      setRegForm((prev: any) => {
        const updatedYears = { ...prev.freelancerYears };
        
        const income = Number(parsed.salaryTotal) || 0;
        const code = parsed.incomeTypeCode || '3.3%';
        const isNonRefund = parsed.isNonRefundable || false;
        
        const taxRate = code === '3.3%' ? 0.03 : 0.20;
        const tax3 = Math.round(income * taxRate);
        const tax03 = Math.round(tax3 * 0.1);
        
        const refundNat = isNonRefund ? 0 : (Number(parsed.determinedIncomeTax) || tax3);
        const refundLoc = isNonRefund ? 0 : (Number(parsed.determinedLocalTax) || tax03);
        const courtFee = refundNat + refundLoc;
        const feeAmt = Math.round(courtFee * (selectedFeeRate / 100));

        const updatedBasic: any = {};
        if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber && !prev.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

        updatedYears[yr] = {
          active: true,
          isFileUploaded: true,
          pdfFile: file,
          workPlace: parsed.workPlace || updatedYears[yr]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[yr]?.businessNumber || '',
          totalIncome: String(income),
          withholdingTax3: String(parsed.determinedIncomeTax || tax3),
          localTax03: String(parsed.determinedLocalTax || tax03),
          totalWithholding33: String(Number(parsed.determinedIncomeTax || tax3) + Number(parsed.determinedLocalTax || tax03)),
          refundExpectNational: String(refundNat),
          refundExpectLocal: String(refundLoc),
          courtFee: String(courtFee),
          expectedFeeAmt: String(feeAmt),
          incomeTypeCode: code,
          isNonRefundable: isNonRefund
        };

        return {
          ...prev,
          ...updatedBasic,
          freelancerYears: updatedYears
        };
      });

      showToast(`PDF 자동 분석 완료! 프리랜서 [${yr}년도] 칸에 데이터가 자동으로 반영되었습니다.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`PDF 분석 중 오류가 발생했습니다: ${err.message || err}`, 'error');
    }
  };

  const handleReanalyzeYearPdf = async (targetId: string, yrLabel: string) => {
    const targetIndex = (regForm.years || []).findIndex((y: any) => y.id === targetId);
    if (targetIndex === -1) return;
    const yrData = regForm.years[targetIndex];
    const yr = yrData.year;

    try {
      showToast(`[${yrLabel}] 원본 PDF 파일 다시 읽기 및 세액 재계산을 진행합니다...`, 'info');
      let text = '';
      let fileObj: File | null = yrData.pdfFile || null;

      if (fileObj) {
        text = await extractTextFromPdf(fileObj);
      } else if (yrData.fileURL || yrData.pdfUrl) {
        const targetUrl = yrData.fileURL || yrData.pdfUrl;
        const resp = await fetch(targetUrl);
        if (!resp.ok) throw new Error('PDF 파일 다운로드에 실패했습니다.');
        const blob = await resp.blob();
        fileObj = new File([blob], `${yr}.pdf`, { type: 'application/pdf' });
        text = await extractTextFromPdf(fileObj);
      } else {
        showToast(`[${yrLabel}] 재분석할 PDF 파일이 존재하지 않습니다.`, 'error');
        return;
      }

      const parsed = parsePdfText(text, yr);
      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

      setRegForm(prev => {
        const updatedYears = [...(prev.years || [])];
        const idx = updatedYears.findIndex((y: any) => y.id === targetId);
        if (idx === -1) return prev;

        const rawYrData = {
          id: targetId,
          active: true,
          isFileUploaded: true,
          pdfFile: fileObj,
          fileURL: yrData.fileURL || yrData.pdfUrl || '',
          pdfUrl: yrData.fileURL || yrData.pdfUrl || '',
          workPeriod: parsed.workPeriod || updatedYears[idx]?.workPeriod || '',
          workPlace: parsed.workPlace || updatedYears[idx]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[idx]?.businessNumber || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : updatedYears[idx]?.birthDate || '',
          salaryTotal: parsed.salaryTotal || updatedYears[idx]?.salaryTotal || '0',
          taxBase: parsed.decisionTax || parsed.taxBase || updatedYears[idx]?.taxBase || '0',
          childReduction: parsed.childReduction || '0',
          childDeduction: parsed.childDeduction || '0',
          decisionTax: parsed.determinedIncomeTax || '0',
          localTax: parsed.determinedLocalTax || '0',
          taxRefundTotal: String(originalDecisionTax + originalLocalTax),
          childReductionApply: 'Y',
        };

        updatedYears[idx] = recalculateYearData(
          rawYrData,
          prev.dependentsCount,
          prev.seniorCount,
          prev.disabledCount,
          prev.childCount,
          selectedFeeRate
        );

        return {
          ...prev,
          years: updatedYears
        };
      });

      showToast(`[${yrLabel}] PDF 원본 재분석 완료! 세액 및 환급금이 최신 로직으로 자동 교정되었습니다.`, 'success');
    } catch (err: any) {
      console.error('Reanalyze PDF Error:', err);
      showToast(`PDF 재분석 실패: ${err.message || err}`, 'error');
    }
  };

  const handleBulkPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast(`${files.length}개 PDF 파일 자동 분석을 시작합니다...`, 'info');
    let successCount = 0;
    const detectedYears: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromPdf(file);
        const parsed = parsePdfText(text);
        const yr = parsed.year;

        if (!yr || !/^\d{4}$/.test(yr)) {
          showToast(`파일 [${file.name}]에서 귀속연도를 감지하지 못했습니다.`, 'error');
          continue;
        }

        if (!detectedYears.includes(yr)) detectedYears.push(yr);
        successCount++;

        setTargetYears(prev => {
          if (!prev.includes(yr)) {
            return [...prev, yr].sort((a, b) => Number(a) - Number(b));
          }
          return prev;
        });

        const isBusiness = text.includes('사업소득');
        const isOther = text.includes('기타소득');

        if (isBusiness || isOther) {
          setRegForm((prev: any) => {
            const updatedYears = { ...prev.freelancerYears };
            
            const income = Number(parsed.salaryTotal) || 0;
            const code = parsed.incomeTypeCode || '3.3%';
            const isNonRefund = parsed.isNonRefundable || false;
            
            const taxRate = code === '3.3%' ? 0.03 : 0.20;
            const tax3 = Math.round(income * taxRate);
            const tax03 = Math.round(tax3 * 0.1);
            
            const refundNat = isNonRefund ? 0 : (Number(parsed.determinedIncomeTax) || tax3);
            const refundLoc = isNonRefund ? 0 : (Number(parsed.determinedLocalTax) || tax03);
            const courtFee = refundNat + refundLoc;
            const feeAmt = Math.round(courtFee * (selectedFeeRate / 100));

            const updatedBasic: any = {};
            if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber && !prev.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

            updatedYears[yr] = {
              active: true,
              isFileUploaded: true,
              pdfFile: file,
              workPlace: parsed.workPlace || '',
              businessNumber: parsed.businessNumber || '',
              totalIncome: String(income),
              withholdingTax3: String(parsed.determinedIncomeTax || tax3),
              localTax03: String(parsed.determinedLocalTax || tax03),
              totalWithholding33: String(Number(parsed.determinedIncomeTax || tax3) + Number(parsed.determinedLocalTax || tax03)),
              refundExpectNational: String(refundNat),
              refundExpectLocal: String(refundLoc),
              courtFee: String(courtFee),
              expectedFeeAmt: String(feeAmt),
              incomeTypeCode: code,
              isNonRefundable: isNonRefund
            };

            return {
              ...prev,
              ...updatedBasic,
              freelancerYears: updatedYears
            };
          });
        } else {
          const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
          const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

          setRegForm((prev: any) => {
            const updatedYears = [...(prev.years || [])];
            
            // Find if there is an inactive column for this year to occupy
            let targetIndex = updatedYears.findIndex(y => y.year === yr && !y.active && !y.isFileUploaded);

            const rawYrData = {
              id: targetIndex !== -1 ? updatedYears[targetIndex].id : ('temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5)),
              active: true,
              isFileUploaded: true,
              pdfFile: file,
              year: yr,
              workPeriod: parsed.workPeriod || (targetIndex !== -1 ? updatedYears[targetIndex].workPeriod : '') || '',
              workPlace: parsed.workPlace || (targetIndex !== -1 ? updatedYears[targetIndex].workPlace : '') || '',
              businessNumber: parsed.businessNumber || (targetIndex !== -1 ? updatedYears[targetIndex].businessNumber : '') || '',
              birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : (targetIndex !== -1 ? updatedYears[targetIndex].birthDate : '') || '',
              salaryTotal: parsed.salaryTotal || '0',
              taxBase: parsed.decisionTax || parsed.taxBase || '0',
              childReduction: parsed.childReduction || '0',
              childDeduction: parsed.childDeduction || '0',
              decisionTax: parsed.determinedIncomeTax || '0',
              localTax: parsed.determinedLocalTax || '0',
              taxRefundTotal: String(originalDecisionTax + originalLocalTax),
              childReductionApply: 'Y',
            };

            const updatedBasic: any = {};
            if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber && !prev.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

            if (parsed.workPeriod) {
              const start = parsed.workPeriod.split('~')[0].trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
                const currentAddress = prev.residentAddress || updatedBasic.residentAddress;
                if (!currentAddress) {
                  updatedBasic.residentAddress = start;
                } else if (start < currentAddress) {
                  updatedBasic.residentAddress = start;
                }
              }
            }

            const newRrn = updatedBasic.foreignerNumber || prev.foreignerNumber;
            const newEmpDate = updatedBasic.residentAddress || prev.residentAddress;

            const recalculated = recalculateYearData(
              rawYrData, 
              prev.dependentsCount, 
              prev.seniorCount, 
              prev.disabledCount, 
              prev.childCount, 
              selectedFeeRate,
              newRrn,
              newEmpDate
            );

            if (targetIndex !== -1) {
              updatedYears[targetIndex] = recalculated;
            } else {
              updatedYears.push(recalculated);
            }

            updatedYears.sort((a, b) => {
              const yrA = Number(a.year) || 0;
              const yrB = Number(b.year) || 0;
              if (yrA !== yrB) return yrA - yrB;
              const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
              const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
              return dateA.localeCompare(dateB);
            });

            return {
              ...prev,
              ...updatedBasic,
              years: updatedYears
            };
          });
        }
      } catch (err: any) {
        console.error(err);
        showToast(`파일 [${file.name}] 분석 중 오류가 발생했습니다.`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`총 ${successCount}개 PDF 파일 분석 완료! (${detectedYears.join(', ')}년도 자동 분류되어 입력됨)`, 'success');
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
      showToast(`${customer.name} 님의 상세 정보를 불러오는 중입니다...`, 'info');

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

        loadedYearsList.push({
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
          correctionFileUrl: yr.correction_file || yr.correction_file_url || ''
        });
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
        dependentsCount: Number(clientDetails?.dependentsCount) || 0,
        seniorCount: Number(clientDetails?.seniorCount) || 0,
        disabledCount: Number(clientDetails?.disabledCount) || 0,
        childCount: Number(clientDetails?.childCount) || 0,
        familyDocUrl: clientDetails?.familyDocUrl || '',
        remittanceDocUrl: clientDetails?.remittanceDocUrl || '',
        familyDocFile: null,
        remittanceDocFile: null,
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
        years: yearsObj
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
    if (!regForm.name || !regForm.foreignerNumber) {
      showToast('신청인 이름과 외국인 등록번호는 필수입니다.', 'error');
      return;
    }

    const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 24708;
    const today = new Date();
    const formattedDate = `${String(today.getFullYear()).slice(-2)}. ${today.getMonth() + 1}. ${today.getDate()}.`;

    // Gather uploaded PDF file objects dynamically mapping by each yrData's id
    const pdfFiles: Record<string, File | null> = {
      'familyDoc': regForm.familyDocFile || null,
      'remittanceDoc': regForm.remittanceDocFile || null
    };
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
          additionalPerformance: Number(regForm.additionalApplyPerformance) || 0,
          managerCountry: regForm.nationality,
          managerName: regForm.managerName || managers.find(m => m.country === regForm.nationality)?.name || managers[0].name
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
            deletedYearIds: []
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

    setCurrentView('customer'); // Return to list view
  };

  const handleDownloadSmeSpecification = () => {
    if (!regForm.name) {
      showToast('고객을 먼저 로드하거나 등록해 주세요.', 'error');
      return;
    }
    setSmeModalOpen(true);
  };

  const triggerExcelDownload = async () => {
    showToast('엑셀 파일을 작성하고 있습니다. 잠시만 기다려 주세요...', 'info');
    try {
      // 1. Calculate Age at Employment (만 나이)
      const rrn = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
      let birthYear = 0;
      let birthMonth = 0;
      let birthDay = 0;
      if (rrn.length >= 7) {
        const yy = Number(rrn.substring(0, 2));
        const mm = Number(rrn.substring(2, 4));
        const dd = Number(rrn.substring(4, 6));
        const genderChar = rrn.charAt(6);
        
        if (['1', '2', '5', '6'].includes(genderChar)) {
          birthYear = 1900 + yy;
        } else if (['3', '4', '7', '8'].includes(genderChar)) {
          birthYear = 2000 + yy;
        } else {
          birthYear = (yy > 30) ? 1900 + yy : 2000 + yy;
        }
        birthMonth = mm;
        birthDay = dd;
      }

      let ageAtEmployment = '';
      if (birthYear > 0 && regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empYear = Number(empParts[0]);
          const empMonth = Number(empParts[1]);
          const empDay = Number(empParts[2]);
          
          let age = empYear - birthYear;
          if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
            age--;
          }
          ageAtEmployment = String(age);
        }
      }

      // 2. Resolve Reduction Start & End Date
      let reductionStart = regForm.taxReductionApplyDateStart || '';
      let reductionEnd = regForm.taxReductionApplyDateEnd || '';
      if (!reductionStart && regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empDateObj = new Date(Number(empParts[0]), Number(empParts[1]) - 1, Number(empParts[2]));
          const nextMonth = new Date(empDateObj.getFullYear(), empDateObj.getMonth() + 1, 1);
          
          const y = nextMonth.getFullYear();
          const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
          const d = '01';
          reductionStart = `${y}-${m}-${d}`;
          
          const endMonth = new Date(y + 5, nextMonth.getMonth(), 0);
          const ey = endMonth.getFullYear();
          const em = String(endMonth.getMonth() + 1).padStart(2, '0');
          const ed = String(endMonth.getDate()).padStart(2, '0');
          reductionEnd = `${ey}-${em}-${ed}`;
        }
      }

      // 3. Resolve Company Details (Last/Recent Active Employer)
      let companyName = '';
      let businessNumber = '';
      for (let i = (regForm.years || []).length - 1; i >= 0; i--) {
        const yrData = regForm.years[i];
        if (yrData?.active && yrData.workPlace) {
          companyName = yrData.workPlace;
          businessNumber = yrData.businessNumber || yrData.companyRegNum || '';
          break;
        }
      }
      if (!companyName && (regForm.years || []).length > 0) {
        const lastItem = regForm.years[regForm.years.length - 1];
        companyName = lastItem.workPlace || '';
        businessNumber = lastItem.businessNumber || lastItem.companyRegNum || '';
      }

      // 4. Load Excel Template
      const response = await fetch('/중소기업 취업자 소득세 감면 대상 명세서.xlsx');
      if (!response.ok) {
        throw new Error('엑셀 템플릿 파일을 찾을 수 없습니다. public 폴더를 확인해 주세요.');
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('엑셀 템플릿의 첫 번째 시트를 불러올 수 없습니다.');
      }

      // 5. Force column widths to prevent text wrapping/cutting off
      worksheet.getColumn('A').width = 9.5;
      worksheet.getColumn('B').width = 16.5;
      worksheet.getColumn('C').width = 13.0;
      worksheet.getColumn('D').width = 10.0;
      worksheet.getColumn('E').width = 12.0;
      worksheet.getColumn('F').width = 16.0;
      worksheet.getColumn('G').width = 13.0;
      worksheet.getColumn('H').width = 12.0;
      worksheet.getColumn('I').width = 12.0;

      // 6. Force row heights to prevent overlapping and provide spaces
      worksheet.getRow(4).height = 28;
      worksheet.getRow(5).height = 28;
      worksheet.getRow(6).height = 28;
      worksheet.getRow(9).height = 25;
      worksheet.getRow(10).height = 25;

      for (let r = 11; r <= 18; r++) {
        worksheet.getRow(r).height = 22;
      }

      worksheet.getRow(20).height = 40;
      worksheet.getRow(22).height = 30;
      worksheet.getRow(23).height = 35;
      worksheet.getRow(24).height = 35;

      worksheet.getRow(27).height = 22;
      worksheet.getRow(28).height = 28;
      worksheet.getRow(29).height = 28;
      worksheet.getRow(30).height = 38;
      worksheet.getRow(31).height = 38;

      // 7. Configure Page Setup for 1-Page Scaling with narrow margins
      worksheet.pageSetup = {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        orientation: 'portrait',
        paperSize: 9, // A4
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.4,
          bottom: 0.4,
          header: 0.2,
          footer: 0.2
        }
      };

      // 8. Fill Company Details
      worksheet.getCell('C4').value = "상 호 : " + companyName;
      worksheet.getCell('G4').value = "사업자등록번호 : " + businessNumber;
      worksheet.getCell('C5').value = "사업장소재지 : " + (regForm.companyAddress || '');
      worksheet.getCell('G5').value = "주업종코드 : " + (regForm.companyIndustry || '');
      worksheet.getCell('C6').value = "(전화번호 : " + (regForm.companyPhone || '') + ")";

      // 9. Fill Employee details (Row 11 / Row 12)
      worksheet.getCell('A11').value = regForm.name ? regForm.name.toUpperCase() : '';
      worksheet.getCell('B11').value = regForm.foreignerNumber || '';
      worksheet.getCell('C11').value = regForm.residentAddress || '';
      worksheet.getCell('D11').value = '청년';
      worksheet.getCell('E11').value = ageAtEmployment || '';
      worksheet.getCell('F11').value = '-';
      worksheet.getCell('G11').value = '-';
      
      // Start/End Dates are written into Row 12 H/I
      worksheet.getCell('H12').value = reductionStart || '';
      worksheet.getCell('I12').value = reductionEnd || '';

      // 10. Fill Bottom metadata (Date & Signature)
      const today = new Date();
      const currentYearStr = String(today.getFullYear());
      const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
      const currentDayStr = String(today.getDate()).padStart(2, '0');

      worksheet.getCell('A22').value = `${currentYearStr}년         ${currentMonthStr}월         ${currentDayStr}일`;
      
      // Set richText signature
      worksheet.getCell('A23').value = {
        richText: [
          { text: "원천징수의무자                  " },
          { font: { size: 10, bold: true, name: "돋움" }, text: companyName },
          { text: "                  " },
          { font: { size: 8, color: { argb: "FF7F7F7F" }, name: "돋움" }, text: "(서명 또는 인)" }
        ]
      };

      // 11. Generate and download workbook xlsx buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanName = regForm.name.trim().replace(/\s+/g, '_');
      link.download = `중소기업_감면명세서_${cleanName}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSmeModalOpen(false);
      showToast('감면 명세서 엑셀 다운로드가 완료되었습니다.', 'success');
      
      // Automatically trigger database save to sync company details
      handleSaveConsultInfo();
    } catch (err: any) {
      console.error('Error generating Excel from template:', err);
      showToast('엑셀 생성 실패: ' + err.message, 'error');
    }
  }

  const triggerKoreanInvoiceDownload = async () => {
    showToast(`${invoiceLanguage} 청구서 엑셀 파일을 작성하고 있습니다...`, 'info');
    try {
      let totalRefundSum = 0;
      let totalFeeSum = 0;
      const activeYearBreakdowns: { year: string; refund: number; fee: number }[] = [];

      targetYears.forEach(yr => {
        const { refund, fee } = getCombinedRefund(yr);
        if (refund > 0) {
          totalRefundSum += refund;
          totalFeeSum += fee;
          activeYearBreakdowns.push({ year: yr, refund, fee });
        }
      });

      if (activeYearBreakdowns.length === 0) {
        throw new Error('환급이 예상되는 연도가 없습니다. 정산 데이터를 확인해 주세요.');
      }

      // Multi-language translation dictionaries
      const translations: Record<string, Record<string, string>> = {
        '한국어': {
          title: '환급금 정산 청구서',
          sec1: '1. 고객 정보',
          name: '고객 성명',
          rrn: '주민등록번호',
          company: '소속 회사',
          sec2: '2. 환급금 및 수수료 내역',
          year: '정산 연도',
          expect: '예상 환급액 (국세+지방세)',
          fee: '대행 수수료',
          total: '합 계',
          sec3: '3. 입금 계좌 및 수납 안내',
          bank: '입금 은행',
          acc: '계좌 번호',
          owner: '예 금 주',
          footnote: '※ 대행 수수료 입금이 확인된 후, 세무서 국세청 경정청구 최종 접수가 진행됩니다.\n※ 입금하실 때는 반드시 고객님 본인 성명으로 입금해 주시기 바랍니다.',
          filePrefix: '청구서',
          feeNoticePrefix: '★ 고객님께서 납부하실 총 대행수수료는 ',
          feeNoticeSuffix: '원 입니다.'
        },
        '베트남어': {
          title: 'Hóa đơn thanh toán tiền hoàn thuế',
          sec1: '1. Thông tin khách hàng',
          name: 'Họ và tên khách hàng',
          rrn: 'Số đăng ký người nước ngoài (RRN)',
          company: 'Công ty sở thuộc',
          sec2: '2. Chi tiết tiền hoàn thuế và phí dịch vụ',
          year: 'Năm quyết toán',
          expect: 'Số tiền hoàn thuế dự kiến (Thuế quốc gia + Thuế địa phương)',
          fee: 'Phí dịch vụ đại lý',
          total: 'Tổng cộng',
          sec3: '3. Thông tin tài khoản ngân hàng và hướng dẫn thanh toán',
          bank: 'Ngân hàng chuyển tiền',
          acc: 'Số tài khoản',
          owner: 'Chủ tài khoản',
          footnote: '※ Phí dịch vụ đại lý sau khi được xác nhận thanh toán, thủ tục nộp hồ sơ hoàn thuế lên cơ quan thuế mới được tiến hành.\n※ Khi chuyển tiền, vui lòng ghi đúng họ và tên của khách hàng.',
          filePrefix: 'Hoa_Don',
          feeNoticePrefix: '★ Tổng phí dịch vụ quý khách cần thanh toán: ',
          feeNoticeSuffix: '원.'
        },
        '인도네시아어': {
          title: 'Faktur Pembayaran Pengembalian Pajak',
          sec1: '1. Informasi Pelanggan',
          name: 'Nama Pelanggan',
          rrn: 'Nomor Registrasi Penduduk (RRN)',
          company: 'Nama Perusahaan',
          sec2: '2. Rincian Pengembalian Pajak & Biaya Jasa',
          year: 'Tahun Penyelesaian',
          expect: 'Estimasi Pengembalian Pajak (Pajak Nasional + Daerah)',
          fee: 'Biaya Jasa Agen',
          total: 'Total',
          sec3: '3. Informasi Rekening Bank & Panduan Pembayaran',
          bank: 'Nama Bank',
          acc: 'Nomor Rekening',
          owner: 'Nama Pemilik Rekening',
          footnote: '※ Setelah pembayaran biaya jasa agen dikonfirmasi, pengajuan pengembalian pajak ke Kantor Pajak akan diproses.\n※ Saat mentransfer, harap pastikan menggunakan nama asli pelanggan.',
          filePrefix: 'Faktur',
          feeNoticePrefix: '★ Total biaya jasa agen yang harus dibayar: ',
          feeNoticeSuffix: '원.'
        },
        '몽골어': {
          title: 'Татварын буцаан олголтын нэхэмжлэх',
          sec1: '1. Үйлчлүүлэгчийн мэдээлэл',
          name: 'Үйлчлүүлэгчийн нэр',
          rrn: 'Иргэний бүртгэлийн дугаар (RRN)',
          company: 'Харьяалагдах компани',
          sec2: '2. Буцаан олголт ба үйлчилгээний хөлсний дэлгэрэំពүй',
          year: 'Тооцооны жил',
          expect: 'Хүлээгдэж буй буцаан олголт (Улсын татвар + Орон нутгийн татвар)',
          fee: 'Үйлчилгээний хөлс',
          total: 'Нийлбэр',
          sec3: '3. Дансны мэдээлэл ба төлбөрийн заавар',
          bank: 'Хүлээн авагч банк',
          acc: 'Дансны дугаар',
          owner: 'Данс эзэмшигч',
          footnote: '※ Үйлчилгээний хөлсний шилжүүлэг баталгаажсаны дараа, Татварын албанд хийх эцсийн мэдүүлэг боловсруулагдах болно.\n※ Шилжүүлэг хийхдээ үйлчлүүлэгч өөрийн нэрээр шилжүүлнэ үү.',
          filePrefix: 'Nehemjleh',
          feeNoticePrefix: '★ Төлөх нийт үйлчилгээний хөлс: ',
          feeNoticeSuffix: '원.'
        },
        '미얀마어': {
          title: 'အခွန်ပြန်အမ်းငွေပေးချေမှုပြေစာ',
          sec1: '1. ဝယ်ယူသူအချက်အလက်',
          name: 'ဝယ်ယူသူအမည်',
          rrn: 'နိုင်ငံသားမှတ်ပုံတင်နံပါတ် (RRN)',
          company: 'ကုမ္ပဏီအမည်',
          sec2: '2. အခွန်ပြန်အမ်းငွေနှင့် ဝန်ဆောင်ခအသေးစိတ်',
          year: 'တွက်ချက်သည့်နှစ်',
          expect: 'ခန့်မှန်းခြေအခွန်ပြန်အမ်းငွေ (နိုင်ငံတော်အခွန် + ဒေသန္တရအခွန်)',
          fee: 'ကိုယ်စားလှယ်ဝန်ဆောင်ခ',
          total: 'စုစုပေါင်း',
          sec3: '3. ဘဏ်အကောင့်အချက်အလက်နှင့် ငွေပေးချေမှုလမ်းညွှန်',
          bank: 'ဘဏ်အမည်',
          acc: 'အကောင့်နံပါတ်',
          owner: 'အကောင့်ပိုင်ရှင်',
          footnote: '※ ဝန်ဆောင်ခလွှဲပြောင်းမှုကို အတည်ပြုပြီးနောက် အခွန်ဦးစီးဌာနသို့ နောက်ဆုံးတင်ပြမှုကို ဆောင်ရွက်ပါမည်।\n※ ငွေလွှဲရာတွင် ဝယ်ယူသူကိုယ်တိုင်၏အမည်ဖြင့် လွှဲပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။',
          filePrefix: 'Invoice',
          feeNoticePrefix: '★ ပေးချေရမည့် စုစုပေါင်း ကိုယ်စားလှယ်ဝန်ဆောင်ခ: ',
          feeNoticeSuffix: '원.'
        },
        '캄보디아어': {
          title: 'វិក្កយបត្រទូទាត់ប្រាក់សំណងពន្ធ',
          sec1: '1. ព័ត៌មានអតិថិជន',
          name: 'ឈ្មោះអតិថិជន',
          rrn: 'លេខអត្តសញ្ញាណប័ណ្ណ (RRN)',
          company: 'ឈ្មោះក្រុមហ៊ុន',
          sec2: '2. ព័ត៌មានលម្អិតនៃប្រាក់សំណងពន្ធ និងកម្រៃសេវា',
          year: 'ឆ្នាំទូទាត់',
          expect: 'ប្រាក់សំណងពន្ធប៉ាន់ស្មាន (ពន្ធជាតិ + ពន្ធក្នុងតំបន់)',
          fee: 'កម្រៃសេវាតំណាង',
          total: 'សរុប',
          sec3: '3. ព័ត៌មានគណនីធនាគារ និងការណែនាំអំពីការបង់ប្រាក់',
          bank: 'ឈ្មោះធនាគារ',
          acc: 'លេខគណនី',
          owner: 'ឈ្មោះម្ចាស់គណនី',
          footnote: '※ បន្ទាប់ពីការបង់ប្រាក់កម្រៃសេវាតំណាងត្រូវបានបញ្ជាក់ ការដាក់ពាក្យសុំសំណងពន្ធចុងក្រោយទៅកាន់ការិយាល័យពន្ធដារនឹងត្រូវដំណើរការ।\n※ ពេលផ្ទេរប្រាក់ សូមប្រាកដថាប្រើប្រាស់ឈ្មោះពិតរបស់អតិថិជន។',
          filePrefix: 'Invoice_KH',
          feeNoticePrefix: '★ កម្រៃសេវាតំណាងសរុបដែលត្រូវបង់: ',
          feeNoticeSuffix: '원.'
        },
        '네팔어': {
          title: 'कर फिर्ता भुक्तानी इनभ्वाइस',
          sec1: '1. ग्राहक विवरण',
          name: 'ग्राहकको नाम',
          rrn: 'नागरिकता दर्ता नम्बर (RRN)',
          company: 'सम्बद्ध कम्पनी',
          sec2: '2. कर फिर्ता र सेवा शुल्क विवरण',
          year: 'आवधिक वर्ष',
          expect: 'अनुमानित कर फिर्ता (राष्ट्रिय कर + स्थानीय कर)',
          fee: 'एजेन्सी सेवा शुल्क',
          total: 'जम्मा',
          sec3: '3. bank खाता विवरण र भुक्तानी निर्देशन',
          bank: 'बैंकको नाम',
          acc: 'खाता नम्बर',
          owner: 'खातावालाको नाम',
          footnote: '※ सेवा शुल्क भुक्तानी पुष्टि भएपछि मात्र कर कार्यालयमा अन्तिम आवेदन प्रक्रिया अघि बढाइनेछ।\n※ रकम जम्मा गर्दा कृपया ग्राहककै नामबाट जम्मा गरिदिनुहोला।',
          filePrefix: 'Invoice_NP',
          feeNoticePrefix: '★ भुक्तानी गर्नुपर्ने जम्मा सेवा शुल्क: ',
          feeNoticeSuffix: '원.'
        }
      };

      const t = translations[invoiceLanguage] || translations['한국어'];
      const currentFont = invoiceLanguage === '한국어' ? '맑은 고딕' : 'Segoe UI';

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');
      worksheet.views = [{ showGridLines: true }];

      // Define default column widths
      worksheet.getColumn('A').width = 4;
      worksheet.getColumn('B').width = 16;
      worksheet.getColumn('C').width = 24;
      worksheet.getColumn('D').width = 24;
      worksheet.getColumn('E').width = 4;

      // Styling Helpers
      const thinBorder = {
        top: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } }
      };

      // 1. Title
      worksheet.mergeCells('B2:D2');
      const titleCell = worksheet.getCell('B2');
      titleCell.value = t.title;
      titleCell.font = { name: currentFont, size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Dark Navy
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 45;

      // 2. Client Info Section
      worksheet.getCell('B4').value = t.sec1;
      worksheet.getCell('B4').font = { name: currentFont, size: 11, bold: true };
      
      const infoLabels = [t.name, t.rrn, t.company];
      
      const companyNamesList: string[] = [];
      (regForm.years || []).forEach(yrData => {
        if (yrData?.active && yrData.workPlace && yrData.workPlace.trim()) {
          const nameTrim = yrData.workPlace.trim();
          if (!companyNamesList.includes(nameTrim)) {
            companyNamesList.push(nameTrim);
          }
        }
      });
      let companyName = companyNamesList.join(', ');
      if (!companyName && (regForm.years || []).length > 0) {
        const lastItem = regForm.years[regForm.years.length - 1];
        companyName = lastItem.workPlace || '';
      }

      // Mask RRN
      const rawRrn = regForm.foreignerNumber || '';
      let maskedRrn = rawRrn;
      if (rawRrn.replace(/-/g, '').length >= 7) {
        const clean = rawRrn.replace(/-/g, '');
        maskedRrn = clean.substring(0, 6) + '-' + clean.charAt(6) + '******';
      }

      const infoValues = [regForm.name || '', maskedRrn, companyName];

      for (let i = 0; i < 3; i++) {
        const rNum = 5 + i;
        const row = worksheet.getRow(rNum);
        row.height = 24;

        const lblCell = worksheet.getCell("B" + rNum);
        lblCell.value = infoLabels[i];
        lblCell.font = { name: currentFont, size: 10, bold: true };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        lblCell.border = thinBorder;
        lblCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells("C" + rNum + ":D" + rNum);
        const valCell = worksheet.getCell("C" + rNum);
        valCell.value = infoValues[i];
        valCell.font = { name: currentFont, size: 10 };
        valCell.border = thinBorder;
        valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        
        // Add border to merged cells manually
        worksheet.getCell("D" + rNum).border = thinBorder;
      }

      // 3. Calculation Table
      const startTableIdx = 9;
      worksheet.getCell("B" + startTableIdx).value = t.sec2;
      worksheet.getCell("B" + startTableIdx).font = { name: currentFont, size: 11, bold: true };

      // Header Row
      const headerRowIndex = startTableIdx + 1;
      worksheet.getRow(headerRowIndex).height = 26;
      
      const headers = [t.year, t.expect, t.fee + " (" + selectedFeeRate + "%)"];
      const headerCols = ['B', 'C', 'D'];
      
      for (let i = 0; i < 3; i++) {
        const cell = worksheet.getCell(headerCols[i] + headerRowIndex);
        cell.value = headers[i];
        cell.font = { name: currentFont, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Data Rows
      let currentIdx = headerRowIndex + 1;
      activeYearBreakdowns.forEach(item => {
        worksheet.getRow(currentIdx).height = 24;
        
        // Year Label
        const cellY = worksheet.getCell("B" + currentIdx);
        cellY.value = invoiceLanguage === '한국어' ? item.year + "년 정산" : item.year + " settlement";
        cellY.font = { name: currentFont, size: 10 };
        cellY.border = thinBorder;
        cellY.alignment = { vertical: 'middle', horizontal: 'center' };

        // Refund
        const cellR = worksheet.getCell("C" + currentIdx);
        cellR.value = item.refund;
        cellR.numFmt = '#,##0"원"';
        cellR.font = { name: currentFont, size: 10 };
        cellR.border = thinBorder;
        cellR.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

        // Fee
        const cellF = worksheet.getCell("D" + currentIdx);
        cellF.value = item.fee;
        cellF.numFmt = '#,##0"원"';
        cellF.font = { name: currentFont, size: 10, bold: true };
        cellF.border = thinBorder;
        cellF.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

        currentIdx++;
      });

      // Total Row
      worksheet.getRow(currentIdx).height = 26;
      
      const cellTotLbl = worksheet.getCell("B" + currentIdx);
      cellTotLbl.value = t.total;
      cellTotLbl.font = { name: currentFont, size: 10, bold: true };
      cellTotLbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotLbl.border = thinBorder;
      cellTotLbl.alignment = { vertical: 'middle', horizontal: 'center' };

      const cellTotR = worksheet.getCell("C" + currentIdx);
      cellTotR.value = totalRefundSum;
      cellTotR.numFmt = '#,##0"원"';
      cellTotR.font = { name: currentFont, size: 10, bold: true };
      cellTotR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotR.border = thinBorder;
      cellTotR.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

      const cellTotF = worksheet.getCell("D" + currentIdx);
      cellTotF.value = totalFeeSum;
      cellTotF.numFmt = '#,##0"원"';
      cellTotF.font = { name: currentFont, size: 10, bold: true, color: { argb: 'FFEF4444' } }; // Red
      cellTotF.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotF.border = thinBorder;
      cellTotF.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

      // Move to next row for the highlight callout
      currentIdx++;
      
      // Total Fee Highlight Callout Row
      worksheet.getRow(currentIdx).height = 30;
      worksheet.mergeCells("B" + currentIdx + ":D" + currentIdx);
      
      for (const col of ['B', 'C', 'D']) {
        const cell = worksheet.getCell(col + currentIdx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red Background
        cell.border = {
          top: { style: 'thin' as const, color: { argb: 'FFFCA5A5' } },
          bottom: { style: 'thin' as const, color: { argb: 'FFFCA5A5' } },
          left: col === 'B' ? { style: 'thin' as const, color: { argb: 'FFFCA5A5' } } : undefined,
          right: col === 'D' ? { style: 'thin' as const, color: { argb: 'FFFCA5A5' } } : undefined
        };
      }

      const cellFeeNotice = worksheet.getCell("B" + currentIdx);
      cellFeeNotice.value = {
        richText: [
          { font: { name: currentFont, size: 10, bold: true, color: { argb: 'FF1E293B' } }, text: t.feeNoticePrefix || '★ 고객님께서 납부하실 총 대행수수료는 ' },
          { font: { name: currentFont, size: 11, bold: true, color: { argb: 'FFEF4444' } }, text: Number(totalFeeSum).toLocaleString() },
          { font: { name: currentFont, size: 10, bold: true, color: { argb: 'FF1E293B' } }, text: t.feeNoticeSuffix || '원 입니다.' }
        ]
      };
      cellFeeNotice.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add a gap row after the callout
      currentIdx += 2;

      // 4. Bank Transfer Info Section
      worksheet.getCell("B" + currentIdx).value = t.sec3;
      worksheet.getCell("B" + currentIdx).font = { name: currentFont, size: 11, bold: true };

      currentIdx++;
      
      const bankLabels = [t.bank, t.acc, t.owner];
      const bankValues = ['IBK 기업은행', '540-049052-04-010', '한결금융컨설팅'];

      for (let i = 0; i < 3; i++) {
        const rNum = currentIdx + i;
        worksheet.getRow(rNum).height = 24;

        const lblCell = worksheet.getCell("B" + rNum);
        lblCell.value = bankLabels[i];
        lblCell.font = { name: currentFont, size: 10, bold: true };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        lblCell.border = thinBorder;
        lblCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells("C" + rNum + ":D" + rNum);
        const valCell = worksheet.getCell("C" + rNum);
        valCell.value = bankValues[i];
        valCell.font = { name: currentFont, size: 10, bold: i === 1 }; // Account number bold
        valCell.border = thinBorder;
        valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        worksheet.getCell("D" + rNum).border = thinBorder;
      }

      currentIdx += 3;
      
      // Guide text row
      worksheet.getRow(currentIdx).height = 45;
      worksheet.mergeCells("B" + currentIdx + ":D" + currentIdx);
      const guideCell = worksheet.getCell("B" + currentIdx);
      guideCell.value = t.footnote;
      guideCell.font = { name: currentFont, size: 9, color: { argb: 'FF64748B' }, italic: true };
      guideCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      // Page Setup for clean print preview
      worksheet.pageSetup = {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        orientation: 'portrait',
        paperSize: 9 // A4
      };

      // Generate file buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanName = regForm.name.trim().replace(/\s+/g, '_');
      link.download = t.filePrefix + "_" + cleanName + "_" + selectedFeeRate + "%.xlsx";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`${invoiceLanguage} 청구서 다운로드가 완료되었습니다.`, 'success');
    } catch (err: any) {
      console.error('Error generating invoice Excel:', err);
      showToast('청구서 생성 실패: ' + err.message, 'error');
    }
  };;;

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

  const handleRegisterConsultMemo = async () => {
    if (!regForm.clientId) {
      showToast('상담 메모를 등록할 고객이 선택되지 않았습니다. 고객을 먼저 등록하거나 상세 정보를 불러와주세요.', 'error');
      return;
    }
    if (!regForm.consultMemo || regForm.consultMemo.trim() === '') {
      showToast('등록할 상담 메모를 입력해 주세요.', 'error');
      return;
    }

    showToast('상담 메모를 등록하는 중...', 'info');

    // Find manager uuid associated with the client
    const currentMgr = dbManagers.find(m => m.name === regForm.managerName);
    const managerId = currentMgr?.id || 'a6f8d012-d555-414a-b78f-9110864dae3a'; // default/fallback to 관리자

    try {
      const { data, error } = await supabase
        .from('ConsultMemo')
        .insert([{
          clientId: regForm.clientId,
          content: regForm.consultMemo.trim(),
          managerId: managerId,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setConsultMemos(prev => [data, ...prev]);
        setRegForm(prev => ({ ...prev, consultMemo: '' }));
        showToast('상담 내용 및 메모가 상담처리 로그에 등록되었습니다.', 'success');
      }
    } catch (err: any) {
      console.error('Error inserting ConsultMemo:', err);
      showToast('상담 메모 등록 실패: ' + err.message, 'error');
    }
  };

  const handleDeleteConsultMemo = async (memoId: number) => {
    const ok = window.confirm('이 상담 메모를 삭제하시겠습니까?');
    if (!ok) return;

    showToast('상담 메모를 삭제하는 중...', 'info');

    try {
      const { error } = await supabase
        .from('ConsultMemo')
        .delete()
        .eq('id', memoId);

      if (error) {
        throw error;
      }

      setConsultMemos(prev => prev.filter(m => m.id !== memoId));
      showToast('상담 메모가 성공적으로 삭제되었습니다.', 'success');
    } catch (err: any) {
      console.error('Error deleting ConsultMemo:', err);
      showToast('상담 메모 삭제 실패: ' + err.message, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeText.new || !passwordChangeText.confirm) {
      showToast('새 비밀번호와 확인 비밀번호를 모두 입력해 주세요.', 'error');
      return;
    }
    if (passwordChangeText.new !== passwordChangeText.confirm) {
      showToast('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    showToast('비밀번호를 업데이트하는 중입니다...', 'info');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordChangeText.new
      });

      if (error) {
        throw error;
      }

      showToast('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 적용됩니다.', 'success');
      setPasswordChangeText({ current: '', new: '', confirm: '' });
      setCurrentView('customer');
    } catch (err: any) {
      console.error('Password change error:', err);
      showToast('비밀번호 변경 실패: ' + err.message, 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginId || !loginPw) {
      const msg = '이메일과 비밀번호를 모두 입력해 주세요.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }

    const email = loginId.includes('@') ? loginId.trim() : `${loginId.trim()}@novel-tax.kr`;
    showToast('로그인을 진행 중입니다...', 'info');

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: loginPw
      });

      if (authErr) {
        throw authErr;
      }

      if (authData && authData.user) {
        const { data: managerData, error: managerErr } = await supabase
          .from('Manager')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (managerErr || !managerData) {
          const msg = '등록되지 않은 매니저 계정입니다.';
          setAuthError(msg);
          showToast(msg, 'error');
          await supabase.auth.signOut();
          return;
        }

        if (!managerData.isConfirmed) {
          const msg = '가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.';
          setAuthError(msg);
          showToast(msg, 'error');
          await supabase.auth.signOut();
          return;
        }

        setIsLoggedIn(true);
        setCurrentManager({
          ...managerData,
          email: authData.user.email
        });
        setRegForm(prev => ({ ...prev, managerName: managerData.name || 'Boram' }));
        showToast(`${managerData.name || '관리자'} 님, 환영합니다!`, 'success');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        const msg = '등록되지 않은 아이디(이메일)이거나 비밀번호가 틀렸습니다.';
        setAuthError(msg);
        showToast(msg, 'error');
      } else {
        const msg = '로그인 실패: ' + err.message;
        setAuthError(msg);
        showToast(msg, 'error');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!signUpEmail || !signUpPassword || !signUpConfirmPassword || !signUpName) {
      const msg = '모든 가입 필드를 입력해 주세요.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      const msg = '비밀번호가 일치하지 않습니다.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }

    const email = signUpEmail.includes('@') ? signUpEmail.trim() : `${signUpEmail.trim()}@novel-tax.kr`;
    showToast('회원가입 요청을 처리 중입니다...', 'info');

    try {
      const { count, error: countErr } = await supabase
        .from('Manager')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      const isFirstUser = count === 0;

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: signUpPassword,
        options: {
          data: {
            name: signUpName.trim(),
            teamId: signUpTeamId
          }
        }
      });

      if (authErr) {
        throw authErr;
      }

      if (authData && authData.user) {
        const { error: profileErr } = await supabase
          .from('Manager')
          .upsert([{
            id: authData.user.id,
            name: signUpName.trim(),
            teamId: signUpTeamId,
            isAdmin: isFirstUser,
            isConfirmed: isFirstUser
          }], { onConflict: 'id' });

        if (profileErr) {
          throw profileErr;
        }

        if (isFirstUser) {
          showToast('최초 관리자 계정으로 자동 가입 및 승인되었습니다! 즉시 로그인하실 수 있습니다.', 'success');
        } else {
          showToast('회원가입 신청이 정상 완료되었습니다. 기존 관리자의 승인 후 로그인할 수 있습니다.', 'success');
        }

        setSignUpEmail('');
        setSignUpName('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setIsSignUpMode(false);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      const msg = '회원가입 실패: ' + err.message;
      setAuthError(msg);
      showToast(msg, 'error');
    }
  };

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
    setFilterRegDate('');
    setFilterMonthlyRent('');
    showToast('필터가 초기화되었습니다.', 'info');
  };

  const filteredCustomers = customers.filter(c => {
    // 국가 권한 필터링 (베트남 담당자면 베트남것만, 인도네시아면 인도네시아것만)
    const matchesManagerCountry = currentManagerCountry && currentManagerCountry !== 'ALL'
      ? c.nationality === currentManagerCountry
      : true;

    if (!matchesManagerCountry) return false;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.id).includes(searchQuery);
    
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

    const matchesMonthlyRent = filterMonthlyRent
      ? c.monthlyRent === filterMonthlyRent
      : true;

    return matchesSearch &&
      matchesNationality &&
      matchesRefundStatus &&
      matchesManager &&
      matchesBeforeDate &&
      matchesRegDate &&
      matchesCompanyName &&
      matchesVisaType &&
      matchesBirthDate &&
      matchesMonthlyRent;
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

      {!isLoggedIn && !isSessionChecking && currentView !== 'consent' && (
        <div className="login-page">
          <div className="login-box">
            <div className="login-logo">
              <img src="/logo_n.png" alt="Novel Tax Logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
              <div className="login-logo-text">
                <span className="login-logo-title">노벨 세무회계 연구</span>
                <span className="login-logo-subtitle">{isSignUpMode ? 'STAFF REGISTRATION' : 'ADMIN PORTAL'}</span>
              </div>
            </div>

            {!isSignUpMode ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>관리자 이메일 / 아이디</label>
                  <input
                    type="text"
                    className="login-input"
                    value={loginId}
                    onChange={(e) => { setLoginId(e.target.value); setAuthError(null); }}
                    placeholder="admin@novel-tax.kr"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>비밀번호</label>
                  <input
                    type="password"
                    className="login-input"
                    value={loginPw}
                    onChange={(e) => { setLoginPw(e.target.value); setAuthError(null); }}
                    placeholder="비밀번호 입력"
                    required
                  />
                </div>
                {authError && (
                  <div style={{
                    color: '#f87171',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {authError}
                  </div>
                )}
                <button type="submit" className="btn-login">로그인</button>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>계정이 없으신가요? </span>
                  <button type="button" onClick={() => { setIsSignUpMode(true); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                    회원가입 신청
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp}>
                <div className="form-group">
                  <label>이름 (실명)</label>
                  <input
                    type="text"
                    className="login-input"
                    value={signUpName}
                    onChange={(e) => { setSignUpName(e.target.value); setAuthError(null); }}
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>소속 팀 / 담당 국가</label>
                  <select
                    className="login-input"
                    value={signUpTeamId}
                    onChange={(e) => setSignUpTeamId(Number(e.target.value))}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      height: '42px',
                      fontSize: '14px',
                      padding: '0 12px',
                      width: '100%',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    {dbTeams.length > 0 ? (
                      dbTeams.map(team => (
                        <option key={team.id} value={team.id} style={{ color: '#000000' }}>
                          {team.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1} style={{ color: '#000000' }}>관리자</option>
                        <option value={2} style={{ color: '#000000' }}>베트남팀</option>
                        <option value={3} style={{ color: '#000000' }}>미얀마팀</option>
                        <option value={4} style={{ color: '#000000' }}>몽골팀</option>
                        <option value={5} style={{ color: '#000000' }}>인도네시아팀</option>
                        <option value={6} style={{ color: '#000000' }}>우즈베키스탄팀</option>
                        <option value={7} style={{ color: '#000000' }}>캄보디아팀</option>
                        <option value={8} style={{ color: '#000000' }}>스리랑카팀</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>이메일 주소</label>
                  <input
                    type="email"
                    className="login-input"
                    value={signUpEmail}
                    onChange={(e) => { setSignUpEmail(e.target.value); setAuthError(null); }}
                    placeholder="manager@novel-tax.kr"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    className="login-input"
                    value={signUpPassword}
                    onChange={(e) => { setSignUpPassword(e.target.value); setAuthError(null); }}
                    placeholder="6자 이상 입력"
                    minLength={6}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>비밀번호 확인</label>
                  <input
                    type="password"
                    className="login-input"
                    value={signUpConfirmPassword}
                    onChange={(e) => { setSignUpConfirmPassword(e.target.value); setAuthError(null); }}
                    placeholder="비밀번호 재입력"
                    required
                  />
                </div>
                {authError && (
                  <div style={{
                    color: '#f87171',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {authError}
                  </div>
                )}
                <button type="submit" className="btn-login" style={{ backgroundColor: '#10b981' }}>회원가입 신청</button>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>이미 계정이 있으신가요? </span>
                  <button type="button" onClick={() => { setIsSignUpMode(false); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                    로그인으로 돌아가기
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isLoggedIn && currentView !== 'consent' && (
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

            {/* 2. Complex New Registration & Detail Page (Matching the exact PDF and yearly tables in screenshot) */}
            {currentView === 'registration' && (
              <div className="view-container" style={{ backgroundColor: '#ffffff', padding: '20px' }}>
                {/* Registration Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
                      고객등록 관리
                      <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#ef4444' }}>고객정보 및 근로소득 원천징수영수증을 등록, 관리하고 환급 가능한 세액을 계산합니다.</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span 
                        onClick={() => {
                          setTempModalTeam(regForm.nationality || '미얀마');
                          setTempModalManager(regForm.managerName || 'Boram');
                          setIsManagerModalOpen(true);
                        }}
                        title="클릭하여 담당 팀 및 매니저 변경"
                        style={{ 
                          backgroundColor: '#2563eb', 
                          color: '#ffffff', 
                          padding: '3px 10px', 
                          borderRadius: '4px', 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      >
                        {regForm.nationality || '미얀마'}팀 {regForm.managerName || 'Boram'}
                        <span style={{ fontSize: '11px', opacity: 0.9 }}>✏️</span>
                      </span>

                      {isManagerModalOpen && (
                        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }} onClick={() => setIsManagerModalOpen(false)}>
                          <div className="modal-content" style={{ width: '380px', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>👥</span> 담당 팀 및 매니저 변경
                              </h3>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }} onClick={() => setIsManagerModalOpen(false)}><X size={20} /></button>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>담당 팀 (국적)</label>
                              <select 
                                className="form-control" 
                                style={{ width: '100%', height: '38px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }} 
                                value={tempModalTeam} 
                                onChange={(e) => setTempModalTeam(e.target.value)}
                              >
                                {nationalities.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>담당 매니저</label>
                              <select 
                                className="form-control" 
                                style={{ width: '100%', height: '38px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }} 
                                value={tempModalManager} 
                                onChange={(e) => setTempModalManager(e.target.value)}
                              >
                                {availableManagerList.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="btn-cancel" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsManagerModalOpen(false)}>취소</button>
                              <button className="btn-submit" style={{ padding: '8px 20px', fontSize: '13px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleApplyManagerChange}>변경 적용</button>
                            </div>
                          </div>
                        </div>
                      )}
                      <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>|</span>
                      <span style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block' }}>
                        최종업데이트 : {(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = now.getMonth() + 1;
                          const date = now.getDate();
                          let hours = now.getHours();
                          const minutes = String(now.getMinutes()).padStart(2, '0');
                          const ampm = hours >= 12 ? '오후' : '오전';
                          hours = hours % 12;
                          hours = hours ? hours : 12;
                          return `${year}년 ${month}월 ${date}일 ${ampm} ${hours}:${minutes}`;
                        })()}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>|</span>
                      <span style={{ 
                        backgroundColor: '#fef2f2', 
                        color: '#991b1b', 
                        border: '2px solid #ef4444',
                        padding: '3px 12px', 
                        borderRadius: '4px', 
                        fontSize: '13px', 
                        fontWeight: 'bold', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        🎯 청년 감면 대상 출생일 : {youthTaxReductionInfo.eligibleBirthRangeStr}
                      </span>
                    </div>
                  </div>
                  
                  {/* Real-time Youth Tax Reduction Age Calculator */}
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '2px solid #22c55e',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    marginLeft: 'auto',
                    marginRight: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    minWidth: '380px',
                    minHeight: '52px'
                  }}>
                    {youthTaxReductionInfo.hasEmpDate ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>
                          📅 취업일 기준 청년 감면 대상 범위
                        </div>
                        <div style={{ fontSize: '13px', color: '#14532d', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {youthTaxReductionInfo.eligibleBirthRangeStr}
                        </div>
                        {youthTaxReductionInfo.hasRrn ? (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            marginTop: '2px', 
                            fontSize: '12px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: youthTaxReductionInfo.isEligible ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${youthTaxReductionInfo.isEligible ? '#10b981' : '#f87171'}`,
                            color: youthTaxReductionInfo.isEligible ? '#065f46' : '#991b1b',
                            fontWeight: 'bold'
                          }}>
                            {youthTaxReductionInfo.isEligible ? '✅ 청년 소득세 감면: 적용 가능' : '❌ 청년 소득세 감면: 대상 아님'}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.9 }}>
                              (취업 당시 만 {youthTaxReductionInfo.ageAtEmployment}세)
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                            ✍️ 등록번호 입력 시 대상 여부를 실시간 판정합니다.
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textAlign: 'center' }}>
                        💡 <b>취업일</b>과 <b>외국인 등록번호</b>를 입력하면<br/>
                        청년 감면 대상 여부가 실시간 계산됩니다.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={handleResetAll}>전체 초기화</button>
                    <button className="btn-submit" style={{ padding: '6px 16px', fontSize: '13px', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={handleSaveRegistration}>{regForm.serial && regForm.serial > 0 ? '고객 업데이트' : '신규저장'}</button>
                    <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setCurrentView('customer')}>삭제</button>
                    <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setCurrentView('customer')}>목록</button>
                  </div>
                </div>

                {/* Form Group 1: Basic Information Input Grid (Light Blue Header Style, Table format for perfect alignment) */}
                                {/* Form Group 1: Basic Information Input Grid (Light Blue Header Style, Table format for perfect alignment) */}
                                <CustomerBasicInfoForm
                  regForm={regForm}
                  setRegForm={setRegForm}
                  nationalities={nationalities}
                  visaTypes={visaTypes}
                  bankList={bankList}
                  refundStatuses={refundStatuses}
                  submissionStatuses={submissionStatuses}
                />

                {/* Dependents & Additional Deductions Setting Panel */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px 18px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>👨‍👩‍👧‍👦</span>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                        부양가족 공제 및 세액 감면 설정
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                        부양가족 등록 시 소득공제(인당 150만 원) 및 세액공제가 추가 적용되어 환급금이 자동 증가합니다.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        총 소득공제: +{((regForm.dependentsCount * 150) + (regForm.seniorCount * 100) + (regForm.disabledCount * 200)).toLocaleString()}만 원
                      </span>
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        총 세액공제: +{(regForm.childCount * 15).toLocaleString()}만 원
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {/* 1. 기본 부양가족 */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>기본 부양가족</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>인당 150만 원 공제</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('dependentsCount', -1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.dependentsCount}명</span>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('dependentsCount', 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </div>

                    {/* 2. 만 70세 이상 경로우대 */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>경로우대 (70세 이상)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>인당 +100만 원 추가</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('seniorCount', -1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.seniorCount}명</span>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('seniorCount', 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </div>

                    {/* 3. 장애인 부양가족 */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>장애인 부양가족</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>인당 +200만 원 추가</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('disabledCount', -1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.disabledCount}명</span>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('disabledCount', 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </div>

                    {/* 4. 자녀 세액공제 */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>공제 대상 자녀</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>인당 15만 원 세액공제</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('childCount', -1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.childCount}명</span>
                        <button
                          type="button"
                          onClick={() => updateDependentsCount('childCount', 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Row for Family Proof Documents */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* 1. 가족관계증명서 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>📁 가족관계증명서:</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setRegForm(prev => ({ ...prev, familyDocFile: file }));
                          if (file) showToast(`가족관계증명서 (${file.name}) 파일이 첨부되었습니다.`, 'info');
                        }}
                        style={{ fontSize: '12px' }}
                      />
                      {regForm.familyDocUrl && (
                        <a
                          href={regForm.familyDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
                        >
                          [저장된 파일 보기]
                        </a>
                      )}
                    </div>

                    {/* 2. 외화 송금영수증 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>💸 외화 송금영수증:</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setRegForm(prev => ({ ...prev, remittanceDocFile: file }));
                          if (file) showToast(`송금영수증 (${file.name}) 파일이 첨부되었습니다.`, 'info');
                        }}
                        style={{ fontSize: '12px' }}
                      />
                      {regForm.remittanceDocUrl && (
                        <a
                          href={regForm.remittanceDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
                        >
                          [저장된 파일 보기]
                        </a>
                      )}
                    </div>
                  </div>

                  </div>

                  {/* 중소기업 판별기 영역 (스크린샷의 빨간색 박스 영역) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', marginBottom: '14px' }}>
                    <SmeVerification years={regForm.years} />
                  </div>

                 {/* Yearly Detailed Calculation Grid (Matching screenshot color themes: light blue headers, yellow highlights, zebra grid) */}

                <WageSettlementTable
                  regForm={regForm}
                  setRegForm={setRegForm}
                  selectedFeeRate={selectedFeeRate}
                  handleSingleYearPdfUpload={handleSingleYearPdfUpload}
                  handleBulkPdfUpload={handleBulkPdfUpload}
                  handleReanalyzeYearPdf={handleReanalyzeYearPdf}
                  handleDownloadPdf={handleDownloadPdf}
                  handleAddYear={handleAddYear}
                  handleRemoveYear={handleRemoveYear}
                  handleFeeRateChange={handleFeeRateChange}
                />

                {/* 3.3% Freelancer Business Income Settlement Table */}
                                <FreelancerSettlementTable
                  regForm={regForm}
                  setRegForm={setRegForm}
                  targetYears={targetYears}
                  selectedFeeRate={selectedFeeRate}
                  handleFreelancerSingleYearPdfUpload={handleFreelancerSingleYearPdfUpload}
                  handleBulkPdfUpload={handleBulkPdfUpload}
                  handleFeeRateChange={handleFeeRateChange}
                />

                {/* Combined Summary Table */}
                <CombinedSummaryTable
                  regForm={regForm}
                  targetYears={targetYears}
                  selectedFeeRate={selectedFeeRate}
                  handleFeeRateChange={handleFeeRateChange}
                  getCombinedRefund={getCombinedRefund}
                />

                {/* SME Tax Reduction Specification Excel Download Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadSmeSpecification}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      backgroundColor: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.35)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.25)'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    📄 중소기업 감면명세서 다운로드 (Excel)
                  </button>
                </div>

                 {/* Bottom Row split: Left Customer consultation details, Right Logs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
                  
                  {/* Left Column: 고객 상담 정보 관리 */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>고객 상담 정보 관리</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-cancel" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setRegForm(prev => ({ ...prev, snsName: '', snsAddress: '', hometaxId: '', hometaxPw: '', consultMemo: '' }))}>초기화</button>
                        <button className="btn-submit" style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#2563eb' }} onClick={handleSaveConsultInfo}>저장</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>페이스북명</label>
                        <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.snsName} onChange={(e) => setRegForm(prev => ({ ...prev, snsName: e.target.value }))} placeholder="SNS 닉네임" />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>페이스북주소</label>
                        <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.snsAddress} onChange={(e) => setRegForm(prev => ({ ...prev, snsAddress: e.target.value }))} placeholder="프로필 주소 URL" />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>홈택스 아이디</label>
                        <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.hometaxId} onChange={(e) => setRegForm(prev => ({ ...prev, hometaxId: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>홈택스 비밀번호</label>
                        <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.hometaxPw} onChange={(e) => setRegForm(prev => ({ ...prev, hometaxPw: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>고객 관리등급</label>
                        <select className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.customerGrade} onChange={(e) => setRegForm(prev => ({ ...prev, customerGrade: e.target.value }))}>
                          <option value="">선택하세요</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>녹취계약 일자</label>
                        <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.greenContractDate} onChange={(e) => setRegForm(prev => ({ ...prev, greenContractDate: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>상담처리 메모</label>
                        <textarea className="form-control" style={{ height: '70px', fontSize: '13px', padding: '6px' }} value={regForm.consultMemo} onChange={(e) => setRegForm(prev => ({ ...prev, consultMemo: e.target.value }))} placeholder="상담 세부 정보를 기입하세요" />
                      </div>
                      
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', margin: '4px 0' }}>
                        <button type="button" className="btn-submit" style={{ backgroundColor: '#10b981', fontSize: '13px', padding: '8px 16px' }} onClick={handleRegisterConsultMemo}>상담처리 등록</button>
                      </div>

                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>세금환급 실적</label>
                        <input type="number" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.refundPerformance} onChange={(e) => setRegForm(prev => ({ ...prev, refundPerformance: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>환급일자</label>
                        <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.refundPerformanceDate} onChange={(e) => setRegForm(prev => ({ ...prev, refundPerformanceDate: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>수수료 수납 실적</label>
                        <input type="number" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.feeReceivedPerformance} onChange={(e) => setRegForm(prev => ({ ...prev, feeReceivedPerformance: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>수납일자</label>
                        <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.feeReceivedDate} onChange={(e) => setRegForm(prev => ({ ...prev, feeReceivedDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 상담처리 로그 */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      상담처리 로그
                    </div>
                    <div style={{ flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                      {consultMemos.length > 0 ? (
                        <div style={{ width: '100%', overflowY: 'auto', maxHeight: '350px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '65%', borderBottom: '1px solid #e2e8f0' }}>상담처리 메모</th>
                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '25%', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>처리일시/담당자</th>
                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '10%', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>삭제</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consultMemos.map((memo) => {
                                const resolvedManager = dbManagers.find(m => m.id === memo.managerId)?.name || memo.managerId || '관리자';
                                const formattedDate = memo.createdAt
                                  ? new Date(memo.createdAt).toLocaleString('ko-KR', { 
                                      year: '2-digit', 
                                      month: 'numeric', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    })
                                  : '-';
                                return (
                                  <tr 
                                    key={memo.id} 
                                    className="clickable-log-row"
                                    style={{ borderBottom: '1px solid #f1f5f9' }}
                                    onClick={() => {
                                      alert(`[상담 메모 상세 보기]\n\n• 작성일시: ${formattedDate}\n• 담당 매니저: ${resolvedManager}\n\n-------------------------------\n\n${memo.content}`);
                                    }}
                                    title="클릭하여 상세 상담 내용을 확인하세요"
                                  >
                                    <td style={{ padding: '10px 12px', color: '#334155', whiteSpace: 'pre-wrap', verticalAlign: 'top', lineHeight: '1.4' }}>
                                      {memo.content}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: '#64748b', verticalAlign: 'top', textAlign: 'center', lineHeight: '1.3' }}>
                                      <div>{formattedDate}</div>
                                      <div style={{ fontWeight: '500', color: '#334155', marginTop: '2px' }}>{resolvedManager}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteConsultMemo(memo.id); }}
                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', transition: 'background-color 0.2s' }}
                                        title="삭제"
                                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #cbd5e1', borderRadius: '6px', minHeight: '200px' }}>
                          상담처리 기록이 없습니다.
                        </div>
                      )}

                    {/* 수임동의 관리 영역 */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📁 국세청 수임대리 관리 (비대면 동의 수집)</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                          * 신분증 및 서명 첨부 확인
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>수임동의 상태</label>
                          <select
                            className="form-control"
                            style={{ fontSize: '13px', height: '32px', padding: '2px 8px' }}
                            value={regForm.consentStatus || '대기'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              setRegForm((prev: any) => ({ ...prev, consentStatus: newStatus }));
                              if (regForm.clientId) {
                                try {
                                  const { error } = await supabase
                                    .from('Client')
                                    .update({ consentStatus: newStatus, updatedAt: new Date().toISOString() })
                                    .eq('id', regForm.clientId);
                                  if (error) throw error;
                                  showToast('수임동의 상태가 변경되었습니다.', 'success');
                                  setCustomers((prevCustomers: any[]) => prevCustomers.map(c => 
                                    c.uuid === regForm.clientId ? { ...c, consentStatus: newStatus } : c
                                  ));
                                } catch (err: any) {
                                  showToast(`상태 업데이트 실패: ${err.message}`, 'error');
                                }
                              }
                            }}
                          >
                            <option value="대기">◎ 대기</option>
                            <option value="제출완료">● 제출완료</option>
                            <option value="수임완료">★ 수임완료</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>제출 서류 확인</label>
                          <div style={{ display: 'flex', gap: '8px', height: '32px', alignItems: 'center' }}>
                            {regForm.arcImageUrl ? (
                              <button
                                type="button"
                                className="btn-action"
                                style={{ flex: 1, padding: '4px 8px', fontSize: '11px', height: '32px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                onClick={() => window.open(regForm.arcImageUrl, '_blank')}
                              >
                                📷 신분증 보기
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, textAlign: 'center' }}>신분증 없음</span>
                            )}
                            {regForm.signatureImageUrl ? (
                              <button
                                type="button"
                                className="btn-action"
                                style={{ flex: 1, padding: '4px 8px', fontSize: '11px', height: '32px', backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                onClick={() => window.open(regForm.signatureImageUrl, '_blank')}
                              >
                                ✍️ 서명 보기
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, textAlign: 'center' }}>서명 없음</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-action"
                        style={{
                          width: '100%',
                          height: '34px',
                          fontSize: '12px',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: '1px solid #1e293b',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginBottom: '8px'
                        }}
                        onClick={() => {
                          if (!regForm.clientId) {
                            showToast('고객을 먼저 저장해 주세요.', 'error');
                            return;
                          }
                          const consentLink = `${window.location.origin}${window.location.pathname}?view=consent&id=${regForm.clientId}`;
                          navigator.clipboard.writeText(consentLink);
                          showToast(`${regForm.name || '고객'}의 수임동의 링크가 복사되었습니다.`, 'success');
                        }}
                      >
                        🔗 수임동의 카톡/메신저 공유 링크 복사
                      </button>
                    </div>

                    {/* 청구서 및 수수료 발급 영역 */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}>
                        📋 청구서 발급 관리 (실시간 반영)
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>발급 언어 선택</label>
                          <select
                            className="form-control"
                            style={{ fontSize: '13px', height: '32px', padding: '2px 8px' }}
                            value={invoiceLanguage}
                            onChange={(e) => setInvoiceLanguage(e.target.value)}
                          >
                            <option value="한국어">🇰🇷 한국어 (Korean)</option>
                            <option value="베트남어">🇻🇳 베트남어 (Vietnamese)</option>
                            <option value="인도네시아어">🇮🇩 인도네시아어 (Indonesian)</option>
                            <option value="몽골어">🇲🇳 몽골어 (Mongolian)</option>
                            <option value="미얀마어">🇲🇲 미얀마어 (Burmese)</option>
                            <option value="캄보디아어">🇰🇭 캄보디아어 (Khmer)</option>
                            <option value="네팔어">🇳🇵 네팔어 (Nepali)</option>
                          </select>
                        </div>
                        <div style={{ width: '85px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>수수료율</label>
                          <div style={{ height: '32px', lineHeight: '32px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#334155' }}>
                            {selectedFeeRate}%
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                        현재 설정된 수수료율(<strong>{selectedFeeRate}%</strong>)과 예상 환급금을 기반으로 <strong>{invoiceLanguage}</strong> 청구서 엑셀 파일을 다운로드합니다.
                      </div>
                      <button
                        type="button"
                        onClick={triggerKoreanInvoiceDownload}
                        style={{
                          width: '100%',
                          height: '38px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                      >
                        <FileSpreadsheet size={16} />
                        {invoiceLanguage} 청구서 다운로드 (.xlsx)
                      </button>
                    </div>
                    </div>
                  </div>
                </div>

              </div>
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

            {/* 4. Password Change View */}
            {currentView === 'password' && (
              <ChangePasswordView
                passwordChangeText={passwordChangeText}
                setPasswordChangeText={setPasswordChangeText}
                handleChangePassword={handleChangePassword}
              />
            )}

          </main>
        </div>
      )}

      {/* SmeModal for entering/editing employer details dynamically */}
      {smeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #cbd5e1'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              📄 감면명세서 추가 정보 입력
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
              원천징수의무자(회사)의 세부 정보를 입력하세요. 이 정보는 브라우저에 자동 저장되어 다음 출력 시 자동으로 불러옵니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 주소</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyAddress}
                  onChange={(e) => setRegForm(prev => ({ ...prev, companyAddress: e.target.value }))}
                  placeholder="예: 충청북도 음성군 금왕읍 대금로..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 전화번호</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyPhone}
                  onChange={(e) => setRegForm(prev => ({ ...prev, companyPhone: e.target.value }))}
                  placeholder="예: 010-3285-0337"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>주업종코드</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyIndustry}
                  onChange={(e) => setRegForm(prev => ({ ...prev, companyIndustry: e.target.value }))}
                  placeholder="예: 172902"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setSmeModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#10b981' }}
                onClick={triggerExcelDownload}
              >
                엑셀 다운로드
              </button>
            </div>
          </div>
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
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#0f172a' }}
                onClick={handleDownloadHometaxFile}
              >
                파일 생성 및 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
