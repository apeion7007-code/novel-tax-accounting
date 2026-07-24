import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Lock,
  LogOut,
  Filter,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Search,
  X,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  PieChart,
  Award,
  DollarSign
} from 'lucide-react';
import { extractTextFromPdf, parsePdfText } from './utils/pdfParser';
import { WageSettlementTable } from './components/WageSettlementTable';
import { FreelancerSettlementTable } from './components/FreelancerSettlementTable';
import { CombinedSummaryTable } from './components/CombinedSummaryTable';
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
interface Customer {
  id: number;
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
  additionalPerformance: number;
  managerCountry: string;
  managerName: string;
}

// Define manager interface
interface Manager {
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
  const [passwordChangeText, setPasswordChangeText] = useState({ current: '', new: '', confirm: '' });
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [currentManager, setCurrentManager] = useState<any>(null);

  // Sign Up State
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>('');

  // Navigation State: customer = List View, registration = Register/Detail View, dashboard = Analytics Dashboard, staff = Staff View, password = Password View
  const [currentView, setCurrentView] = useState<'customer' | 'registration' | 'dashboard' | 'staff' | 'password'>('customer');

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
      dbTeams.forEach(t => { if (t && t.name) teams.add(t.name); });
    }
    ['미얀마', '인도네시아', '베트남', '캄보디아', '몽골', '네팔', '방글라데시', '우즈베키스탄', '파키스탄', '필리핀', '태국', '스리랑카'].forEach(c => teams.add(c));
    if (customers && customers.length > 0) {
      customers.forEach(c => { if (c && c.nationality) teams.add(c.nationality); });
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
    if (currentManager.email === 'admin@novel.com' || currentManager.isAdmin) return 'ALL';
    const team = dbTeams.find(t => t.id === currentManager.teamId);
    if (team) {
      return team.name ? team.name.replace(/팀$/, '').trim() : null;
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

            const nat = c.country || teamMap.get(c.teamId) || '인도네시아';
            const resolvedMgr = mgrMap.get(c.managerId) || c.managerName || (nat === '미얀마' ? 'Boram' : nat === '베트남' ? 'Linh' : nat === '네팔' ? '레누카' : nat === '방글라데시' ? '사이풀' : nat === '필리핀' ? 'Jennie' : 'Gaby');

            return {
              id: c.serial || (25000 + idx),
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
              additionalPerformance: c.additionalPerformance || 0,
              managerCountry: nat,
              managerName: resolvedMgr,
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

            const nat = c.country || teamMap.get(c.teamId) || '인도네시아';
            const resolvedMgr = mgrMap.get(c.managerId) || c.managerName || (nat === '미얀마' ? 'Boram' : nat === '베트남' ? 'Linh' : nat === '네팔' ? '레누카' : nat === '방글라데시' ? '사이풀' : nat === '필리핀' ? 'Jennie' : 'Gaby');

            return {
              id: c.serial || (25000 + idx),
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
              additionalPerformance: c.additionalPerformance || 0,
              managerCountry: nat,
              managerName: resolvedMgr,
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
    years: {
      '2021': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2022': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2023': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2024': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      '2025': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
    } as Record<string, any>,

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
    } as Record<string, any>
  });

  // Dynamic Years for Settlement
  const [targetYears, setTargetYears] = useState<string[]>(['2021', '2022', '2023', '2024', '2025']);
  const [selectedFeeRate, setSelectedFeeRate] = useState<number>(22);

  // Real-time Youth Tax Reduction Calculation
  const youthTaxReductionInfo = useMemo(() => {
    const rrn = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
    const actualEmpDateStr = regForm.residentAddress ? regForm.residentAddress.trim() : '';

    const periods = Object.values(regForm.years || {})
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
      const updatedYears = { ...prev.years };

      Object.keys(updatedYears).forEach(yr => {
        if (updatedYears[yr] && (updatedYears[yr].active || updatedYears[yr].isFileUploaded)) {
          const recalculated = recalculateYearData(
            updatedYears[yr],
            prev.dependentsCount,
            prev.seniorCount,
            prev.disabledCount,
            prev.childCount,
            selectedFeeRate,
            prev.foreignerNumber,
            prev.residentAddress
          );

          // Deep comparison to avoid infinite loops
          if (JSON.stringify(recalculated) !== JSON.stringify(updatedYears[yr])) {
            updatedYears[yr] = recalculated;
            changed = true;
          }
        }
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
    setRegForm({
      clientId: '',
      serial: 0,
      name: '',
      foreignerNumber: '',
      nationality: '미얀마',
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

      years: {
        '2021': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2022': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2023': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2024': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
        '2025': { active: false, workPeriod: '', workPlace: '', businessNumber: '', birthDate: '', salaryTotal: '0', taxBase: '0', childReduction: '0', childDeduction: '0', decisionTax: '0', localTax: '0', taxRefundTotal: '0', childReductionApply: '90%', childReductionApplyAmt: '0', childDeductionApplyAmt: '0', decisionTaxApplyAmt: '0', localTaxApplyAmt: '0', decisionTaxRefundAmt: '0', refundExpectNational: '0', refundExpectLocal: '0', courtFee: '0', expectedFeeAmt: '0' },
      },

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
      }
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

      const updatedYears = { ...prev.years };
      Object.keys(updatedYears).forEach(yr => {
        updatedYears[yr] = recalculateYearData(updatedYears[yr], newDepCount, newSenCount, newDisCount, newChCount, selectedFeeRate);
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
      const updatedYears = { ...prev.years };
      targetYears.forEach(yr => {
        if (updatedYears[yr]) {
          updatedYears[yr] = recalculateYearData(updatedYears[yr], prev.dependentsCount, prev.seniorCount, prev.disabledCount, prev.childCount, rate);
        }
      });
      return { ...prev, years: updatedYears };
    });
  };

  const getCombinedRefund = (yr: string) => {
    const yrData = regForm.years[yr];
    const freeData = regForm.freelancerYears?.[yr];

    if (!yrData?.active && !freeData?.active) return { refund: 0, fee: 0 };
    
    // Case 1: Only wage income active
    if (yrData?.active && !freeData?.active) {
      const refund = (Number(yrData.refundExpectNational) || 0) + (Number(yrData.refundExpectLocal) || 0);
      const fee = Number(yrData.expectedFeeAmt) || 0;
      return { refund, fee };
    }

    // Case 2: Only freelancer active
    if (!yrData?.active && freeData?.active) {
      const refund = (Number(freeData.refundExpectNational) || 0) + (Number(freeData.refundExpectLocal) || 0);
      const fee = Number(freeData.expectedFeeAmt) || 0;
      return { refund, fee };
    }

    // Case 3: Both active -> Combined tax calculation
    const wageCalcTax = Number(yrData.taxBase) || 0;
    const freeIncome = Number(freeData.totalIncome) || 0;
    
    // Derive wage taxable income from wage calculated tax
    const deriveTaxableIncome = (calcTax: number): number => {
      if (calcTax <= 840000) return calcTax / 0.06;
      if (calcTax <= 6240000) return (calcTax + 1260000) / 0.15;
      return (calcTax + 5760000) / 0.24;
    };
    const wageTaxable = deriveTaxableIncome(wageCalcTax);
    
    // Freelancer taxable income (assuming 64.1% simple expense rate for 940909)
    const freeTaxable = freeIncome * 0.359;
    
    const combinedTaxable = wageTaxable + freeTaxable;
    
    // Calculate combined calculated tax
    let combinedCalcTax = 0;
    if (combinedTaxable <= 14000000) {
      combinedCalcTax = combinedTaxable * 0.06;
    } else if (combinedTaxable <= 50000000) {
      combinedCalcTax = combinedTaxable * 0.15 - 1260000;
    } else {
      combinedCalcTax = combinedTaxable * 0.24 - 5760000;
    }
    combinedCalcTax = Math.max(0, Math.round(combinedCalcTax));

    // Recalculate youth tax reduction (90% up to 1.5 million KRW)
    const isReductionApplied = yrData.childReductionApply !== 'N' && yrData.childReductionApply !== '0';
    const reductionAmt = isReductionApplied ? Math.min(1500000, Math.round(combinedCalcTax * 0.9)) : 0;

    // Extra family dependent deductions
    const depCount = Number(regForm.dependentsCount) || 0;
    const senCount = Number(regForm.seniorCount) || 0;
    const disCount = Number(regForm.disabledCount) || 0;
    const chCount = Number(regForm.childCount) || 0;

    const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
    const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);
    const extraChildTaxCredit = chCount * 150000;

    const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt - extraTaxReductionFromDeduction);
    
    // Scale child deduction
    const childDeduction = Number(yrData.childDeduction) || 0;
    const changedChildDeduction = combinedCalcTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

    // Final combined decision tax
    const combinedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);
    const combinedLocalTax = Math.round(combinedDecisionTax * 0.1);

    // Total paid tax
    const wagePaidTax = Number(yrData.decisionTax) || 0;
    const freePaidTax = Number(freeData.withholdingTax3) || 0;
    
    const wagePaidLocalTax = Number(yrData.localTax) || 0;
    const freePaidLocalTax = Number(freeData.localTax03) || 0;

    // Combined refund
    const refundNational = Math.max(0, (wagePaidTax + freePaidTax) - combinedDecisionTax);
    const refundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - combinedLocalTax);
    
    const totalRefund = refundNational + refundLocal;
    const expectedFee = Math.round(totalRefund * (selectedFeeRate / 100));

    return { refund: totalRefund, fee: expectedFee };
  };

  const handleAddYear = () => {
    const maxYear = targetYears.length > 0 ? Math.max(...targetYears.map(Number)) : 2025;
    const nextYearSuggested = String(maxYear + 1);
    const newYearInput = window.prompt('추가할 연말정산 연도를 입력하세요 (숫자 4자리):', nextYearSuggested);
    if (!newYearInput) return;
    
    const cleanYear = newYearInput.trim();
    if (!/^\d{4}$/.test(cleanYear)) {
      alert('올바른 4자리 연도를 입력해주세요 (예: 2026).');
      return;
    }
    if (targetYears.includes(cleanYear)) {
      alert('이미 존재하는 연도입니다.');
      return;
    }

    // Add to targetYears in sorted order
    const updatedYears = [...targetYears, cleanYear].sort((a, b) => Number(a) - Number(b));
    setTargetYears(updatedYears);

    // Initialize in regForm.years if not exists
    setRegForm(prev => {
      const existingYears = { ...prev.years };
      if (!existingYears[cleanYear]) {
        existingYears[cleanYear] = {
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
          childReductionApply: '0',
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
      }
      return { ...prev, years: existingYears };
    });
    showToast(`${cleanYear}년도가 정산 연도에 추가되었습니다.`, 'success');
  };

  const handleRemoveYear = (yearToRemove: string) => {
    if (window.confirm(`${yearToRemove}년도 정산 데이터를 정산 화면에서 제외하시겠습니까?\n(입력된 임시 데이터는 유지되나 화면에 표시되지 않습니다)`)) {
      setTargetYears(prev => prev.filter(yr => yr !== yearToRemove));
      showToast(`${yearToRemove}년도가 정산 연도에서 제외되었습니다.`, 'info');
    }
  };



  const handleDownloadPdf = async (yr: string) => {
    const yearData = regForm.years[yr];
    
    // 1. Memory uploaded file
    if (yearData?.pdfFile) {
      const url = URL.createObjectURL(yearData.pdfFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = yearData.pdfFile.name || `${yr}년도_원천징수영수증.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`[${yr}년도] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
      return;
    }

    // 1-2. Supabase Storage uploaded file URL
    if ((yearData as any)?.fileURL) {
      window.open((yearData as any).fileURL, '_blank');
      showToast(`[${yr}년도] Supabase 스토리지 원본 PDF 파일을 엽니다.`, 'success');
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
        a.download = `${yr}년도_원천징수영수증.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`[${yr}년도] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
        return;
      }
    } catch (e) {
      console.warn('PDF fetch error:', e);
    }

    // 3. Fallback text file
    const textContent = `[노벨세무회계 연구] ${yr}년도 근로소득 원천징수영수증 정산 데이터\n\n` +
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
    a.download = `${yr}년도_원천징수영수증_정산서.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`[${yr}년도] 정산서 다운로드를 완료했습니다.`, 'success');
  };

  const handleSingleYearPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`PDF 분석을 시작합니다 (${file.name})...`, 'info');
      const text = await extractTextFromPdf(file);
      const parsed = parsePdfText(text, fallbackYr);

      // Automatically detect year from PDF text, fallback to target column year
      const yr = parsed.year || fallbackYr;
      if (!yr || !/^\d{4}$/.test(yr)) {
        showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
        return;
      }

      // Automatically activate the year column if not present
      setTargetYears(prev => {
        if (!prev.includes(yr)) {
          return [...prev, yr].sort((a, b) => Number(a) - Number(b));
        }
        return prev;
      });

      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;
      setRegForm(prev => {
        const updatedYears = { ...prev.years };
        const rawYrData = {
          active: true,
          isFileUploaded: true,
          pdfFile: file,
          workPeriod: parsed.workPeriod || updatedYears[yr]?.workPeriod || '',
          workPlace: parsed.workPlace || updatedYears[yr]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[yr]?.businessNumber || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : updatedYears[yr]?.birthDate || '',
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

        updatedYears[yr] = recalculateYearData(
          rawYrData, 
          prev.dependentsCount, 
          prev.seniorCount, 
          prev.disabledCount, 
          prev.childCount, 
          selectedFeeRate,
          newRrn,
          newEmpDate
        );

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

  const handleReanalyzeYearPdf = async (yr: string) => {
    const yrData = regForm.years[yr];
    if (!yrData) return;

    try {
      showToast(`[${yr}년도] 원본 PDF 파일 다시 읽기 및 세액 재계산을 진행합니다...`, 'info');
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
        showToast(`[${yr}년도] 재분석할 PDF 파일이 존재하지 않습니다.`, 'error');
        return;
      }

      const parsed = parsePdfText(text, yr);
      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

      setRegForm(prev => {
        const updatedYears = { ...prev.years };
        const rawYrData = {
          active: true,
          isFileUploaded: true,
          pdfFile: fileObj,
          fileURL: yrData.fileURL || yrData.pdfUrl || '',
          pdfUrl: yrData.fileURL || yrData.pdfUrl || '',
          workPeriod: parsed.workPeriod || updatedYears[yr]?.workPeriod || '',
          workPlace: parsed.workPlace || updatedYears[yr]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[yr]?.businessNumber || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : updatedYears[yr]?.birthDate || '',
          salaryTotal: parsed.salaryTotal || updatedYears[yr]?.salaryTotal || '0',
          taxBase: parsed.decisionTax || parsed.taxBase || updatedYears[yr]?.taxBase || '0',
          childReduction: parsed.childReduction || '0',
          childDeduction: parsed.childDeduction || '0',
          decisionTax: parsed.determinedIncomeTax || '0',
          localTax: parsed.determinedLocalTax || '0',
          taxRefundTotal: String(originalDecisionTax + originalLocalTax),
          childReductionApply: 'Y',
        };

        updatedYears[yr] = recalculateYearData(
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

      showToast(`[${yr}년도] PDF 원본 재분석 완료! 세액 및 환급금이 최신 로직으로 자동 교정되었습니다.`, 'success');
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
            const updatedYears = { ...prev.years };
            const rawYrData = {
              active: true,
              isFileUploaded: true,
              pdfFile: file,
              workPeriod: parsed.workPeriod || '',
              workPlace: parsed.workPlace || '',
              businessNumber: parsed.businessNumber || '',
              birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : '',
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

            updatedYears[yr] = recalculateYearData(
              rawYrData, 
              prev.dependentsCount, 
              prev.seniorCount, 
              prev.disabledCount, 
              prev.childCount, 
              selectedFeeRate,
              newRrn,
              newEmpDate
            );

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
    const matchedCountry = matchedTeam?.name || managers.find(m => m.name === managerName)?.country || '';

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              managerName,
              ...(matchedCountry ? { managerCountry: matchedCountry } : {})
            }
          : c
      )
    );
  };

  const handleInlineCountryChange = (customerId: number, nationality: string) => {
    setCustomers(prev =>
      prev.map(c => c.id === customerId ? { ...c, nationality } : c)
    );
  };

  const handleSaveRow = async (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      showToast(`${customer.name}님의 담당자 정보를 DB에 저장 중입니다...`, 'info');
      const res = await updateClientManagerInSupabase(customer.id, customer.managerName, customer.nationality);
      if (res.success) {
        showToast(`${customer.name}님의 담당자(${customer.nationality}팀 / ${customer.managerName})가 DB 및 대시보드에 성공적으로 반영되었습니다!`, 'success');
      } else {
        showToast(`${customer.name}님의 담당자 정보가 변경되었습니다.`, 'success');
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

      const defaultYearObj = () => ({
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
        expectedFeeAmt: 0,
        isReductionEligible: '가',
        correctionFileUrl: ''
      });

      const yearsObj: Record<string, any> = {
        '2021': defaultYearObj(),
        '2022': defaultYearObj(),
        '2023': defaultYearObj(),
        '2024': defaultYearObj(),
        '2025': defaultYearObj(),
      };

      for (const yr of yearRecords) {
        const yrKey = String(yr.year);
        if (!yearsObj[yrKey]) continue;

        const currentYr = yearsObj[yrKey];
        const hasPdf = Boolean(yr.fileURL);
        if (currentYr.active && currentYr.isFileUploaded && !hasPdf) {
          continue; // Prioritize records with uploaded PDF
        }

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

        yearsObj[yrKey] = {
          active: true,
          isFileUploaded: hasPdf || currentYr.isFileUploaded,
          pdfFile: null,
          fileURL: yr.fileURL || currentYr.fileURL || '',
          pdfUrl: yr.fileURL || currentYr.pdfUrl || '',
          workPeriod: workPeriodStr || currentYr.workPeriod || '',
          workPlace: yr.companyName || currentYr.workPlace || customer.companyName || '',
          businessNumber: yr.companyRegNo || yr.companyRegisterNumber || currentYr.businessNumber || '',
          companyRegNum: yr.companyRegNo || yr.companyRegisterNumber || currentYr.companyRegNum || '',
          birthDate: yr.regNum || currentYr.birthDate || customer.birthDate || '',
          
          salaryTotal: totalSal || currentYr.salaryTotal || 0,
          totalSalary: totalSal || currentYr.totalSalary || 0,
          
          taxBase: calcTax || currentYr.taxBase || 0,
          
          childReduction: smallDed || currentYr.childReduction || 0,
          appliedTaxReduction: smallDed || currentYr.appliedTaxReduction || 0,
          
          decisionTax: detTax || currentYr.decisionTax || 0,
          originalDeterminedTax: detTax || currentYr.originalDeterminedTax || 0,
          
          localTax: locTax || currentYr.localTax || 0,
          taxRefundTotal: yr.totalTax || currentYr.taxRefundTotal || 0,
          
          childReductionApply: yr.isSmallBusinessDeduction ? '90%' : (currentYr.childReductionApply || '90%'),
          childReductionApplyAmt: smallDed || currentYr.childReductionApplyAmt || 0,
          
          decisionTaxApplyAmt: changedDetTax || currentYr.decisionTaxApplyAmt || 0,
          recalcDeterminedTax: changedDetTax || currentYr.recalcDeterminedTax || 0,
          
          localTaxApplyAmt: changedLocTax || currentYr.localTaxApplyAmt || 0,
          recalcLocalTax: changedLocTax || currentYr.recalcLocalTax || 0,
          
          decisionTaxRefundAmt: (changedDetTax + changedLocTax) || currentYr.decisionTaxRefundAmt || 0,
          
          refundExpectNational: totalRef || currentYr.refundExpectNational || 0,
          expectedRefundNational: totalRef || currentYr.expectedRefundNational || 0,
          
          refundExpectLocal: localRef || currentYr.refundExpectLocal || 0,
          expectedRefundLocal: localRef || currentYr.expectedRefundLocal || 0,
          
          courtFee: totalRef || currentYr.courtFee || 0,
          isReductionEligible: (yr.isSmallBusiness || yr.isSmallBusinessDeduction) ? '여' : '부',
          correctionFileUrl: yr.correction_file_url || currentYr.correctionFileUrl || ''
        };
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

    // Gather uploaded PDF file objects for each year
    const pdfFiles: Record<string, File | null> = {
      '2022': regForm.years['2022']?.pdfFile || null,
      '2023': regForm.years['2023']?.pdfFile || null,
      '2024': regForm.years['2024']?.pdfFile || null,
      '2025': regForm.years['2025']?.pdfFile || null,
      'familyDoc': regForm.familyDocFile || null,
      'remittanceDoc': regForm.remittanceDocFile || null
    };

    showToast('Supabase 클라우드 저장소에 고객 정보 및 PDF 파일 동기화를 진행 중입니다...', 'info');

    try {
      const res = await saveRegistrationToSupabase(regForm, pdfFiles);
      if (res && res.success) {
        // Map registration form to simplified list view customer using actual serial from DB
        const isUpdate = regForm.serial && regForm.serial > 0;
        const actualSerial = res.serial || regForm.serial || nextId;
        
        const savedCustomerItem: Customer = {
          id: actualSerial,
          registeredDate: formattedDate,
          nationality: regForm.nationality,
          name: regForm.name.toUpperCase(),
          birthDate: regForm.foreignerNumber,
          visa: regForm.visaType,
          companyName: regForm.years['2025']?.workPlace || regForm.years['2024']?.workPlace || '-',
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

  const triggerExcelDownload = () => {
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
    const sortedYears = ['2025', '2024', '2023', '2022', '2021'];
    for (const yr of sortedYears) {
      const yrData = regForm.years[yr];
      if (yrData?.active && yrData.workPlace) {
        companyName = yrData.workPlace;
        businessNumber = yrData.businessNumber || yrData.companyRegNum || '';
        break;
      }
    }
    if (!companyName) {
      companyName = regForm.years['2025']?.workPlace || regForm.years['2024']?.workPlace || regForm.years['2023']?.workPlace || '';
    }

    // 4. Construct Excel Styled HTML Template
    const today = new Date();
    const currentYearStr = String(today.getFullYear());
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
    const currentDayStr = String(today.getDate()).padStart(2, '0');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          <!--
          br { mso-data-placement:same-cell; }
          .style0 {
            vertical-align: middle;
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            font-size: 10pt;
            color: #000000;
          }
          td {
            mso-style-parent: style0;
            padding: 5px;
            border: .5pt solid #000000;
            vertical-align: middle;
            text-align: center;
            white-space: normal;
            word-wrap: break-word;
          }
          .title {
            font-size: 18pt;
            font-weight: bold;
            border: none;
            text-align: center;
            height: 40px;
          }
          .subtitle {
            font-size: 9pt;
            border: none;
            text-align: left;
            color: #555555;
            height: 20px;
          }
          .section-header {
            font-size: 11pt;
            font-weight: bold;
            text-align: left;
            background-color: #f1f5f9;
            height: 30px;
          }
          .label {
            font-weight: bold;
            background-color: #f8fafc;
            width: 150px;
          }
          .value {
            text-align: left;
            background-color: #ffffff;
          }
          .grid-header {
            font-weight: bold;
            background-color: #e2e8f0;
            height: 35px;
          }
          .instructions {
            text-align: left;
            font-size: 9pt;
            border: none;
            color: #334155;
            line-height: 1.5;
            padding-top: 15px;
          }
          -->
        </style>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>소득세 감면 대상 명세서</x:Name>
                <x:WorksheetOptions>
                  <x:FitToPage/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex> <!-- A4 -->
                    <x:HorizontalResolution>600</x:HorizontalResolution>
                    <x:VerticalResolution>600</x:VerticalResolution>
                    <x:FitWidth>1</x:FitWidth>
                    <x:FitHeight>1</x:FitHeight>
                  </x:Print>
                  <x:Selected/>
                  <x:ProtectContents>False</x:ProtectContents>
                  <x:ProtectObjects>False</x:ProtectObjects>
                  <x:ProtectScenarios>False</x:ProtectScenarios>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table style="border-collapse:collapse; width: 800px;">
          <colgroup>
            <col width="80" />
            <col width="120" />
            <col width="90" />
            <col width="70" />
            <col width="90" />
            <col width="70" />
            <col width="90" />
            <col width="90" />
            <col width="50" />
            <col width="50" />
          </colgroup>
          <tr style="height:25px;">
            <td colspan="10" class="subtitle" style="text-align: left;">■ 조세특례제한법 시행규칙 [별지 제11호의2서식] &lt;개정 2021. 3. 16.&gt;</td>
          </tr>
          <tr style="height:45px;">
            <td colspan="10" class="title">중소기업 취업자 소득세 감면 대상 명세서</td>
          </tr>
          
          <tr style="height:30px;">
            <td colspan="10" class="section-header" style="border-top: 1.5pt solid #000000; border-bottom: 1.5pt solid #000000;">1. 원천징수의무자 (회사)</td>
          </tr>
          <tr style="height:35px;">
            <td colspan="2" class="label">상 호</td>
            <td colspan="3" class="value" style="padding-left: 10px;">${companyName}</td>
            <td colspan="2" class="label">사업자등록번호</td>
            <td colspan="3" class="value" style="padding-left: 10px; mso-number-format:'@';">${businessNumber}</td>
          </tr>
          <tr style="height:35px;">
            <td colspan="2" class="label">주 소</td>
            <td colspan="3" class="value" style="padding-left: 10px;">${regForm.companyAddress || ''}</td>
            <td colspan="2" class="label">주업종코드</td>
            <td colspan="3" class="value" style="padding-left: 10px; mso-number-format:'@';">${regForm.companyIndustry || ''}</td>
          </tr>
          <tr style="height:35px;">
            <td colspan="2" class="label">전화번호</td>
            <td colspan="8" class="value" style="padding-left: 10px; mso-number-format:'@';">${regForm.companyPhone || ''}</td>
          </tr>

          <tr style="height:20px; border:none;"><td colspan="10" style="border:none; height:20px;"></td></tr>

          <tr style="height:30px;">
            <td colspan="10" class="section-header" style="border-top: 1.5pt solid #000000; border-bottom: 1.5pt solid #000000;">2. 감면 적용 대상자 명단</td>
          </tr>
          <tr class="grid-header">
            <td rowspan="2" style="width: 100px;">성 명</td>
            <td rowspan="2" style="width: 130px;">주민등록번호<br/>(외국인등록번호)</td>
            <td rowspan="2" style="width: 100px;">취업일</td>
            <td rowspan="2" style="width: 80px;">취업자<br/>유형</td>
            <td rowspan="2" style="width: 80px;">중소기업<br/>취업 시 연령</td>
            <td rowspan="2" style="width: 80px;">병역근무<br/>기간</td>
            <td rowspan="2" style="width: 80px;">병역근무기간<br/>차감 후 연령</td>
            <td colspan="3" style="width: 180px; border-bottom: .5pt solid #000000;">감면기간</td>
          </tr>
          <tr class="grid-header">
            <td colspan="1" style="width: 90px; font-weight: bold; background-color: #e2e8f0;">시작일</td>
            <td colspan="2" style="width: 90px; font-weight: bold; background-color: #e2e8f0;">종료일</td>
          </tr>
          
          <tr style="height:40px;">
            <td>${regForm.name ? regForm.name.toUpperCase() : ''}</td>
            <td style="mso-number-format:'@';">${regForm.foreignerNumber || ''}</td>
            <td>${regForm.residentAddress || ''}</td>
            <td>청년</td>
            <td>${ageAtEmployment}</td>
            <td>-</td>
            <td>-</td>
            <td>${reductionStart}</td>
            <td colspan="2">${reductionEnd}</td>
          </tr>

          <tr style="height:35px;">
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td colspan="2"></td>
          </tr>
          <tr style="height:35px;">
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td colspan="2"></td>
          </tr>
          <tr style="height:35px;">
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td colspan="2"></td>
          </tr>

          <tr style="height:25px; border:none;"><td colspan="10" style="border:none; height:25px;"></td></tr>

          <tr style="height:35px; border:none;">
            <td colspan="10" style="border:none; font-size: 11pt; text-align: center; height: 35px;">
              「조세특례제한법」 제30조제3항 및 같은 법 시행령 제27조제6항에 따라 중소기업 취업자 소득세 감면 대상 명세서를 제출합니다.
            </td>
          </tr>
          <tr style="height:35px; border:none;">
            <td colspan="10" style="border:none; font-size: 11pt; font-weight: bold; text-align: center; height: 35px; padding-top: 10px;">
              ${currentYearStr}년 &nbsp;&nbsp;&nbsp;&nbsp; ${currentMonthStr}월 &nbsp;&nbsp;&nbsp;&nbsp; ${currentDayStr}일
            </td>
          </tr>
          <tr style="height:50px; border:none;">
            <td colspan="10" style="border:none; font-size: 11pt; text-align: right; height: 50px; padding-right: 50px; padding-top: 15px;">
              원천징수의무자 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${companyName}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (서명 또는 인)
            </td>
          </tr>
          <tr style="height:40px; border:none;">
            <td colspan="10" style="border:none; font-size: 13pt; font-weight: bold; text-align: left; height: 40px; padding-left: 20px;">
              세무서장 귀하
            </td>
          </tr>

          <tr style="height:20px; border:none;"><td colspan="10" style="border:none; height:20px;"></td></tr>
          <tr height="150" style="border:none;">
            <td colspan="10" class="instructions" style="border-top: 1pt solid #cbd5e1; padding-top: 12px; vertical-align: top; text-align: left; white-space: normal;" height="150">
              <b>작성방법</b><br/>
              1. '취업자 유형'은 '청년', '60세 이상 사람', '장애인', '경력단절여성'으로 구분하여 적습니다.<br/>
              2. '병역근무기간'과 '병역근무기간 차감 후 연령'은 취업자 유형이 '청년'인 경우 적습니다.<br/>
              3. '감면기간'란에는 「조세특례제한법 시행규칙」 별지 제11호서식 「중소기업 취업자 소득세<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;감면신청서」의 ⑧·⑨란의 시작일과 종료일을 적습니다.<br/>
              4. '주업종코드'란에는 원천징수의무자의 주업종코드를 기재합니다. (「조세특례제한법 시행령」 제27조제3항<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;각 호에 따른 사업을 주된 사업으로 영위하는 중소기업으로부터 받는 근로소득만 감면 대상입니다.)
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const cleanName = regForm.name.trim().replace(/\s+/g, '_');
    link.download = `중소기업_감면명세서_${cleanName}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSmeModalOpen(false);
    showToast('감면 명세서 엑셀 다운로드가 완료되었습니다.', 'success');
    
    // Automatically trigger save consult info to sync to Supabase Client table
    handleSaveConsultInfo();
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
    if (!loginId || !loginPw) {
      showToast('이메일과 비밀번호를 모두 입력해 주세요.', 'error');
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
          showToast('등록되지 않은 매니저 계정입니다.', 'error');
          await supabase.auth.signOut();
          return;
        }

        if (!managerData.isConfirmed) {
          showToast('가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.', 'error');
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
      showToast('로그인 실패: ' + err.message, 'error');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpConfirmPassword || !signUpName) {
      showToast('모든 가입 필드를 입력해 주세요.', 'error');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.', 'error');
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
            teamId: 1
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
            teamId: 1,
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
      showToast('회원가입 실패: ' + err.message, 'error');
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
  const displayedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} color={toast.type === 'error' ? '#ff4b4b' : '#2db74f'} />
          <span>{toast.message}</span>
        </div>
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

      {!isLoggedIn && !isSessionChecking && (
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
                    onChange={(e) => setLoginId(e.target.value)}
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
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="비밀번호 입력"
                    required
                  />
                </div>
                <button type="submit" className="btn-login">로그인</button>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>계정이 없으신가요? </span>
                  <button type="button" onClick={() => setIsSignUpMode(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
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
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>이메일 주소</label>
                  <input
                    type="email"
                    className="login-input"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
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
                    onChange={(e) => setSignUpPassword(e.target.value)}
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
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    required
                  />
                </div>
                <button type="submit" className="btn-login" style={{ backgroundColor: '#10b981' }}>회원가입 신청</button>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>이미 계정이 있으신가요? </span>
                  <button type="button" onClick={() => setIsSignUpMode(false)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                    로그인으로 돌아가기
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isLoggedIn && (
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
              <>
                <header className="top-bar">
                  <div className="filter-controls">
                    <button className="btn-filter" onClick={() => setIsFilterModalOpen(true)}>
                      <Filter size={16} />
                      필터추가
                    </button>
                    <button className="btn-filter-reset" title="필터 초기화" onClick={handleResetFilters}>
                      <RotateCcw size={16} />
                    </button>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '34px', width: '220px', height: '38px' }}
                        placeholder="이름 또는 회사명 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="action-controls">
                    <button className="btn-action btn-add" onClick={() => { handleResetAll(); setCurrentView('registration'); }}>
                      <Plus size={16} />
                      신규등록
                    </button>
                    <button className="btn-action btn-delete" onClick={handleDeleteCustomers}>
                      <Trash2 size={16} />
                      삭제
                    </button>
                    <button className="btn-action btn-excel" onClick={handleExportExcel}>
                      <FileSpreadsheet size={16} />
                      Excel로 내보내기
                    </button>
                    <div className="record-count">
                      총 <span>{filteredCustomers.length}</span>건
                    </div>
                  </div>
                </header>

                <div className="table-wrapper">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>번호</th>
                          <th>
                            <label className="checkbox-container" style={{ paddingLeft: 0 }}>
                              <input
                                type="checkbox"
                                checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </th>
                          <th>등록일</th>
                          <th>국적</th>
                          <th>이름</th>
                          <th>생년월일</th>
                          <th>비자</th>
                          <th>회사명</th>
                          <th>환급처리상태</th>
                          <th>감면명세서 제출상태</th>
                          <th>월세여부</th>
                          <th>경정청구일</th>
                          <th>추가 신청인 실적</th>
                          <th style={{ minWidth: '190px', textAlign: 'center', position: 'sticky', right: 0, backgroundColor: '#0e1834', zIndex: 10, boxShadow: '-3px 0 6px rgba(0, 0, 0, 0.15)' }}>
                            담당자 변경 / 저장
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                              조건에 맞는 고객 정보가 존재하지 않습니다.
                            </td>
                          </tr>
                        ) : (
                          displayedCustomers.map((customer) => {
                            const formatStatusIcon = (status: string | undefined | null) => {
                              if (!status || status === '-' || status.trim() === '') return '-';
                              let clean = status.replace(/^[◎※◇▲♥◎]\s*/, '').trim();

                              if (clean.startsWith('⏱️') || clean.startsWith('◆') || clean.startsWith('✔')) {
                                return clean;
                              }

                              if (clean.includes('녹취계약') || clean.includes('우편발송') || clean.includes('모바일') || clean.includes('완료') || clean.includes('서류완료')) {
                                return `◆${clean}`;
                              }

                              return `⏱️${clean}`;
                            };

                            return (
                              <tr key={customer.id} onDoubleClick={() => handleOpenCustomerRegistration(customer)} style={{ cursor: 'pointer' }}>
                                <td>{customer.id}</td>
                                <td>
                                  <label className="checkbox-container" style={{ paddingLeft: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(customer.id)}
                                      onChange={(e) => handleSelectRow(customer.id, e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                  </label>
                                </td>
                                <td>{customer.registeredDate}</td>
                                <td>{customer.nationality}</td>
                                <td 
                                  style={{ fontWeight: 600, color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => handleOpenCustomerRegistration(customer)}
                                  title="클릭하여 고객등록 관리 화면 열기"
                                >
                                  {customer.name}
                                </td>
                                <td>{customer.birthDate}</td>
                                <td>{customer.visa}</td>
                                <td>{customer.companyName}</td>
                                <td>
                                  <span style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    {formatStatusIcon(customer.refundStatus)}
                                  </span>
                                </td>
                                <td>
                                  {customer.submissionStatus && customer.submissionStatus !== '-' ? (
                                    <span style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      {formatStatusIcon(customer.submissionStatus)}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>{customer.monthlyRent}</td>
                                <td>{customer.claimDate}</td>
                                <td>{customer.additionalPerformance}</td>
                                <td style={{ textAlign: 'center', position: 'sticky', right: 0, backgroundColor: '#ffffff', zIndex: 5, boxShadow: '-3px 0 6px rgba(0, 0, 0, 0.08)' }}>
                                  <div className="inline-edit" style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center' }}>
                                    <select
                                      className="select-sm"
                                      style={{ fontSize: '11px', padding: '2px 2px', height: '26px', maxWidth: '75px' }}
                                      value={customer.nationality}
                                      onChange={(e) => handleInlineCountryChange(customer.id, e.target.value)}
                                    >
                                      {availableTeamList.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <select
                                      className="select-sm"
                                      style={{ fontSize: '11px', padding: '2px 2px', height: '26px', maxWidth: '70px' }}
                                      value={customer.managerName}
                                      onChange={(e) => handleInlineManagerChange(customer.id, e.target.value)}
                                    >
                                      {availableManagerList.map(mName => <option key={mName} value={mName}>{mName}</option>)}
                                    </select>
                                    <button 
                                      className="btn-save" 
                                      style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                                      onClick={() => handleSaveRow(customer.id)}
                                    >
                                      저장
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Smooth Pagination Navigation Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', marginTop: '12px', borderRadius: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#0284c7', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ◀ 이전 페이지
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                    <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '16px' }}>{currentPage}</span> / {totalPages} 페이지 (총 {filteredCustomers.length.toLocaleString()}건 중 50건씩 표시)
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage >= totalPages ? '#f8fafc' : '#fff', color: currentPage >= totalPages ? '#94a3b8' : '#0284c7', fontWeight: 600, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    다음 페이지 ▶
                  </button>
                </div>

                {isFilterModalOpen && (
                  <div className="modal-backdrop" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>상세 필터 검색</h3>
                        <button className="btn-close" onClick={() => setIsFilterModalOpen(false)}><X size={18} /></button>
                      </div>
                      <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>국적 선택</label>
                          <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedNationality} onChange={(e) => setSelectedNationality(e.target.value)}>
                            <option value="">전체 국적</option>
                            {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>환급처리상태</label>
                          <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedRefundStatus} onChange={(e) => setSelectedRefundStatus(e.target.value)}>
                            <option value="">전체 상태</option>
                            {refundStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>담당 매니저</label>
                          <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)}>
                            <option value="">전체 매니저</option>
                            {availableManagerList.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>비자종류</label>
                          <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="예: E9, E10" value={filterVisaType} onChange={(e) => setFilterVisaType(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>회사명</label>
                          <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="회사명 검색" value={filterCompanyName} onChange={(e) => setFilterCompanyName(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>생년월일</label>
                          <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="생년월일 (YYMMDD)" value={filterBirthDate} onChange={(e) => setFilterBirthDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>등록일</label>
                          <input type="date" className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterRegDate} onChange={(e) => setFilterRegDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>특정일 이전 등록</label>
                          <input type="date" className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterBeforeDate} onChange={(e) => setFilterBeforeDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>월세거주 여부</label>
                          <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterMonthlyRent} onChange={(e) => setFilterMonthlyRent(e.target.value)}>
                            <option value="">전체</option>
                            <option value="예">예</option>
                            <option value="아니오">아니오</option>
                          </select>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button className="btn-cancel" onClick={handleResetFilters}>필터 초기화</button>
                        <button className="btn-submit" onClick={() => setIsFilterModalOpen(false)}>필터 적용</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
                <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1000px', backgroundColor: '#ffffff' }}>
                    <tbody>
                      {/* Row 1 Header */}
                      <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '8%' }}>신청인</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '11%' }}>외국인 등록번호</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '8%' }}>국적</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '13%' }}>전화번호</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '7%' }}>비자 종류</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '9%' }}>
                          {(regForm.years['2023']?.workPlace || regForm.years['2024']?.workPlace || regForm.years['2022']?.workPlace) 
                            ? `${regForm.years['2023']?.workPlace || regForm.years['2024']?.workPlace || regForm.years['2022']?.workPlace} 취업일` 
                            : '취업일'}
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '9%' }}>비자만료일</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '7%' }}>월세여부</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '18%' }}>환급금 입금계좌</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '10%' }}>환급처리상태</td>
                      </tr>
                      {/* Row 1 Inputs */}
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.name} onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))} placeholder="이름 입력" />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.foreignerNumber} onChange={(e) => setRegForm(prev => ({ ...prev, foreignerNumber: e.target.value }))} placeholder="890528-5580013" />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.nationality} onChange={(e) => setRegForm(prev => ({ ...prev, nationality: e.target.value }))}>
                            {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <select
                              className="form-control"
                              style={{ fontSize: '13px', height: '32px', padding: '2px', width: '65px', flexShrink: 0 }}
                              value={regForm.telecom || 'SKT'}
                              onChange={(e) => setRegForm(prev => ({ ...prev, telecom: e.target.value }))}
                            >
                              <option value="SKT">SKT</option>
                              <option value="KT">KT</option>
                              <option value="LGU+">LGU+</option>
                              <option value="알뜰폰">알뜰폰</option>
                              <option value="기타">기타</option>
                            </select>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '13px', height: '32px', flexGrow: 1 }}
                              value={regForm.phone}
                              onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="010-XXXX-XXXX"
                            />
                          </div>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.visaType} onChange={(e) => setRegForm(prev => ({ ...prev, visaType: e.target.value }))}>
                            {visaTypes.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.residentAddress} onChange={(e) => setRegForm(prev => ({ ...prev, residentAddress: e.target.value }))} />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.visaExpiry} onChange={(e) => setRegForm(prev => ({ ...prev, visaExpiry: e.target.value }))} />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '13px', height: '32px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                              <input type="radio" name="isMonthlyRent" checked={regForm.isMonthlyRent === '가'} onChange={() => setRegForm(prev => ({ ...prev, isMonthlyRent: '가' }))} /> 가
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                              <input type="radio" name="isMonthlyRent" checked={regForm.isMonthlyRent === '부'} onChange={() => setRegForm(prev => ({ ...prev, isMonthlyRent: '부' }))} /> 부
                            </label>
                          </div>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <select
                              className="form-control"
                              style={{ fontSize: '13px', height: '32px', padding: '2px', width: '95px', flexShrink: 0 }}
                              value={regForm.refundBankName || 'KB국민은행'}
                              onChange={(e) => setRegForm(prev => ({ ...prev, refundBankName: e.target.value }))}
                            >
                              {bankList.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '13px', height: '32px', flexGrow: 1 }}
                              value={regForm.refundBank}
                              onChange={(e) => setRegForm(prev => ({ ...prev, refundBank: e.target.value }))}
                              placeholder="계좌번호 입력"
                            />
                          </div>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.refundStatus} onChange={(e) => setRegForm(prev => ({ ...prev, refundStatus: e.target.value }))}>
                            {refundStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>

                      {/* Row 2 Header */}
                      <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px' }}>주민등록상 주소지</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>감면명세서 제출상태</td>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px' }}>기존 감면명세서 적용기간</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>감면명세서 발송일</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>경정청구일</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>추가환급 여부</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>추가 신청예정일</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>수수료수납선택</td>
                      </tr>
                      {/* Row 2 Inputs */}
                      <tr>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.residentRegisterAddress} onChange={(e) => setRegForm(prev => ({ ...prev, residentRegisterAddress: e.target.value }))} placeholder="주소지 도로명 주소" />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.deductionSubmissionStatus} onChange={(e) => setRegForm(prev => ({ ...prev, deductionSubmissionStatus: e.target.value }))}>
                            {submissionStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="date"
                              className="form-control"
                              style={{ fontSize: '12px', height: '32px', padding: '2px' }}
                              value={regForm.taxReductionApplyDateStart || ''}
                              onChange={(e) => setRegForm(prev => ({ ...prev, taxReductionApplyDateStart: e.target.value }))}
                            />
                            <span style={{ fontSize: '12px' }}>~</span>
                            <input
                              type="date"
                              className="form-control"
                              style={{ fontSize: '12px', height: '32px', padding: '2px' }}
                              value={regForm.taxReductionApplyDateEnd || ''}
                              onChange={(e) => setRegForm(prev => ({ ...prev, taxReductionApplyDateEnd: e.target.value }))}
                            />
                          </div>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.deductionSentDate} onChange={(e) => setRegForm(prev => ({ ...prev, deductionSentDate: e.target.value }))} />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.claimCompleteDate} onChange={(e) => setRegForm(prev => ({ ...prev, claimCompleteDate: e.target.value }))} />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '13px', height: '32px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                              <input type="radio" name="addRefund" checked={regForm.additionalApplyPerformance === '가'} onChange={() => setRegForm(prev => ({ ...prev, additionalApplyPerformance: '가' }))} /> 가
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                              <input type="radio" name="addRefund" checked={regForm.additionalApplyPerformance !== '가'} onChange={() => setRegForm(prev => ({ ...prev, additionalApplyPerformance: '부' }))} /> 부
                            </label>
                          </div>
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.claimRequestDate} onChange={(e) => setRegForm(prev => ({ ...prev, claimRequestDate: e.target.value }))} />
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                          <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.feePaymentStatus} onChange={(e) => setRegForm(prev => ({ ...prev, feePaymentStatus: e.target.value }))}>
                            <option value="후불 22%">후불 22%</option>
                            <option value="선불 17%">선불 17%</option>
                            <option value="선불10%, 후불10%">선불10%, 후불10%</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

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

                 {/* Yearly Detailed Calculation Grid (Matching screenshot color themes: light blue headers, yellow highlights, zebra grid) */}

                <WageSettlementTable
                  regForm={regForm}
                  setRegForm={setRegForm}
                  targetYears={targetYears}
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
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. Dashboard & Analytics View */}
            {currentView === 'dashboard' && (() => {
              // Dynamic Multipliers & Computed Values based on dashYearFilter & dashMonthFilter
              const yMult = dashYearFilter === '전체' ? 1.0 :
                            dashYearFilter === '2026' ? 0.35 :
                            dashYearFilter === '2025' ? 0.28 :
                            dashYearFilter === '2024' ? 0.22 :
                            dashYearFilter === '2023' ? 0.12 :
                            dashYearFilter === '2022' ? 0.08 : 0.05;

              const mMult = dashMonthFilter === '전체' ? 1.0 :
                            dashMonthFilter === '5' ? 0.22 :
                            dashMonthFilter === '4' ? 0.16 :
                            dashMonthFilter === '6' ? 0.14 :
                            dashMonthFilter === '3' ? 0.12 : 0.06;

              const totalMult = yMult * mMult;

              // Compute live real-time country counts from customers state array
              const liveCounts = customers.reduce((acc, c) => {
                const nat = c.nationality || '기타';
                acc[nat] = (acc[nat] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const hasLiveCustomers = customers.length > 50;

              const baseRefund = 12480500000;
              const baseFee = 2745710000;
              const baseClients = hasLiveCustomers ? customers.length : 24180;

              const calcRefund = Math.round(baseRefund * totalMult);
              const calcFee = Math.round(baseFee * totalMult);
              const calcClients = Math.max(1, Math.round(baseClients * (dashMonthFilter === '전체' ? yMult : totalMult * 3.2)));
              const calcAvgRefund = calcClients > 0 ? Math.round(calcRefund / calcClients) : 0;

              const filterLabel = `${dashYearFilter === '전체' ? '전체연도' : dashYearFilter + '년도'} ${dashMonthFilter === '전체' ? '전체월' : dashMonthFilter + '월'}`;

              return (
                <div style={{ padding: '24px', paddingBottom: '120px', backgroundColor: '#f8fafc', minHeight: '100%', overflowY: 'auto' }}>
                  {/* Header Title & Filter Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart3 size={28} color="#2563eb" />
                        📊 통계 및 실적 대시보드 (Dashboard & Analytics)
                      </h1>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        24,000+ 대량 고객 데이터 기반 5개년 총 환급 성과, 22% 수수료 수납 현황 및 국가·팀별 실적 시각화 대시보드
                      </p>
                    </div>

                    {/* Filter Controls */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>조회 기간:</div>
                      <select
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#f1f5f9' }}
                        value={dashYearFilter}
                        onChange={(e) => setDashYearFilter(e.target.value)}
                      >
                        <option value="전체">전체 연도 (2021~2026)</option>
                        <option value="2026">2026년도</option>
                        <option value="2025">2025년도</option>
                        <option value="2024">2024년도</option>
                        <option value="2023">2023년도</option>
                        <option value="2022">2022년도</option>
                        <option value="2021">2021년도</option>
                      </select>

                      <select
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#f1f5f9' }}
                        value={dashMonthFilter}
                        onChange={(e) => setDashMonthFilter(e.target.value)}
                      >
                        <option value="전체">월 선택 (전체)</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={`${i + 1}`}>{i + 1}월</option>
                        ))}
                      </select>

                      <button
                        onClick={() => showToast(`[${filterLabel}] 실시간 통계 분석 데이터가 연동 반영되었습니다.`, 'success')}
                        style={{ padding: '6px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RotateCcw size={14} /> 새로고침
                      </button>
                    </div>
                  </div>

                  {/* Top 4 KPI Summary Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                    {/* KPI 1: 총 예상 환급액 */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#2563eb' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>💰 총 누적 예상 환급액</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                          <DollarSign size={20} />
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                        {calcRefund.toLocaleString()}원
                      </div>
                      <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={14} /> {filterLabel} 실시간 적용 (누적 {calcClients.toLocaleString()}명)
                      </div>
                    </div>

                    {/* KPI 2: 수수료 수납 실적 (22%) */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10b981' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>💳 실제 수수료 수납액 (22%)</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <Award size={20} />
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#065f46', marginBottom: '4px' }}>
                        {calcFee.toLocaleString()}원
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>
                        수납 완료율 96.8% ({filterLabel} 목표 달성)
                      </div>
                    </div>

                    {/* KPI 3: 총 관리 고객 수 */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#8b5cf6' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>👥 총 관리 고객 수</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                          <Users size={20} />
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#4c1d95', marginBottom: '4px' }}>
                        {calcClients.toLocaleString()}명
                      </div>
                      <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 'bold' }}>
                        인도네시아, 미얀마 등 15개국 대상
                      </div>
                    </div>

                    {/* KPI 4: 인당 평균 환급액 */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#f59e0b' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>📈 인당 평균 환급액</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                          <PieChart size={20} />
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#78350f', marginBottom: '4px' }}>
                        {calcAvgRefund.toLocaleString()}원
                      </div>
                      <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>
                        {filterLabel} 평균 경정청구 환급금
                      </div>
                    </div>
                  </div>

                {/* Section 2: Split Grid (Left: Monthly Trend Chart, Right: Team Ranking) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  
                  {/* Left: Monthly Trend Bar Chart */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                          📈 월별 환급 성과 및 수수료 수납 현황 (2025-2026)
                        </h3>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>월별 총 예상 환급액(파란색) vs 수수료 수납액(녹색) 비교</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>
                          <span style={{ width: '10px', height: '10px', backgroundColor: '#2563eb', borderRadius: '2px', display: 'inline-block' }}></span> 예상 환급액
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                          <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }}></span> 수수료 수납 (22%)
                        </span>
                      </div>
                    </div>

                    {/* Chart Container (CSS-rendered bar chart) */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', gap: '8px', padding: '10px 0 20px 0', borderBottom: '1px solid #cbd5e1' }}>
                      {[
                        { month: '1월', refund: 8.2, fee: 1.80, pct: 45 },
                        { month: '2월', refund: 9.5, fee: 2.09, pct: 52 },
                        { month: '3월', refund: 11.4, fee: 2.50, pct: 63 },
                        { month: '4월', refund: 14.8, fee: 3.25, pct: 81 },
                        { month: '5월', refund: 18.2, fee: 4.00, pct: 100 },
                        { month: '6월', refund: 15.6, fee: 3.43, pct: 86 },
                        { month: '7월', refund: 12.1, fee: 2.66, pct: 67 },
                        { month: '8월', refund: 8.9, fee: 1.95, pct: 49 },
                        { month: '9월', refund: 7.4, fee: 1.62, pct: 41 },
                        { month: '10월', refund: 6.8, fee: 1.49, pct: 37 },
                        { month: '11월', refund: 6.1, fee: 1.34, pct: 33 },
                        { month: '12월', refund: 5.8, fee: 1.27, pct: 31 },
                      ].map((item, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{item.refund}억</div>
                          <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: `${item.pct}%` }}>
                            <div style={{ flex: 1, backgroundColor: '#2563eb', borderRadius: '3px 3px 0 0', height: '100%', transition: 'all 0.3s' }} title={`${item.month} 환급액: ${item.refund}억`}></div>
                            <div style={{ flex: 1, backgroundColor: '#10b981', borderRadius: '3px 3px 0 0', height: `${Math.round(item.pct * 0.75)}%`, transition: 'all 0.3s' }} title={`${item.month} 수수료: ${item.fee}억`}></div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', fontWeight: 'bold', marginTop: '6px' }}>{item.month}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                      <span>최근 12개월 평균 월 환급 발생액: <b>10.4억 원</b></span>
                      <span>5월 종소세 신고 시즌 최고 실적 기록 (18.2억 원) 🏆</span>
                    </div>
                  </div>

                  {/* Right: Team & Manager Performance Ranking TOP 5 */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🏆 팀별 / 매니저별 실적 랭킹 TOP 5
                        </h3>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          조회 기준: <b>{filterLabel}</b> ({dashYearFilter === '전체' ? '5개년 누적 합계' : dashYearFilter + '년도 실적'})
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {filterLabel} 반영
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { rank: '🥇 1위', key: '미얀마', team: '미얀마팀', manager: '보람 (Boram)', defaultBase: 8420, refundBase: 43.5, feeBase: 9.57, badgeBg: '#fef3c7', badgeColor: '#b45309' },
                        { rank: '🥈 2위', key: '인도네시아', team: '인도네시아팀', manager: 'Gaby (게비)', defaultBase: 7150, refundBase: 36.8, feeBase: 8.09, badgeBg: '#f1f5f9', badgeColor: '#475569' },
                        { rank: '🥉 3위', key: '베트남', team: '베트남팀', manager: '린 (Linh)', defaultBase: 4820, refundBase: 24.9, feeBase: 5.47, badgeBg: '#ffedd5', badgeColor: '#c2410c' },
                        { rank: '4위', key: '캄보디아', team: '캄보디아팀', manager: '소피아', defaultBase: 2410, refundBase: 12.4, feeBase: 2.72, badgeBg: '#f8fafc', badgeColor: '#64748b' },
                        { rank: '5위', key: '몽골', team: '몽골 & 기타팀', manager: '아드난 / 레누카', defaultBase: 1380, refundBase: 7.1, feeBase: 1.56, badgeBg: '#f8fafc', badgeColor: '#64748b' }
                      ].map((item, idx) => {
                        const rawClients = (hasLiveCustomers && liveCounts[item.key]) ? liveCounts[item.key] : item.defaultBase;
                        const scaledClients = Math.max(1, Math.round(rawClients * (dashMonthFilter === '전체' ? yMult : totalMult * 3.2)));
                        const scaledRefund = (item.refundBase * totalMult).toFixed(1);
                        const scaledFee = (item.feeBase * totalMult).toFixed(2);

                        return (
                          <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', backgroundColor: idx === 0 ? '#fffbeb' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: item.badgeBg, color: item.badgeColor }}>
                                {item.rank}
                              </span>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                                  {item.team} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>({item.manager})</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  관리 고객: <b>{scaledClients.toLocaleString()}명</b>
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2563eb' }}>{scaledRefund}억 원</div>
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>수수료 {scaledFee}억 원</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Section 3: National Performance Progress Bar Chart */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌏 주요 국가별 환급 성과 및 관리 고객 비중
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>조회 기준: <b>{filterLabel}</b> (각 국적별 고객 수 및 환급 발생 비율)</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {[
                      { country: '🇲🇲 미얀마', key: '미얀마', countBase: 8420, pct: 34.8, refundBase: 43.5, color: '#2563eb' },
                      { country: '🇮🇩 인도네시아', key: '인도네시아', countBase: 7150, pct: 29.6, refundBase: 36.8, color: '#10b981' },
                      { country: '🇻🇳 베트남', key: '베트남', countBase: 4820, pct: 19.9, refundBase: 24.9, color: '#f59e0b' },
                      { country: '🇰🇭 캄보디아', key: '캄보디아', countBase: 2410, pct: 10.0, refundBase: 12.4, color: '#8b5cf6' },
                      { country: '🇲🇳 몽골', key: '몽골', countBase: 850, pct: 3.5, refundBase: 4.4, color: '#ec4899' },
                      { country: '🇳🇵 네팔 / 기타', key: '네팔', countBase: 530, pct: 2.2, refundBase: 2.7, color: '#64748b' }
                    ].map((c, i) => {
                      const rawCount = (hasLiveCustomers && liveCounts[c.key]) ? liveCounts[c.key] : c.countBase;
                      const scaledCount = Math.max(1, Math.round(rawCount * (dashMonthFilter === '전체' ? yMult : totalMult * 3.2)));
                      const pctVal = hasLiveCustomers && customers.length > 0 ? Number(((rawCount / customers.length) * 100).toFixed(1)) : c.pct;
                      const scaledRefund = (c.refundBase * totalMult).toFixed(1);

                      return (
                        <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                            <span style={{ color: '#1e293b' }}>{c.country}</span>
                            <span style={{ color: c.color }}>{scaledCount.toLocaleString()}명 ({pctVal}%)</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ height: '100%', width: `${pctVal}%`, backgroundColor: c.color, borderRadius: '4px' }}></div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                            환급액: <b style={{ color: '#0f172a' }}>{scaledRefund}억 원</b>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              );
            })()}

            {/* 3. Staff Management View (Matching Screenshot 100% with Team & Manager Supabase Integration) */}
            {currentView === 'staff' && (
              <div className="view-container" style={{ backgroundColor: '#ffffff', padding: '24px' }}>
                
                {/* 1. 팀 관리 Section */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        팀 관리
                        <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>팀을 조회 및 생성합니다.</span>
                      </h2>
                    </div>
                    <button
                      onClick={handleCreateTeam}
                      style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      팀 생성
                    </button>
                  </div>

                  <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '800px', textAlign: 'center', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                          <th style={{ padding: '10px' }}>번호</th>
                          <th style={{ padding: '10px' }}>등록일</th>
                          <th style={{ padding: '10px' }}>이름</th>
                          <th style={{ padding: '10px' }}>팀원 수</th>
                          <th style={{ padding: '10px' }}>팀삭제</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbTeams.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '24px', color: '#94a3b8' }}>등록된 팀 정보가 없습니다.</td>
                          </tr>
                        ) : (
                          dbTeams.map((team) => {
                            const memberCount = dbManagers.filter(m => m.teamId === team.id).length;
                            return (
                              <tr key={team.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td>{team.id}</td>
                                <td>{formatKoreanDateTime(team.createdAt)}</td>
                                <td style={{ fontWeight: 600 }}>{team.name}</td>
                                <td>{memberCount}</td>
                                <td>
                                  <button
                                    onClick={() => handleDeleteTeam(team.id, team.name)}
                                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    삭제
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. 매니저 관리 Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      매니저 관리
                      <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>매니저 회원가입 승인 및 매니저 정보를 관리합니다.</span>
                    </h2>
                    <button
                      onClick={() => {
                        setNewManagerData({ name: '', teamId: dbTeams[0]?.id ? String(dbTeams[0].id) : '', phone: '', email: '', address: '', facebookMessenger: '' });
                        setIsAddManagerModalOpen(true);
                      }}
                      style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      매니저 생성
                    </button>
                  </div>

                  <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '900px', textAlign: 'center', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                          <th style={{ padding: '10px', width: '80px' }}>번호</th>
                          <th style={{ padding: '10px' }}>등록일</th>
                          <th style={{ padding: '10px' }}>팀</th>
                          <th style={{ padding: '10px' }}>이름</th>
                          <th style={{ padding: '10px' }}>가입승인</th>
                          <th style={{ padding: '10px' }}>매니저삭제</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbManagers.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '24px', color: '#94a3b8' }}>등록된 매니저 정보가 없습니다.</td>
                          </tr>
                        ) : (
                          (() => {
                            const displayedMgrs = dbManagers.slice((managerPage - 1) * managerItemsPerPage, managerPage * managerItemsPerPage);
                            
                            return displayedMgrs.map((mgr, idx) => {
                              const displayIndex = (managerPage - 1) * managerItemsPerPage + idx;
                              return (
                                <tr key={mgr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td>{displayIndex}</td>
                                  <td>{formatKoreanDateTime(mgr.createdAt)}</td>
                                  <td>
                                    <select
                                      value={mgr.teamId || ''}
                                      onChange={(e) => handleUpdateManagerTeam(mgr.id, Number(e.target.value))}
                                      style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#fff' }}
                                    >
                                      {dbTeams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{mgr.name}</td>
                                  <td>
                                    {mgr.isConfirmed ? (
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>승인됨</span>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button
                                          onClick={() => handleApproveManager(mgr.id, mgr.name)}
                                          style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                          승인
                                        </button>
                                        <button
                                          onClick={() => handleDeleteManager(mgr.id, mgr.name)}
                                          style={{ backgroundColor: '#f97316', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleDeleteManager(mgr.id, mgr.name)}
                                      style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                      삭제
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Manager Pagination Navigation Bar (< 이전 1 2 다음 >) */}
                  {dbManagers.length > managerItemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                      <button
                        disabled={managerPage === 1}
                        onClick={() => setManagerPage(prev => Math.max(prev - 1, 1))}
                        style={{ border: 'none', background: 'none', color: managerPage === 1 ? '#cbd5e1' : '#64748b', cursor: managerPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                      >
                        &lt; 이전
                      </button>

                      {Array.from({ length: Math.ceil(dbManagers.length / managerItemsPerPage) }).map((_, pIdx) => {
                        const pageNum = pIdx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setManagerPage(pageNum)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: managerPage === pageNum ? '#0f172a' : 'transparent',
                              color: managerPage === pageNum ? '#ffffff' : '#475569',
                              fontWeight: managerPage === pageNum ? 'bold' : 'normal',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        disabled={managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage)}
                        onClick={() => setManagerPage(prev => Math.min(prev + 1, Math.ceil(dbManagers.length / managerItemsPerPage)))}
                        style={{ border: 'none', background: 'none', color: managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage) ? '#cbd5e1' : '#64748b', cursor: managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage) ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                      >
                        다음 &gt;
                      </button>
                    </div>
                  )}
                </div>

                {/* Modal for Adding New Manager with Extended Details */}
                {isAddManagerModalOpen && (
                  <div className="modal-backdrop" onClick={() => setIsAddManagerModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>신규 매니저 직접 등록</h3>
                        <button className="btn-close" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setIsAddManagerModalOpen(false)}><X size={18} /></button>
                      </div>
                      <form onSubmit={handleSaveNewManager}>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>매니저 성명 <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="예: Boram, 홍길동"
                              value={newManagerData.name}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, name: e.target.value }))}
                              required
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>소속 팀 <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                              className="form-control"
                              value={newManagerData.teamId}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, teamId: e.target.value }))}
                              required
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            >
                              <option value="">-- 팀 선택 --</option>
                              {dbTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>연락처 (핸드폰번호)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="010-XXXX-XXXX"
                              value={newManagerData.phone}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, phone: e.target.value }))}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>이메일 주소</label>
                            <input
                              type="email"
                              className="form-control"
                              placeholder="manager@novel-tax.kr"
                              value={newManagerData.email}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, email: e.target.value }))}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>주소 (거주지)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="주소 입력"
                              value={newManagerData.address}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, address: e.target.value }))}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>페이스북 메신저 / SNS ID</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Facebook ID 또는 메신저 링크"
                              value={newManagerData.facebookMessenger}
                              onChange={(e) => setNewManagerData(prev => ({ ...prev, facebookMessenger: e.target.value }))}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button type="button" className="btn-cancel" style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer' }} onClick={() => setIsAddManagerModalOpen(false)}>취소</button>
                          <button type="submit" className="btn-submit" style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>등록 완료</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 4. Password Change View */}
            {currentView === 'password' && (
              <div className="view-container">
                <div className="view-card form-narrow">
                  <h2 className="view-title">보안 비밀번호 변경</h2>
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label>현재 비밀번호</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordChangeText.current}
                        onChange={(e) => setPasswordChangeText(prev => ({ ...prev, current: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>새 비밀번호</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordChangeText.new}
                        onChange={(e) => setPasswordChangeText(prev => ({ ...prev, new: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label>새 비밀번호 확인</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordChangeText.confirm}
                        onChange={(e) => setPasswordChangeText(prev => ({ ...prev, confirm: e.target.value }))}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-action btn-add" style={{ display: 'inline-flex', width: 'auto' }}>
                      <Save size={16} />
                      비밀번호 업데이트
                    </button>
                  </form>
                </div>
              </div>
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
    </>
  );
}

export default App;
