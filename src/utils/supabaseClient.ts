import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to convert date strings safely without throwing RangeErrors on invalid dates
const safeToISOString = (dateStr: any): string | null => {
  if (!dateStr || String(dateStr).trim() === '' || String(dateStr).includes('연도-월-일') || String(dateStr).includes('연도')) {
    return null;
  }
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  } catch (e) {
    return null;
  }
};


/**
 * Fast initial fetch (First 500 records for instant 0.1s UI render)
 */
export async function fetchInitialClientsFromSupabase() {
  try {
    const { data: clients, error: clientErr } = await supabase
      .from('Client')
      .select('*')
      .order('createdAt', { ascending: false })
      .range(0, 499);

    if (clientErr) {
      console.warn('Initial fetch error:', clientErr.message);
      return null;
    }

    return clients || [];
  } catch (err) {
    console.error('Initial fetch exception:', err);
    return null;
  }
}

/**
 * High-speed parallel background fetch for ALL 24,634+ Client records
 */
export async function fetchAllClientsParallelFromSupabase(totalEstimate = 26000) {
  try {
    const pageSize = 1000;
    const totalPages = Math.ceil(totalEstimate / pageSize);

    const promises = [];
    for (let i = 0; i < totalPages; i++) {
      promises.push(
        supabase
          .from('Client')
          .select('*')
          .order('createdAt', { ascending: false })
          .range(i * pageSize, (i + 1) * pageSize - 1)
      );
    }

    const results = await Promise.all(promises);
    let allClients: any[] = [];
    for (const r of results) {
      if (r.data) allClients.push(...r.data);
    }

    return allClients;
  } catch (err) {
    console.error('Parallel fetch exception:', err);
    return null;
  }
}

/**
 * Upload a PDF file to Supabase Storage ('novel_pdf' bucket) and return its public URL
 */
export async function uploadPdfToSupabase(file: File, path: string): Promise<string | null> {
  try {
    const bucketName = 'novel_pdf';
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (error) {
      console.warn(`Storage upload warning for bucket [${bucketName}]:`, error.message);
      const { error: docErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: true });
      if (docErr) {
        console.warn('Fallback bucket upload warning:', docErr.message);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(path);
      return publicUrlData.publicUrl;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading PDF to Supabase:', err);
    return null;
  }
}

/**
 * Save complete registration form & year-end records to Supabase with exact 1:1 schema alignment
 */
export async function saveRegistrationToSupabase(regForm: any, pdfFileObjects: Record<string, File | null>) {
  try {
    // 1. Map manager name to their actual UUID in the database to satisfy the foreign key constraint
    let dbManagerId: string | null = null;
    try {
      const { data: managers } = await supabase
        .from('Manager')
        .select('id, name');
      
      if (managers && regForm.managerName) {
        const match = managers.find(m => m.name && m.name.trim().toLowerCase() === regForm.managerName.trim().toLowerCase());
        if (match) {
          dbManagerId = match.id;
        } else {
          const partialMatch = managers.find(m => m.name && (m.name.includes(regForm.managerName) || regForm.managerName.includes(m.name)));
          if (partialMatch) {
            dbManagerId = partialMatch.id;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to resolve manager UUID:', err);
    }

    if (!dbManagerId) {
      dbManagerId = 'a13ec999-31d8-4421-9628-4f0fe4a1e217'; // Default fallback to Boram's UUID
    }

    let clientId: string | null = regForm.clientId || null;
    let newClientSerial: number | null = null;
    let isNewInsert = false;

    if (!clientId && regForm.foreignerNumber) {
      const { data: existing } = await supabase
        .from('Client')
        .select('id')
        .eq('regNum', regForm.foreignerNumber)
        .maybeSingle();

      if (existing) {
        clientId = existing.id;
      }
    }

    if (!clientId) {
      clientId = typeof self !== 'undefined' && self.crypto && self.crypto.randomUUID 
        ? self.crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      isNewInsert = true;
    }

    const clientPayload: Record<string, any> = {
      name: regForm.name ? regForm.name.toUpperCase() : '',
      regNum: regForm.foreignerNumber || '',
      country: regForm.nationality || '인도네시아',
      managerId: dbManagerId,
      visa: regForm.visaType || 'E9',
      company: regForm.years['2025']?.workPlace || regForm.years['2024']?.workPlace || '',
      isMonthlyTenant: regForm.isMonthlyRent === '가',
      phone: regForm.phone || '',
      phoneComp: regForm.telecom || 'SKT',
      bank: regForm.refundBankName || '',
      bankAccount: regForm.refundBank || '',
      address: regForm.residentRegisterAddress || '',
      hometaxId: regForm.hometaxId || '',
      hometaxPw: regForm.hometaxPw || '',
      facebookName: regForm.snsName || '',
      facebookURL: regForm.snsAddress || '',
      clientRank: regForm.customerGrade || '',
      recordFileDate: safeToISOString(regForm.greenContractDate),
      isAdditionalPayback: regForm.additionalApplyPerformance === '가',
      dependentsCount: Number(regForm.dependentsCount) || 0,
      seniorCount: Number(regForm.seniorCount) || 0,
      disabledCount: Number(regForm.disabledCount) || 0,
      childCount: Number(regForm.childCount) || 0,
      refund_performance: Number(regForm.refundPerformance) || 0,
      refund_performance_date: safeToISOString(regForm.refundPerformanceDate),
      fee_performance: Number(regForm.feeReceivedPerformance) || 0,
      fee_performance_date: safeToISOString(regForm.feeReceivedDate),
      companyAddress: regForm.companyAddress || '',
      companyPhone: regForm.companyPhone || '',
      companyIndustry: regForm.companyIndustry || '',
      updatedAt: new Date().toISOString(),

      // Mapped Supabase Columns
      visaExpireDate: safeToISOString(regForm.visaExpiry),
      paybackProgress: regForm.refundStatus || '◎경정상담중',
      taxReductionProgress: regForm.deductionSubmissionStatus || '◎제출이력없음',
      taxReductionApplyDateStart: safeToISOString(regForm.taxReductionApplyDateStart),
      taxReductionApplyDateEnd: safeToISOString(regForm.taxReductionApplyDateEnd),
      taxReductionSentDate: safeToISOString(regForm.deductionSentDate),
      rectificationRequestDate: safeToISOString(regForm.claimCompleteDate),
      additionalApplyDate: safeToISOString(regForm.claimRequestDate),
      feeMethod: regForm.feePaymentStatus || '후불 22%',
      hireDate: safeToISOString(regForm.residentAddress)
    };

    if (pdfFileObjects['familyDoc']) {
      const familyUrl = await uploadPdfToSupabase(pdfFileObjects['familyDoc'], `family_docs/${regForm.foreignerNumber || 'client'}_family_${Date.now()}.pdf`);
      if (familyUrl) clientPayload.familyDocUrl = familyUrl;
    }

    if (pdfFileObjects['remittanceDoc']) {
      const remitUrl = await uploadPdfToSupabase(pdfFileObjects['remittanceDoc'], `remittance_docs/${regForm.foreignerNumber || 'client'}_remittance_${Date.now()}.pdf`);
      if (remitUrl) clientPayload.remittanceDocUrl = remitUrl;
    }

    if (!isNewInsert) {
      const { error: updateErr } = await supabase.from('Client').update(clientPayload).eq('id', clientId);
      if (updateErr) {
        throw new Error(`Client Update Error: ${updateErr.message}`);
      }
    } else {
      const { data: newClient, error: insertErr } = await supabase
        .from('Client')
        .insert([{ ...clientPayload, id: clientId, createdAt: new Date().toISOString() }])
        .select()
        .single();

      if (insertErr) {
        throw new Error(`Client Insert Error: ${insertErr.message}`);
      } else if (newClient) {
        clientId = newClient.id;
        newClientSerial = newClient.serial;
      }
    }

    if (!clientId) {
      console.warn('Client ID could not be established; skipping YearEndData save');
      return { success: false, clientId: null };
    }

    const years = ['2022', '2023', '2024', '2025'];
    for (const yr of years) {
      const yrData = regForm.years[yr];
      const freelancerData = regForm.freelancerYears?.[yr];

      const hasWageData = yrData && (yrData.active || yrData.isFileUploaded);
      const hasFreelancerData = freelancerData && (freelancerData.active || freelancerData.isFileUploaded);

      if (!hasWageData && !hasFreelancerData) continue;

      let fileURL: string | undefined = undefined;
      const pdfFile = pdfFileObjects[yr];
      if (pdfFile) {
        const uploadPath = `${clientId}/${yr}.pdf`;
        const uploadedUrl = await uploadPdfToSupabase(pdfFile, uploadPath);
        if (uploadedUrl) {
          fileURL = uploadedUrl;
        }
      }

      let freelancerFileURL: string | undefined = undefined;
      const freelancerPdfFile = pdfFileObjects[`freelancer_${yr}`];
      if (freelancerPdfFile) {
        const uploadPath = `${clientId}/freelancer_${yr}.pdf`;
        const uploadedUrl = await uploadPdfToSupabase(freelancerPdfFile, uploadPath);
        if (uploadedUrl) {
          freelancerFileURL = uploadedUrl;
        }
      }

      let workPeriodStart: string | null = null;
      let workPeriodEnd: string | null = null;
      if (yrData && yrData.workPeriod && yrData.workPeriod.includes('~')) {
        const parts = yrData.workPeriod.split('~').map((s: string) => s.trim());
        if (parts[0]) workPeriodStart = parts[0];
        if (parts[1]) workPeriodEnd = parts[1];
      }

      const totalSal = yrData ? (Number(yrData.salaryTotal || yrData.totalSalary) || 0) : 0;
      const calcTax = yrData ? (Number(yrData.taxBase) || 0) : 0;
      const smallDed = yrData ? (Number(yrData.childReduction || yrData.appliedTaxReduction) || 0) : 0;
      const origTax = yrData ? (Number(yrData.decisionTax || yrData.originalDeterminedTax) || 0) : 0;
      const recalcDetTax = yrData ? (Number(yrData.decisionTaxApplyAmt || yrData.recalcDeterminedTax) || 0) : 0;
      const recalcLocTax = yrData ? (Number(yrData.localTaxApplyAmt || yrData.recalcLocalTax) || 0) : 0;
      const refNat = yrData ? (Number(yrData.refundExpectNational || yrData.expectedRefundNational) || 0) : 0;
      const refLoc = yrData ? (Number(yrData.refundExpectLocal || yrData.expectedRefundLocal) || 0) : 0;

      const yearPayload: Record<string, any> = {
        clientId: clientId,
        year: parseInt(yr, 10),
        companyName: yrData?.workPlace || '',
        companyRegNo: yrData?.businessNumber || yrData?.companyRegNum || '',
        netSalary: totalSal,
        netSalaryFromAllCompany: totalSal,
        determinedTax: origTax,
        smallBusinessDeduction: smallDed,
        calculatedTax: calcTax,
        determinedTaxRefund: refNat,
        totalTaxRefund: refNat,
        localTaxRefund: refLoc,
        changedDeterminedTax: recalcDetTax,
        changedLocalTax: recalcLocTax,
        changedTotalTax: recalcDetTax + recalcLocTax,
        regNum: regForm.foreignerNumber || yrData?.birthDate || '',
        isSmallBusinessDeduction: yrData ? (yrData.isReductionEligible === '여' || smallDed > 0) : false,
        ...(workPeriodStart ? { workPeriodStart } : {}),
        ...(workPeriodEnd ? { workPeriodEnd } : {}),
        ...(fileURL ? { fileURL } : {}),

        // Freelancer (3.3%) fields
        freelancerActive: freelancerData ? Boolean(freelancerData.active) : false,
        freelancerCompanyName: freelancerData?.workPlace || '',
        freelancerCompanyRegNo: freelancerData?.businessNumber || '',
        freelancerNetSalary: freelancerData ? (Number(freelancerData.totalIncome) || 0) : 0,
        freelancerDeterminedTax: freelancerData ? (Number(freelancerData.withholdingTax3) || 0) : 0,
        freelancerLocalTax: freelancerData ? (Number(freelancerData.localTax03) || 0) : 0,
        freelancerRefundExpectNational: freelancerData ? (Number(freelancerData.refundExpectNational) || 0) : 0,
        freelancerRefundExpectLocal: freelancerData ? (Number(freelancerData.refundExpectLocal) || 0) : 0,
        freelancerCourtFee: freelancerData ? (Number(freelancerData.courtFee) || 0) : 0,
        freelancerExpectedFeeAmt: freelancerData ? (Number(freelancerData.expectedFeeAmt) || 0) : 0,
        freelancerIncomeTypeCode: freelancerData?.incomeTypeCode || '3.3%',
        freelancerIsNonRefundable: freelancerData ? Boolean(freelancerData.isNonRefundable) : false,
        ...(freelancerFileURL ? { freelancerFileURL } : (freelancerData?.fileURL ? { freelancerFileURL: freelancerData.fileURL } : {}))
      };

      const { data: existingYr } = await supabase
        .from('YearEndData')
        .select('clientId, year')
        .eq('clientId', clientId)
        .eq('year', parseInt(yr, 10))
        .maybeSingle();

      if (existingYr) {
        const { error: yrUpdateErr } = await supabase
          .from('YearEndData')
          .update(yearPayload)
          .eq('clientId', clientId)
          .eq('year', parseInt(yr, 10));
        if (yrUpdateErr) {
          throw new Error(`YearEndData Update Error (${yr}): ${yrUpdateErr.message}`);
        }
      } else {
        const { error: yrInsertErr } = await supabase.from('YearEndData').insert([{ ...yearPayload, createdAt: new Date().toISOString() }]);
        if (yrInsertErr) {
          throw new Error(`YearEndData Insert Error (${yr}): ${yrInsertErr.message}`);
        }
      }
    }

    return { success: true, clientId, serial: newClientSerial || regForm.serial || null };
  } catch (err) {
    console.error('saveRegistrationToSupabase Exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch all Team records from Supabase
 */
export async function fetchTeamsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('Team')
      .select('*')
      .order('id', { ascending: false });
    if (error) {
      console.warn('Fetch teams error:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Fetch teams exception:', e);
    return [];
  }
}

/**
 * Fetch all Manager records from Supabase
 */
export async function fetchManagersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('Manager')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) {
      console.warn('Fetch managers error:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Fetch managers exception:', e);
    return [];
  }
}

/**
 * Create a new Team in Supabase
 */
export async function createTeamInSupabase(name: string) {
  try {
    const { data, error } = await supabase
      .from('Team')
      .insert([{ name, createdAt: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    console.error('Create team error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a Team from Supabase
 */
export async function deleteTeamInSupabase(id: number) {
  try {
    const { error } = await supabase.from('Team').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Delete team error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Update Manager's teamId in Supabase
 */
export async function updateManagerTeamInSupabase(managerId: string, teamId: number) {
  try {
    const { error } = await supabase.from('Manager').update({ teamId }).eq('id', managerId);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Update manager team error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Approve a Manager in Supabase
 */
export async function approveManagerInSupabase(managerId: string) {
  try {
    const { error } = await supabase.from('Manager').update({ isConfirmed: true }).eq('id', managerId);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Approve manager error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a Manager from Supabase
 */
export async function deleteManagerInSupabase(managerId: string) {
  try {
    const { error } = await supabase.from('Manager').delete().eq('id', managerId);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Delete manager error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Create a new Manager record in Supabase with extended fields
 */
export async function createManagerInSupabase(payload: {
  name: string;
  teamId: number;
  phone?: string;
  email?: string;
  address?: string;
  facebookMessenger?: string;
}) {
  try {
    // Generate random UUID for Manager ID since it's the primary key and doesn't have a default value in DB
    const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const { data, error } = await supabase
      .from('Manager')
      .insert([{
        id: newId,
        name: payload.name,
        teamId: payload.teamId,
        phone: payload.phone || '',
        email: payload.email || '',
        address: payload.address || '',
        facebookMessenger: payload.facebookMessenger || '',
        isAdmin: false,
        isConfirmed: true,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    console.error('Create manager error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete selected Client records from Supabase DB by serial list
 */
export async function deleteClientsFromSupabase(serials: number[]) {
  try {
    const { error } = await supabase
      .from('Client')
      .delete()
      .in('serial', serials);

    if (error) {
      console.warn('Delete by serial warning:', error.message);
    }
    return { success: true };
  } catch (e: any) {
    console.error('Delete clients error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Update Client managerId, teamId & country in Supabase DB
 */
export async function updateClientManagerInSupabase(serial: number, managerName: string, country: string) {
  try {
    const updatePayload: any = { country };

    // Resolve Manager ID from Manager table
    if (managerName) {
      const { data: mgrs } = await supabase.from('Manager').select('id, teamId, name');
      if (mgrs) {
        const found = mgrs.find(m => m.name && m.name.trim() === managerName.trim());
        if (found) {
          updatePayload.managerId = found.id;
          if (found.teamId) updatePayload.teamId = found.teamId;
        }
      }
    }

    // Resolve Team ID from Team table if not found from manager
    if (!updatePayload.teamId && country) {
      const { data: teams } = await supabase.from('Team').select('id, name');
      if (teams) {
        const found = teams.find(t => t.name && t.name.includes(country.replace('팀', '').trim()));
        if (found) {
          updatePayload.teamId = found.id;
        }
      }
    }

    const { error } = await supabase
      .from('Client')
      .update(updatePayload)
      .eq('serial', serial);

    if (error) {
      console.warn('Update manager by serial warning, trying fallback by id:', error.message);
      await supabase
        .from('Client')
        .update(updatePayload)
        .eq('id', serial);
    }
    return { success: true };
  } catch (e: any) {
    console.error('Update client manager error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Fetch a Client record by their unique ID/token for consent submission
 */
export async function fetchClientByConsentToken(token: string) {
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('id, name, regNum, country, phone, consentStatus')
      .eq('id', token)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error('fetchClientByConsentToken error:', e);
    return null;
  }
}

/**
 * Upload ARC image and signature base64 image to Supabase Storage, and update consent status to '제출완료'
 */
export async function updateClientConsent(
  clientId: string,
  arcFile: File | null,
  signatureBase64: string | null
) {
  try {
    const bucketName = 'novel_pdf';
    let arcImageUrl: string | null = null;
    let signatureImageUrl: string | null = null;

    // 1. Upload Alien Registration Card (ARC) image
    if (arcFile) {
      const arcPath = `arc_cards/${clientId}_${Date.now()}_arc.jpg`;
      const { error: arcUploadErr } = await supabase.storage
        .from(bucketName)
        .upload(arcPath, arcFile, { upsert: true });

      if (arcUploadErr) {
        throw new Error(`ARC upload failed: ${arcUploadErr.message}`);
      }
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(arcPath);
      arcImageUrl = publicUrlData.publicUrl;
    }

    // 2. Upload Signature image (converted from Base64 Data URL to Blob)
    if (signatureBase64 && signatureBase64.includes('data:image')) {
      const sigPath = `signatures/${clientId}_${Date.now()}_sig.png`;
      
      // Convert base64 data URL to Blob
      const parts = signatureBase64.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const sigBlob = new Blob([ab], { type: mime });

      const { error: sigUploadErr } = await supabase.storage
        .from(bucketName)
        .upload(sigPath, sigBlob, { upsert: true });

      if (sigUploadErr) {
        throw new Error(`Signature upload failed: ${sigUploadErr.message}`);
      }
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(sigPath);
      signatureImageUrl = publicUrlData.publicUrl;
    }

    // 3. Update Client database record
    const updatePayload: any = {
      consentStatus: '제출완료',
      updatedAt: new Date().toISOString()
    };
    if (arcImageUrl) updatePayload.arcImageUrl = arcImageUrl;
    if (signatureImageUrl) updatePayload.signatureImageUrl = signatureImageUrl;

    const { error: dbErr } = await supabase
      .from('Client')
      .update(updatePayload)
      .eq('id', clientId);

    if (dbErr) {
      throw new Error(`Database update failed: ${dbErr.message}`);
    }

    return { success: true };
  } catch (e: any) {
    console.error('updateClientConsent error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Bulk update consent status to '수임완료' by resident/foreigner registration numbers
 */
export async function bulkUpdateConsentStatusByRegNums(regNums: string[]) {
  try {
    if (regNums.length === 0) return { success: true, count: 0 };

    // Standardize registration numbers: remove dashes to compare robustly
    const cleanedRegNums = regNums.map(num => num.replace(/[^0-9]/g, ''));
    
    // Fetch matching clients first to update them properly
    const { data: clients, error: fetchErr } = await supabase
      .from('Client')
      .select('id, regNum');
      
    if (fetchErr) throw fetchErr;

    const matchedIds = (clients || [])
      .filter(c => {
        if (!c.regNum) return false;
        const cleaned = c.regNum.replace(/[^0-9]/g, '');
        // Match either fully cleaned or matching prefix (e.g. first 6 or 13 digits)
        return cleanedRegNums.some(num => cleaned.includes(num) || num.includes(cleaned));
      })
      .map(c => c.id);

    if (matchedIds.length === 0) {
      return { success: true, count: 0 };
    }

    const { error: updateErr } = await supabase
      .from('Client')
      .update({ consentStatus: '수임완료', updatedAt: new Date().toISOString() })
      .in('id', matchedIds);

    if (updateErr) throw updateErr;

    return { success: true, count: matchedIds.length };
  } catch (e: any) {
    console.error('bulkUpdateConsentStatusByRegNums error:', e);
    return { success: false, error: e.message };
  }
}
