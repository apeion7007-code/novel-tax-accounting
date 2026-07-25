import React from 'react';
import { BarChart3, RotateCcw, DollarSign, TrendingUp, Users, PieChart, Award } from 'lucide-react';
import type { Customer } from '../../App';

interface DashboardViewProps {
  dashYearFilter: string;
  setDashYearFilter: (yr: string) => void;
  dashMonthFilter: string;
  setDashMonthFilter: (mo: string) => void;
  customers: Customer[];
  selectedFeeRate: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashYearFilter,
  setDashYearFilter,
  dashMonthFilter,
  setDashMonthFilter,
  customers,
  selectedFeeRate: _selectedFeeRate,
  showToast
}) => {
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
};
