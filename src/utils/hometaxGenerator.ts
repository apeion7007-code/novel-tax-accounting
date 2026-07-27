export interface SubmitterInfo {
  submitterType: string; // "1": 세무대리인, "2": 법인, "3": 개인
  taxOfficeCode: string; // 세무서코드 (3자)
  agentNum: string; // 세무대리인 관리번호 (6자)
  hometaxId: string; // 홈택스 ID (20자)
  bizNum: string; // 사업자등록번호 (10자)
  companyName: string; // 상호 (60자)
  deptName: string; // 담당부서 (30자)
  managerName: string; // 담당자명 (30자)
  managerPhone: string; // 담당자 연락처 (15자)
  targetYear: string; // 귀속연도 (4자)
}

// 2,350 KS X 1001 Hangul syllables in EUC-KR order
const EUC_KR_HANGUL = "가각간갇갈갉갊감갑값갓갔강갖갗같갚갛개객갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납낫났낭낮낯낱낳내낵낸낼냄냅냇냈냉냐냑냔냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝뇟뇨뇩뇬뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫달닭닮닯닳담답닷닸당닺닻닿대댁댄댈댐댑댓댔댕댜더덕덖던덛덜덞덟덤덥덧덩덫덮데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪따딱딴딸땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗래랙랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅릇릉릊릍릎리릭린릴림립릿링마막만많맏말맑맒맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못몽뫄뫈뫘뫙뫼묀묄묍묏묑묘묜묠묩묫무묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍및밑바박밖밗반받발밝밞밟밤밥밧방밭배백밴밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟비빅빈빌빎빔빕빗빙빚빛빠빡빤빨빪빰빱빳빴빵빻빼빽뺀뺄뺌뺍뺏뺐뺑뺘뺙뺨뻐뻑뻔뻗뻘뻠뻣뻤뻥뻬뼁뼈뼉뼘뼙뼛뼜뼝뽀뽁뽄뽈뽐뽑뽕뾔뾰뿅뿌뿍뿐뿔뿜뿟뿡쀼쁑쁘쁜쁠쁨쁩삐삑삔삘삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅새색샌샐샘샙샛샜생샤샥샨샬샴샵샷샹섀섄섈섐섕서석섞섟선섣설섦섧섬섭섯섰성섶세섹센셀셈셉셋셌셍셔셕션셜셤셥셧셨셩셰셴셸솅소속솎손솔솖솜솝솟송솥솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠쇤쇨쇰쇱쇳쇼쇽숀숄숌숍숏숑수숙순숟술숨숩숫숭숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿슁슈슉슐슘슛슝스슥슨슬슭슴습슷승시식신싣실싫심십싯싱싶싸싹싻싼쌀쌈쌉쌌쌍쌓쌔쌕쌘쌜쌤쌥쌨쌩썅써썩썬썰썲썸썹썼썽쎄쎈쎌쏀쏘쏙쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쐈쐐쐤쐬쐰쐴쐼쐽쑈쑤쑥쑨쑬쑴쑵쑹쒀쒔쒜쒸쒼쓩쓰쓱쓴쓸쓺쓿씀씁씌씐씔씜씨씩씬씰씸씹씻씽아악안앉않알앍앎앓암압앗았앙앝앞애액앤앨앰앱앳앴앵야약얀얄얇얌얍얏양얕얗얘얜얠얩어억언얹얻얼얽얾엄업없엇었엉엊엌엎에엑엔엘엠엡엣엥여역엮연열엶엷염엽엾엿였영옅옆옇예옌옐옘옙옛옜오옥온올옭옮옰옳옴옵옷옹옻와왁완왈왐왑왓왔왕왜왝왠왬왯왱외왹왼욀욈욉욋욍요욕욘욜욤욥욧용우욱운울욹욺움웁웃웅워웍원월웜웝웠웡웨웩웬웰웸웹웽위윅윈윌윔윕윗윙유육윤율윰윱윳융윷으윽은을읊음읍읏응읒읓읔읕읖읗의읜읠읨읫이익인일읽읾잃임입잇있잉잊잎자작잔잖잗잘잚잠잡잣잤장잦재잭잰잴잼잽잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬저적전절젊점접젓정젖제젝젠젤젬젭젯젱져젼졀졈졉졌졍졔조족존졸졺좀좁좃종좆좇좋좌좍좔좝좟좡좨좼좽죄죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥰쥴쥼즈즉즌즐즘즙즛증지직진짇질짊짐집짓징짖짙짚짜짝짠짢짤짧짬짭짯짰짱째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨩쩌쩍쩐쩔쩜쩝쩟쩠쩡쩨쩽쪄쪘쪼쪽쫀쫄쫌쫍쫏쫑쫓쫘쫙쫠쫬쫴쬈쬐쬔쬘쬠쬡쭁쭈쭉쭌쭐쭘쭙쭝쭤쭸쭹쮜쮸쯔쯤쯧쯩찌찍찐찔찜찝찡찢찧차착찬찮찰참찹찻찼창찾채책챈챌챔챕챗챘챙챠챤챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇쳉쳐쳔쳤쳬쳰촁초촉촌촐촘촙촛총촤촨촬촹최쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췐취췬췰췸췹췻췽츄츈츌츔츙츠측츤츨츰츱츳층치칙친칟칠칡침칩칫칭카칵칸칼캄캅캇캉캐캑캔캘캠캡캣캤캥캬캭컁커컥컨컫컬컴컵컷컸컹케켁켄켈켐켑켓켕켜켠켤켬켭켯켰켱켸코콕콘콜콤콥콧콩콰콱콴콸쾀쾅쾌쾡쾨쾰쿄쿠쿡쿤쿨쿰쿱쿳쿵쿼퀀퀄퀑퀘퀭퀴퀵퀸퀼큄큅큇큉큐큔큘큠크큭큰클큼큽킁키킥킨킬킴킵킷킹타탁탄탈탉탐탑탓탔탕태택탠탤탬탭탯탰탱탸턍터턱턴털턺텀텁텃텄텅테텍텐텔템텝텟텡텨텬텼톄톈토톡톤톨톰톱톳통톺톼퇀퇘퇴퇸툇툉툐투툭툰툴툼툽툿퉁퉈퉜퉤튀튁튄튈튐튑튕튜튠튤튬튱트특튼튿틀틂틈틉틋틔틘틜틤틥티틱틴틸팀팁팃팅파팍팎판팔팖팜팝팟팠팡팥패팩팬팰팸팹팻팼팽퍄퍅퍼퍽펀펄펌펍펏펐펑페펙펜펠펨펩펫펭펴편펼폄폅폈평폐폘폡폣포폭폰폴폼폽폿퐁퐈퐝푀푄표푠푤푭푯푸푹푼푿풀풂품풉풋풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗피픽핀필핌핍핏핑하학한할핥함합핫항해핵핸핼햄햅햇했행햐향허헉헌헐헒험헙헛헝헤헥헨헬헴헵헷헹혀혁현혈혐협혓혔형혜혠혤혭호혹혼홀홅홈홉홋홍홑화확환활홧황홰홱홴횃횅회획횐횔횝횟횡효횬횰횹횻후훅훈훌훑훔훗훙훠훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸휼흄흇흉흐흑흔흖흗흘흙흠흡흣흥흩희흰흴흼흽힁히힉힌힐힘힙힛힝";

/**
 * Encodes a JavaScript UTF-16 string into a CP949 (EUC-KR) byte array (Uint8Array)
 */
export function encodeEucKr(str: string): Uint8Array {
  const result: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    if (code < 128) {
      // ASCII character (1 byte)
      result.push(code);
    } else {
      const idx = EUC_KR_HANGUL.indexOf(char);
      if (idx !== -1) {
        // EUC-KR 2-byte Hangul Syllable
        const row = Math.floor(idx / 94);
        const col = idx % 94;
        result.push(0xB0 + row);
        result.push(0xA1 + col);
      } else {
        // Fallback for non-EUC-KR characters
        result.push(0x3F); // '?'
      }
    }
  }
  return new Uint8Array(result);
}

/**
 * Pads a string to a specific length in bytes (CP949) using trailing spaces
 */
export function padStringBytes(str: string, length: number): Uint8Array {
  const cleanStr = String(str || '').replace(/[\r\n]/g, ' ').trim();
  const bytes = encodeEucKr(cleanStr);
  if (bytes.length === length) {
    return bytes;
  }
  const padded = new Uint8Array(length);
  if (bytes.length > length) {
    padded.set(bytes.subarray(0, length));
  } else {
    padded.set(bytes);
    // Pad with ASCII space (0x20)
    for (let i = bytes.length; i < length; i++) {
      padded[i] = 0x20;
    }
  }
  return padded;
}

/**
 * Pads a number or string to a specific length in bytes (CP949) using leading zeros
 */
export function padNumberBytes(val: number | string | null | undefined, length: number): Uint8Array {
  const cleanVal = String(val === null || val === undefined ? 0 : val).replace(/,/g, '').trim();
  const bytes = encodeEucKr(cleanVal);
  if (bytes.length === length) {
    return bytes;
  }
  const padded = new Uint8Array(length);
  if (bytes.length > length) {
    padded.set(bytes.subarray(bytes.length - length));
  } else {
    const padCount = length - bytes.length;
    for (let i = 0; i < padCount; i++) {
      padded[i] = 0x30; // '0'
    }
    padded.set(bytes, padCount);
  }
  return padded;
}

/**
 * Generates a valid RRN (Resident Registration Number) checksum based on NTS guidelines.
 */
export function generateValidRrn(birthDate6: string, genderDigit: string): string {
  const cleanBirth = String(birthDate6 || '800101').replace(/-/g, '').slice(0, 6).padEnd(6, '0');
  const base = cleanBirth + genderDigit + '00001';
  let sum = 0;
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  for (let i = 0; i < 12; i++) {
    sum += Number(base[i]) * weights[i];
  }
  const checksum = (11 - (sum % 11)) % 10;
  return base + String(checksum);
}

/**
 * Generates the National Tax Service Electronic Media File content (.txt)
 */
export function generateHometaxFile(submitter: SubmitterInfo, clients: any[]): Blob {
  const records: Uint8Array[] = [];
  const targetYr = submitter.targetYear || '2025';

  // 1. Build A-record (Submitter)
  const aRec = new Uint8Array(2010);
  // Default to spaces
  for (let i = 0; i < aRec.length; i++) aRec[i] = 0x20;

  // A-record fields
  aRec.set(encodeEucKr('A'), 0); // A1 (1)
  aRec.set(padNumberBytes('20', 2), 1); // A2 (2)
  aRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // A3 (3)
  aRec.set(padNumberBytes(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 8), 6); // A4 (8)
  aRec.set(padNumberBytes(submitter.submitterType, 1), 14); // A5 (1)
  aRec.set(padStringBytes(submitter.submitterType === '1' ? submitter.agentNum : '', 6), 15); // A6 (6)
  aRec.set(padStringBytes(submitter.hometaxId, 20), 21); // A7 (20)
  aRec.set(padStringBytes('9000', 4), 41); // A8 (4)
  aRec.set(padStringBytes(submitter.bizNum, 10), 45); // A9 (10)
  aRec.set(padStringBytes(submitter.companyName, 60), 55); // A10 (60)
  aRec.set(padStringBytes(submitter.deptName, 30), 115); // A11 (30)
  aRec.set(padStringBytes(submitter.managerName, 30), 145); // A12 (30)
  aRec.set(padStringBytes(submitter.managerPhone, 15), 175); // A13 (15)
  aRec.set(padStringBytes(targetYr, 4), 190); // A14 (4)
  
  // Group clients by their company registration number (businessNumber)
  const companyGroups: Record<string, any[]> = {};
  clients.forEach(c => {
    const yrData = c.years?.[targetYr];
    const bizNo = (yrData?.businessNumber || yrData?.companyRegNum || '0000000000').replace(/-/g, '').trim();
    if (!companyGroups[bizNo]) {
      companyGroups[bizNo] = [];
    }
    companyGroups[bizNo].push(c);
  });

  const numCompanies = Object.keys(companyGroups).length;
  aRec.set(padNumberBytes(numCompanies, 5), 194); // A15 (5) - Number of B-records
  aRec.set(padNumberBytes('101', 3), 199); // A16 (3) - Hangeul code CP949

  records.push(aRec);

  // 2. Build B & C records for each company group
  let bSequence = 1;
  for (const [bizNo, group] of Object.entries(companyGroups)) {
    const firstClient = group[0];
    const yrData = firstClient.years?.[targetYr];
    const compName = yrData?.workPlace || '';

    // Calculate B-record aggregate sums
    let totalSalarySum = 0;
    let recalcDeterminedTaxSum = 0;
    let recalcLocalTaxSum = 0;

    group.forEach(c => {
      const cyData = c.years?.[targetYr];
      totalSalarySum += Number(cyData?.salaryTotal || cyData?.totalSalary || 0);
      recalcDeterminedTaxSum += Number(cyData?.decisionTaxApplyAmt || cyData?.recalcDeterminedTax || 0);
      recalcLocalTaxSum += Number(cyData?.localTaxApplyAmt || cyData?.recalcLocalTax || 0);
    });

    const bRec = new Uint8Array(2010);
    for (let i = 0; i < bRec.length; i++) bRec[i] = 0x20;

    bRec.set(encodeEucKr('B'), 0); // B1 (1)
    bRec.set(padNumberBytes('20', 2), 1); // B2 (2)
    bRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // B3 (3)
    bRec.set(padNumberBytes(bSequence++, 6), 6); // B4 (6)
    bRec.set(padStringBytes(bizNo, 10), 12); // B5 (10)
    bRec.set(padStringBytes(compName, 60), 22); // B6 (60)
    bRec.set(padStringBytes('', 30), 82); // B7 (30) - Representative Name (Default spaces)
    bRec.set(padStringBytes('', 13), 112); // B8 (13) - Representative RRN (Default spaces)
    bRec.set(padStringBytes(targetYr, 4), 125); // B9 (4)
    bRec.set(padNumberBytes(group.length, 7), 129); // B10 (7) - Number of C-records
    bRec.set(padNumberBytes(0, 7), 136); // B11 (7) - Number of D-records (Default 0)
    bRec.set(padNumberBytes(totalSalarySum, 14), 143); // B12 (14) - Total Salary Sum
    bRec.set(padNumberBytes(recalcDeterminedTaxSum, 13), 157); // B13 (13) - Total Recalc Determind Tax (National)
    bRec.set(padNumberBytes(recalcLocalTaxSum, 13), 170); // B14 (13) - Total Recalc Determind Tax (Local)
    bRec.set(padNumberBytes(0, 13), 183); // B15 (13) - Total Rural Tax (Default 0)
    bRec.set(padNumberBytes(recalcDeterminedTaxSum + recalcLocalTaxSum, 13), 196); // B16 (13) - Total Determined Tax
    bRec.set(padNumberBytes(1, 1), 209); // B17 (1) - Submission code (1: 연간합산)

    records.push(bRec);

    // Build C-record for each client in the company group
    let cSequence = 1;
    group.forEach(c => {
      const cyData = c.years?.[targetYr];
      const salary = Number(cyData?.salaryTotal || cyData?.totalSalary || 0);
      const calculatedTax = Number(cyData?.taxBase || 0);
      const taxReduction = Number(cyData?.childReduction || cyData?.appliedTaxReduction || 0);
      const recalcDetermined = Number(cyData?.decisionTaxApplyAmt || cyData?.recalcDeterminedTax || 0);
      const recalcLocal = Number(cyData?.localTaxApplyAmt || cyData?.recalcLocalTax || 0);
      const originalDetermined = Number(cyData?.decisionTax || cyData?.originalDeterminedTax || 0);
      const originalLocal = Math.floor(originalDetermined * 0.1);

      // Recalculate difference (refund expected is original - recalc)
      const diffNational = recalcDetermined - originalDetermined; // E.g. 100,000 - 250,000 = -150,000
      const diffLocal = recalcLocal - originalLocal;

      const cRec = new Uint8Array(2010);
      // Initialize with spaces
      for (let i = 0; i < cRec.length; i++) cRec[i] = 0x20;

      // Initialize all numeric fields from position 196 to 1953 with zeros
      const numericFields = [
        { offset: 22, length: 2 },  // C6
        { offset: 24, length: 1 },  // C7
        { offset: 27, length: 1 },  // C9
        { offset: 59, length: 1 },  // C12
        { offset: 153, length: 8 }, // C22
        { offset: 161, length: 8 }, // C23
        { offset: 169, length: 8 }, // C24
        { offset: 177, length: 8 }, // C25
        { offset: 185, length: 11 }, // C26
        { offset: 196, length: 11 }, // C27
        { offset: 207, length: 11 }, // C28
        { offset: 218, length: 11 }, // C29
        { offset: 745, length: 10 }, // C74
        { offset: 765, length: 11 }, // C76
        { offset: 1282, length: 11 }, // C116
        { offset: 1343, length: 10 }, // C122
        { offset: 1813, length: 10 }, // C150
        { offset: 1823, length: 11 }, // C151a
        { offset: 1834, length: 10 }, // C151b
        { offset: 1844, length: 10 }, // C151c
        { offset: 1854, length: 3 },  // C152
        { offset: 1857, length: 11 }, // C153a
        { offset: 1868, length: 10 }, // C153b
        { offset: 1878, length: 10 }, // C153c
        { offset: 1888, length: 11 }, // C154a
        { offset: 1899, length: 10 }, // C154b
        { offset: 1909, length: 10 }, // C154c
        { offset: 1919, length: 1 },  // C155a sign
        { offset: 1920, length: 11 }, // C155a amount
        { offset: 1931, length: 1 },  // C155b sign
        { offset: 1932, length: 10 }, // C155b amount
        { offset: 1942, length: 1 },  // C155c sign
        { offset: 1943, length: 10 }  // C155c amount
      ];

      numericFields.forEach(f => {
        for (let i = 0; i < f.length; i++) {
          cRec[f.offset + i] = 0x30; // '0'
        }
      });

      // Map Client Country to NTS Code
      let countryCode = 'VN';
      const nat = c.nationality || '';
      if (nat.includes('베트남')) countryCode = 'VN';
      else if (nat.includes('인도네시아')) countryCode = 'ID';
      else if (nat.includes('몽골')) countryCode = 'MN';
      else if (nat.includes('미얀마')) countryCode = 'MM';
      else if (nat.includes('캄보디아')) countryCode = 'KH';
      else if (nat.includes('네팔')) countryCode = 'NP';
      else if (nat.includes('태국')) countryCode = 'TH';
      else if (nat.includes('중국')) countryCode = 'CN';

      // C-record details
      cRec.set(encodeEucKr('C'), 0); // C1 (1)
      cRec.set(padNumberBytes('20', 2), 1); // C2 (2)
      cRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // C3 (3)
      cRec.set(padNumberBytes(cSequence++, 6), 6); // C4 (6)
      cRec.set(padStringBytes(bizNo, 10), 12); // C5 (10)
      cRec.set(padNumberBytes(0, 2), 22); // C6 (2)
      cRec.set(padNumberBytes(1, 1), 24); // C7 (1) - 1:거주자
      cRec.set(padStringBytes('', 2), 25); // C8 (2)
      cRec.set(padNumberBytes(2, 1), 27); // C9 (1) - 2:외국인 단일세율 미적용
      cRec.set(padNumberBytes(2, 1), 28); // C10 (1) - 2:파견근로자 아님
      cRec.set(padStringBytes(c.name, 30), 29); // C11 (30) - Name
      cRec.set(padNumberBytes(9, 1), 59); // C12 (1) - 9:외국인
      const cleanClientRrn = String(c.regNum || c.foreignerNumber || '').replace(/-/g, '').trim();
      cRec.set(padStringBytes(cleanClientRrn, 13), 60); // C13 (13)
      cRec.set(padStringBytes(countryCode, 2), 73); // C14 (2)
      cRec.set(padNumberBytes(2, 1), 75); // C15 (1) - 세대원
      cRec.set(padNumberBytes(1, 1), 76); // C16 (1) - 계속근로
      cRec.set(padNumberBytes(2, 1), 77); // C17 (1) - 사업자단위과세 아님
      cRec.set(padStringBytes('', 4), 78); // C18 (4)
      cRec.set(padNumberBytes(2, 1), 82); // C19 (1) - 종교 종사자 아님
      cRec.set(padStringBytes(bizNo, 10), 83); // C20 (10)
      cRec.set(padStringBytes(compName, 60), 93); // C21 (60)
      cRec.set(padNumberBytes(targetYr + '0101', 8), 153); // C22 (8)
      cRec.set(padNumberBytes(targetYr + '1231', 8), 161); // C23 (8)
      cRec.set(padNumberBytes(0, 8), 169); // C24 (8) - 감면 시작일 (Default 0)
      cRec.set(padNumberBytes(0, 8), 177); // C25 (8) - 감면 종료일 (Default 0)
      
      cRec.set(padNumberBytes(salary, 11), 185); // C26 (11) - 급여
      cRec.set(padNumberBytes(0, 11), 196); // C27 (11) - 상여 (Default 0)
      cRec.set(padNumberBytes(0, 11), 207); // C28 (11)
      cRec.set(padNumberBytes(0, 11), 218); // C29 (11)
      
      cRec.set(padNumberBytes(taxReduction > 0 ? salary : 0, 10), 745); // C74 - 감면 소득 계
      cRec.set(padNumberBytes(salary, 11), 765); // C76 - 총급여
      
      cRec.set(padNumberBytes(calculatedTax, 11), 1282); // C116 - 산출세액
      cRec.set(padNumberBytes(taxReduction, 10), 1343); // C122 - 세액감면계

      cRec.set(padNumberBytes(0, 10), 1813); // C150 - 세액공제계 (Default 0)
      cRec.set(padNumberBytes(recalcDetermined, 11), 1823); // C151a - 결정세액 소득세
      cRec.set(padNumberBytes(recalcLocal, 10), 1834); // C151b - 결정세액 지방소득세
      cRec.set(padNumberBytes(0, 10), 1844); // C151c - 결정세액 농특세 (Default 0)

      // Calculate effective tax rate: (recalcDetermined / salary) * 100
      let effRate = 0;
      if (salary > 0) {
        effRate = Math.round((recalcDetermined / salary) * 1000); // E.g., 2.45% -> 0.0245 * 1000 = 25 -> 2.5%
      }
      cRec.set(padNumberBytes(Math.min(effRate, 999), 3), 1854); // C152 - 실효세율

      cRec.set(padNumberBytes(originalDetermined, 11), 1857); // C153a - 기납부 소득세
      cRec.set(padNumberBytes(originalLocal, 10), 1868); // C153b - 기납부 지방소득세
      cRec.set(padNumberBytes(0, 10), 1878); // C153c - 기납부 농특세 (Default 0)

      cRec.set(padNumberBytes(0, 11), 1888); // C154a
      cRec.set(padNumberBytes(0, 10), 1899); // C154b
      cRec.set(padNumberBytes(0, 10), 1909); // C154c

      // C155a Difference (National)
      const signNat = diffNational >= 0 ? '0' : '1';
      cRec.set(encodeEucKr(signNat), 1919);
      cRec.set(padNumberBytes(Math.floor(Math.abs(diffNational) / 10) * 10, 11), 1920);

      // C155b Difference (Local)
      const signLoc = diffLocal >= 0 ? '0' : '1';
      cRec.set(encodeEucKr(signLoc), 1931);
      cRec.set(padNumberBytes(Math.floor(Math.abs(diffLocal) / 10) * 10, 10), 1932);

      // C155c Difference (Rural tax)
      cRec.set(encodeEucKr('0'), 1942);
      cRec.set(padNumberBytes(0, 10), 1943);

      records.push(cRec);

      // Generate E records (Dependents)
      const eRecs = generateERecords(submitter, c, cSequence - 1);
      eRecs.forEach(eRec => {
        records.push(eRec);
      });

      // Generate G record (Monthly Rent) if eligible
      const hasRent = (c.isMonthlyRent === '가' || c.isMonthlyRent === 'true' || c.isMonthlyRent === true || Number(c.monthlyRentFee) > 0);
      const rentExpectNational = cyData ? Number(cyData.rentRefundExpectNational) : 0;
      if (hasRent && rentExpectNational > 0) {
        const gRec = generateGRecord(submitter, c, cSequence - 1, cyData);
        records.push(gRec);
      }
    });
  }

  // 3. Assemble all records separated by CRLF
  const totalLength = records.length * 2012;
  const fileBytes = new Uint8Array(totalLength);
  let offset = 0;
  records.forEach(rec => {
    fileBytes.set(rec, offset);
    fileBytes[offset + 2010] = 0x0D; // CR
    fileBytes[offset + 2011] = 0x0A; // LF
    offset += 2012;
  });

  return new Blob([fileBytes], { type: 'text/plain;charset=cp949' });
}

/**
 * Generates E-records (Dependents Deduction) dynamically based on client counts.
 */
export function generateERecords(submitter: SubmitterInfo, client: any, cSeq: number): Uint8Array[] {
  const eRecords: Uint8Array[] = [];

  const dependentsList: any[] = [];
  
  // 1. Employee Self
  const isForeignerNum = (client.nationality && !client.nationality.includes('대한민국')) ? '9' : '1';
  dependentsList.push({
    relation: '0', // 본인
    isForeign: isForeignerNum,
    name: client.name || '',
    rrn: String(client.regNum || '').replace(/-/g, '').trim(),
    isBasic: '1',
    isSenior: ' ',
    isDisabled: ' ',
    isChild: ' ',
    isFemale: ' ',
    isSingleParent: ' '
  });

  const depCount = Number(client.dependentsCount) || 0;
  const senCount = Number(client.seniorCount) || 0;
  const disCount = Number(client.disabledCount) || 0;
  const chCount = Number(client.childCount) || 0;

  const totalUniqueDeps = Math.max(depCount, senCount, disCount, chCount);

  for (let i = 0; i < totalUniqueDeps; i++) {
    let birth = '850101';
    let gender = '5';
    let rel = '5'; 

    if (i < senCount) {
      birth = '500101';
      gender = '7'; 
      rel = '1'; 
    } else if (i >= (senCount + disCount) && i < (senCount + disCount + chCount)) {
      birth = '150101';
      gender = '8'; 
      rel = '4'; 
    } else if (i >= senCount && i < (senCount + disCount)) {
      birth = '800101';
      gender = '5'; 
      rel = '5';
    }

    const rrn = generateValidRrn(birth, gender);

    dependentsList.push({
      relation: rel,
      isForeign: '9',
      name: `DEPENDENT ${i + 1}`,
      rrn: rrn,
      isBasic: (i < depCount || i < (senCount + disCount + chCount)) ? '1' : ' ',
      isSenior: i < senCount ? '1' : ' ',
      isDisabled: (i >= senCount && i < (senCount + disCount)) ? '1' : ' ',
      isChild: (i >= (senCount + disCount) && i < (senCount + disCount + chCount)) ? '1' : ' ',
      isFemale: ' ',
      isSingleParent: ' '
    });
  }

  const chunks: any[][] = [];
  for (let i = 0; i < dependentsList.length; i += 3) {
    chunks.push(dependentsList.slice(i, i + 3));
  }

  let eSeq = 1;
  chunks.forEach(chunk => {
    const rec = new Uint8Array(2010);
    for (let i = 0; i < rec.length; i++) rec[i] = 0x20;

    const fillZeros = (start: number, end: number) => {
      for (let i = start; i < end; i++) rec[i] = 0x30;
    };
    fillZeros(90, 507);
    fillZeros(562, 979);
    fillZeros(1034, 1451);

    rec.set(encodeEucKr('E'), 0); // E1 (1)
    rec.set(padNumberBytes('20', 2), 1); // E2 (2)
    rec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // E3 (3)
    rec.set(padNumberBytes(cSeq, 6), 6); // E4 (6)
    rec.set(padStringBytes(client.companyRegNum || client.businessNumber || '0000000000', 10), 12); // E5 (10)
    rec.set(padStringBytes(String(client.regNum || '').replace(/-/g, '').trim(), 13), 22); // E6 (13)

    for (let j = 0; j < 3; j++) {
      const dep = chunk[j];
      if (!dep) continue;

      let detailOffset = 0;
      if (j === 0) detailOffset = 35;
      else if (j === 1) detailOffset = 507;
      else if (j === 2) detailOffset = 979;

      rec.set(encodeEucKr(dep.relation), detailOffset); 
      rec.set(encodeEucKr(dep.isForeign), detailOffset + 1); 
      rec.set(padStringBytes(dep.name, 30), detailOffset + 2); 
      rec.set(padStringBytes(dep.rrn, 13), detailOffset + 32); 
      rec.set(encodeEucKr(dep.isBasic), detailOffset + 45); 
      rec.set(encodeEucKr(dep.isDisabled), detailOffset + 46); 
      rec.set(encodeEucKr(dep.isFemale), detailOffset + 47); 
      rec.set(encodeEucKr(dep.isSenior), detailOffset + 48); 
      rec.set(encodeEucKr(dep.isSingleParent), detailOffset + 49); 
      rec.set(encodeEucKr(dep.isChild), detailOffset + 50); 
      rec.set(encodeEucKr(dep.isChild), detailOffset + 51); 
    }

    rec.set(padNumberBytes(eSeq++, 2), 1451); // E172 일련번호
    eRecords.push(rec);
  });

  return eRecords;
}

/**
 * Generates G-record (Monthly Rent Deduction) for NTS file.
 */
export function generateGRecord(submitter: SubmitterInfo, client: any, cSeq: number, yrRent: any): Uint8Array {
  const rec = new Uint8Array(2010);
  for (let i = 0; i < rec.length; i++) rec[i] = 0x20;

  const fillZeros = (start: number, end: number) => {
    for (let i = start; i < end; i++) rec[i] = 0x30;
  };

  fillZeros(282, 302);
  fillZeros(391, 435);
  fillZeros(509, 514);
  fillZeros(664, 690);
  fillZeros(764, 769);
  fillZeros(919, 955);
  fillZeros(1044, 1088);
  fillZeros(1162, 1167);
  fillZeros(1317, 1343);
  fillZeros(1417, 1422);
  fillZeros(1572, 1608);
  fillZeros(1697, 1741);
  fillZeros(1815, 1820);
  fillZeros(1970, 1996);

  rec.set(encodeEucKr('G'), 0); // G1 (1)
  rec.set(padNumberBytes('20', 2), 1); // G2 (2)
  rec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // G3 (3)
  rec.set(padNumberBytes(cSeq, 6), 6); // G4 (6)
  rec.set(padStringBytes(client.companyRegNum || client.businessNumber || '0000000000', 10), 12); // G5 (10)
  rec.set(padStringBytes(String(client.regNum || '').replace(/-/g, '').trim(), 13), 22); // G6 (13)
  rec.set(encodeEucKr('01'), 35); // G7 무주택자해당여부 ('01': 여)

  const lName = client.landlordName || '';
  const lRegNum = (client.landlordRegNum || '').replace(/-/g, '').trim();
  const rentType = client.rentHousingType || '오피스텔';
  let typeCode = '6'; 
  if (rentType.includes('단독')) typeCode = '1';
  else if (rentType.includes('다가구')) typeCode = '2';
  else if (rentType.includes('다세대')) typeCode = '3';
  else if (rentType.includes('연립')) typeCode = '4';
  else if (rentType.includes('아파트')) typeCode = '5';
  else if (rentType.includes('오피스텔')) typeCode = '6';
  else if (rentType.includes('고시원')) typeCode = '7';
  else if (rentType.includes('기타')) typeCode = '8';

  let areaVal = '00000';
  const sizeNum = Number(client.rentHousingSize) || 0;
  if (sizeNum > 0) {
    const parts = sizeNum.toFixed(2).split('.');
    const integerPart = parts[0].padStart(3, '0');
    const decimalPart = parts[1].padEnd(2, '0');
    areaVal = integerPart + decimalPart;
  }

  const rentAddr = client.residentRegisterAddress || client.address || '';
  const startD = (client.rentLeaseStart || '').replace(/-/g, '').trim();
  const endD = (client.rentLeaseEnd || '').replace(/-/g, '').trim();
  
  const annualRentAmt = Number(client.monthlyRentFee || 0) * 12;
  const taxCreditAmt = Number(yrRent.rentRefundExpectNational || 0);

  rec.set(padStringBytes(lName, 60), 37); // G8 임대인성명
  rec.set(padStringBytes(lRegNum, 13), 97); // G9 임대인주민번호
  rec.set(encodeEucKr(typeCode), 110); // G10 유형
  rec.set(padNumberBytes(areaVal, 5), 111); // G11 임차면적
  rec.set(padStringBytes(rentAddr, 150), 116); // G12 임대차주소
  rec.set(padNumberBytes(startD, 8), 266); // G13 임대차개시일
  rec.set(padNumberBytes(endD, 8), 274); // G14 임대차종료일
  rec.set(padNumberBytes(annualRentAmt, 10), 282); // G15 연간월세액
  rec.set(padNumberBytes(taxCreditAmt, 10), 292); // G16 세액공제금액

  rec.set(padNumberBytes('01', 2), 1996); // G86 일련번호
  
  return rec;
}

/**
 * Generates the National Tax Service Resident Business Income (Freelancer 3.3%) Electronic Media File content (.txt - 190 bytes layout)
 */
export function generateFreelancerHometaxFile(submitter: SubmitterInfo, clients: any[]): Blob {
  const records: Uint8Array[] = [];
  const targetYr = submitter.targetYear || '2025';

  // 1. Build A-record
  const aRec = new Uint8Array(190);
  for (let i = 0; i < aRec.length; i++) aRec[i] = 0x20;

  aRec.set(encodeEucKr('A'), 0); // A1 (1)
  aRec.set(padNumberBytes('24', 2), 1); // A2 (2)
  aRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // A3 (3)
  aRec.set(padNumberBytes(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 8), 6); // A4 (8)
  aRec.set(padNumberBytes(submitter.submitterType, 1), 14); // A5 (1)
  aRec.set(padStringBytes(submitter.submitterType === '1' ? submitter.agentNum : '', 6), 15); // A6 (6)
  aRec.set(padStringBytes(submitter.hometaxId, 20), 21); // A7 (20)
  aRec.set(padStringBytes('9000', 4), 41); // A8 (4)
  aRec.set(padStringBytes(submitter.bizNum, 10), 45); // A9 (10)
  aRec.set(padStringBytes(submitter.companyName, 30), 55); // A10 (30)
  aRec.set(padStringBytes(submitter.deptName, 30), 85); // A11 (30)
  aRec.set(padStringBytes(submitter.managerName, 30), 115); // A12 (30)
  aRec.set(padStringBytes(submitter.managerPhone, 15), 145); // A13 (15)

  const companyGroups: Record<string, any[]> = {};
  clients.forEach(c => {
    const yrData = c.freelancerYears?.[targetYr];
    const bizNo = (yrData?.businessNumber || '0000000000').replace(/-/g, '').trim();
    if (!companyGroups[bizNo]) {
      companyGroups[bizNo] = [];
    }
    companyGroups[bizNo].push(c);
  });

  const numCompanies = Object.keys(companyGroups).length;
  aRec.set(padNumberBytes(numCompanies, 5), 160); // A14 (5)

  records.push(aRec);

  // 2. Build B & C records for each company group
  let bSequence = 1;
  for (const [bizNo, group] of Object.entries(companyGroups)) {
    const firstClient = group[0];
    const yrData = firstClient.freelancerYears?.[targetYr];
    const compName = yrData?.workPlace || '';

    let totalIncomeSum = 0;
    let totalIncomeTaxSum = 0;
    let totalLocalTaxSum = 0;

    group.forEach(c => {
      const cyData = c.freelancerYears?.[targetYr];
      totalIncomeSum += Number(cyData?.totalIncome || 0);
      totalIncomeTaxSum += Number(cyData?.withholdingTax3 || 0);
      totalLocalTaxSum += Number(cyData?.localTax03 || 0);
    });

    const bRec = new Uint8Array(190);
    for (let i = 0; i < bRec.length; i++) bRec[i] = 0x20;

    bRec.set(encodeEucKr('B'), 0); // B1 (1)
    bRec.set(padNumberBytes('24', 2), 1); // B2 (2)
    bRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // B3 (3)
    bRec.set(padNumberBytes(bSequence++, 6), 6); // B4 (6)
    bRec.set(padStringBytes(bizNo, 10), 12); // B5 (10)
    bRec.set(padStringBytes(compName, 30), 22); // B6 (30)
    bRec.set(padNumberBytes(group.length, 6), 52); // B7 (6)
    bRec.set(padNumberBytes(group.length, 10), 58); // B8 (10)
    bRec.set(padNumberBytes(totalIncomeSum, 15), 68); // B9 (15)
    bRec.set(padNumberBytes(totalIncomeTaxSum, 15), 83); // B10 (15)
    bRec.set(padNumberBytes(totalLocalTaxSum, 15), 98); // B11 (15)
    bRec.set(padNumberBytes(totalIncomeTaxSum + totalLocalTaxSum, 15), 113); // B12 (15)
    
    for (let i = 128; i < 138; i++) bRec[i] = 0x30;
    for (let i = 138; i < 153; i++) bRec[i] = 0x30;

    bRec.set(padNumberBytes('1', 1), 153); // B15 (1)

    records.push(bRec);

    // Build C-record for each client in the company group
    let cSequence = 1;
    group.forEach(c => {
      const cyData = c.freelancerYears?.[targetYr];
      const income = Number(cyData?.totalIncome || 0);
      const incTax = Number(cyData?.withholdingTax3 || 0);
      const locTax = Number(cyData?.localTax03 || 0);
      const isForeignClient = (c.nationality && !c.nationality.includes('대한민국')) ? '9' : '1';
      
      const cRec = new Uint8Array(190);
      for (let i = 0; i < cRec.length; i++) cRec[i] = 0x20;

      const fillZeros = (start: number, end: number) => {
        for (let i = start; i < end; i++) cRec[i] = 0x30;
      };
      fillZeros(122, 130); 
      fillZeros(130, 144); 
      fillZeros(144, 146); 
      fillZeros(146, 160); 
      fillZeros(160, 174); 
      fillZeros(174, 188); 

      cRec.set(encodeEucKr('C'), 0); // C1 (1)
      cRec.set(padNumberBytes('24', 2), 1); // C2 (2)
      cRec.set(padStringBytes(submitter.taxOfficeCode, 3), 3); // C3 (3)
      cRec.set(padNumberBytes(cSequence++, 7), 6); // C4 (7)
      cRec.set(padStringBytes(bizNo, 10), 13); // C5 (10)
      cRec.set(padStringBytes(String(c.regNum || '').replace(/-/g, '').trim(), 13), 23); // C6 (13)
      cRec.set(padStringBytes(c.name, 30), 36); // C7 (30)
      cRec.set(padNumberBytes('1', 1), 106); // C10 (1)
      cRec.set(padNumberBytes(isForeignClient, 1), 107); // C11 (1)
      cRec.set(padStringBytes(cyData?.incomeTypeCode || '940909', 6), 108); // C12 (6)
      cRec.set(padStringBytes(targetYr, 4), 114); // C13 (4)
      cRec.set(padStringBytes(targetYr, 4), 118); // C14 (4)
      cRec.set(padNumberBytes('1', 8), 122); // C15 (8)
      
      cRec.set(encodeEucKr('0'), 130); 
      cRec.set(padNumberBytes(income, 13), 131); 
      
      cRec.set(padNumberBytes('03', 2), 144); // C17 (3%)
      
      cRec.set(encodeEucKr('0'), 146); 
      cRec.set(padNumberBytes(incTax, 13), 147); 
      
      cRec.set(encodeEucKr('0'), 160); 
      cRec.set(padNumberBytes(locTax, 13), 161); 
      
      cRec.set(encodeEucKr('0'), 174); 
      cRec.set(padNumberBytes(incTax + locTax, 13), 175); 

      records.push(cRec);
    });
  }

  // Assemble records separated by CRLF
  const totalLength = records.length * 192;
  const fileBytes = new Uint8Array(totalLength);
  let offset = 0;
  records.forEach(rec => {
    fileBytes.set(rec, offset);
    fileBytes[offset + 190] = 0x0D; // CR
    fileBytes[offset + 191] = 0x0A; // LF
    offset += 192;
  });

  return new Blob([fileBytes], { type: 'text/plain;charset=cp949' });
}
