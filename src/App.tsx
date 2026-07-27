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
import { extractTextFromPdf, parsePdfText } from './utils/pdfParser';
import { generateHometaxFile } from './utils/hometaxGenerator';
import { ConsentPage } from './components/ConsentPage';
import { HometaxExcelSyncModal } from './components/modals/HometaxExcelSyncModal';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { DashboardView } from './components/views/DashboardView';
import { ChangePasswordView } from './components/views/ChangePasswordView';
import { StaffManagementView } from './components/views/StaffManagementView';
import { CustomerListView } from './components/views/CustomerListView';
import { AuthView } from './components/views/AuthView';
import { RegistrationView } from './components/views/RegistrationView';
import { generateConsolidatedExcel } from './utils/excelGenerator';
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

// Youth tax reduction helper imported from taxCalculator.ts

function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [currentManager, setCurrentManager] = useState<any>(null);

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
          if (!y.companyName) return; // Skip freelancer records for Wage Hometax file
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
      
      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (isBusiness || isOther) {
        const parsed = parsePdfText(text);
        const yr = parsed.year;
        if (!yr || !/^\d{4}$/.test(yr)) {
          showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
          return;
        }

        setRegForm((prev: any) => {
          const updatedFreelancer = { ...prev.freelancerYears };
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

          updatedFreelancer[yr] = {
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

          const updatedBasic: any = {};
          if (parsed.name) updatedBasic.name = parsed.name;
          if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

          return {
            ...prev,
            ...updatedBasic,
            freelancerYears: updatedFreelancer
          };
        });
        showToast(`[${yr}년도] 프리랜서 소득 파일로 감지되어 프리랜서 테이블로 자동 업로드되었습니다.`, 'success');
        return;
      }

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
        if (parsed.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;
        if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
        if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

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
          newEmpDate,
          prev
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
        const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
        const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

        setRegForm((prev: any) => {
          const updatedYears = [...(prev.years || [])];
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
          if (parsed.name) updatedBasic.name = parsed.name;
          if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;
          if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
          if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

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

          const updatedRow = recalculateYearData(
            rawYrData,
            prev.dependentsCount,
            prev.seniorCount,
            prev.disabledCount,
            prev.childCount,
            selectedFeeRate,
            newRrn,
            newEmpDate,
            prev
          );

          if (targetIndex !== -1) {
            updatedYears[targetIndex] = updatedRow;
          } else {
            updatedYears.push(updatedRow);
          }

          updatedYears.sort((a, b) => Number(a.year) - Number(b.year));

          return {
            ...prev,
            ...updatedBasic,
            years: updatedYears
          };
        });

        showToast(`[${yr}년도] 근로소득 파일로 감지되어 근로소득 테이블로 자동 업로드되었습니다.`, 'success');
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
        if (parsed.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

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

      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (isBusiness || isOther) {
        showToast('이 파일은 프리랜서(3.3%) 소득 PDF 파일입니다. 근로소득으로 재분석할 수 없습니다.', 'error');
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
          year: yr,
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
          selectedFeeRate,
          prev.foreignerNumber,
          prev.residentAddress,
          prev
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
            if (parsed.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;

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
            if (parsed.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber) updatedBasic.foreignerNumber = parsed.foreignerNumber;
            if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
            if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

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
              newEmpDate,
              prev
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
          correctionFileUrl: yr.correction_file || yr.correction_file_url || '',
          isRefundOverridden: true
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

  

  

  const triggerConsolidatedExcelDownload = async () => {
    try {
      await generateConsolidatedExcel(regForm, showToast);

      showToast('통합 경정청구 명세서 엑셀 다운로드가 완료되었습니다.', 'success');
      handleSaveConsultInfo();
    } catch (err: any) {
      console.error('Error generating consolidated Excel:', err);
      showToast('엑셀 생성 실패: ' + err.message, 'error');
    }
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
      let reductionStart = '';
      let reductionEnd = '';
      if (regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empYear = Number(empParts[0]);
          const empMonth = Number(empParts[1]);
          reductionStart = regForm.residentAddress; // 시작일은 취업일 그 자체
          const endMonthDate = new Date(empYear + 5, empMonth, 0); // 5년 후 취업월의 말일
          const ey = endMonthDate.getFullYear();
          const em = String(endMonthDate.getMonth() + 1).padStart(2, '0');
          const ed = String(endMonthDate.getDate()).padStart(2, '0');
          reductionEnd = `${ey}-${em}-${ed}`;
        }
      }
      if (!reductionStart) {
        reductionStart = regForm.taxReductionApplyDateStart || '';
        reductionEnd = regForm.taxReductionApplyDateEnd || '';
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
      
      const cleanCustomerName = regForm.name.trim();
      link.download = `${cleanCustomerName} 중소기업 감면 명세서.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      

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
      const activeYearBreakdowns: { year: string; type: 'wage' | 'free'; refund: number; fee: number }[] = [];

      targetYears.forEach(yr => {
        const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
        const freeData = regForm.freelancerYears?.[yr];
        const hasWage = matchingWageDataList.length > 0;
        const hasFree = freeData?.active;

        if (hasWage && hasFree) {
          const combined = getCombinedRefund(yr);
          const wageRefund = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.refundExpectNational || 0) + Number(y.refundExpectLocal || 0), 0);
          const wageFee = Math.round(wageRefund * (selectedFeeRate / 100));
          const businessRefund = combined.wageFreeRefund - wageRefund;
          const businessFee = combined.fee - wageFee;

          if (wageRefund > 0) {
            totalRefundSum += wageRefund;
            totalFeeSum += wageFee;
            activeYearBreakdowns.push({ year: yr, type: 'wage', refund: wageRefund, fee: wageFee });
          }
          if (businessRefund > 0) {
            totalRefundSum += businessRefund;
            totalFeeSum += businessFee;
            activeYearBreakdowns.push({ year: yr, type: 'free', refund: businessRefund, fee: businessFee });
          }
        } else if (hasWage) {
          const wageRefund = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.refundExpectNational || 0) + Number(y.refundExpectLocal || 0), 0);
          const wageFee = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.expectedFeeAmt || 0), 0);
          if (wageRefund > 0) {
            totalRefundSum += wageRefund;
            totalFeeSum += wageFee;
            activeYearBreakdowns.push({ year: yr, type: 'wage', refund: wageRefund, fee: wageFee });
          }
        } else if (hasFree) {
          const combined = getCombinedRefund(yr);
          if (combined.wageFreeRefund > 0) {
            totalRefundSum += combined.wageFreeRefund;
            totalFeeSum += combined.fee;
            activeYearBreakdowns.push({ year: yr, type: 'free', refund: combined.wageFreeRefund, fee: combined.fee });
          }
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
          wageLabel: '근로소득',
          freeLabel: '사업소득(3.3%)',
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
          wageLabel: 'Thu nhập từ lương',
          freeLabel: 'Thu nhập tự do (3.3%)',
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
          wageLabel: 'Pendapatan gaji',
          freeLabel: 'Pekerja bebas (3.3%)',
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
          wageLabel: 'Цалингийн орлого',
          freeLabel: 'Чөлөөт орлого (3.3%)',
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
      worksheet.getColumn('B').width = 30;
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
        const suffix = item.type === 'wage' ? t.wageLabel : t.freeLabel;
        cellY.value = item.year + (invoiceLanguage === '한국어' ? '년 ' : ' ') + suffix;
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
      
      const cleanCustomerName = regForm.name.trim();
      link.download = `${cleanCustomerName} 청구서.xlsx`;
      
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
        <AuthView
          setIsLoggedIn={setIsLoggedIn}
          setCurrentManager={setCurrentManager}
          setRegForm={setRegForm}
          showToast={showToast}
          dbTeams={dbTeams}
        />
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

            {/* 2. Complex New Registration & Detail Page */}
            {currentView === 'registration' && (
              <RegistrationView
                regForm={regForm}
                setRegForm={setRegForm}
                selectedFeeRate={selectedFeeRate}
                invoiceLanguage={invoiceLanguage}
                setInvoiceLanguage={setInvoiceLanguage}
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
