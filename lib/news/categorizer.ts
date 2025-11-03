import type { NewsCategory } from "@/types/article"

/**
 * 기사의 제목과 설명을 분석하여 카테고리를 자동으로 분류
 * @param title 기사 제목
 * @param description 기사 설명
 * @param rssCategory RSS 피드의 카테고리 정보
 * @returns 분류된 카테고리
 */
export function categorizeArticle(
  title: string,
  description: string,
  rssCategory?: string | string[]
): NewsCategory {
  const text = `${title} ${description}`.toLowerCase()

  // RSS 카테고리 기반 분류
  if (rssCategory) {
    const categoryStr = normalizeCategoryString(rssCategory)
    const categoryLower = categoryStr.toLowerCase()

    const rssCategoryMapping = checkRSSCategory(categoryLower)
    if (rssCategoryMapping) {
      console.log(`[Categorizer] RSS category matched: "${title.substring(0, 50)}..." -> ${rssCategoryMapping}`)
      return rssCategoryMapping
    }
  }

  // 키워드 기반 분류
  const category = categorizeByKeywords(text)

  // 카테고리 분류 결과 로깅
  if (category !== "all") {
    console.log(`[Categorizer] Keyword matched: "${title.substring(0, 50)}..." -> ${category}`)
  } else {
    console.log(`[Categorizer] Ambiguous category (marked as 'all'): "${title.substring(0, 50)}..."`)
  }

  return category
}

/**
 * RSS 카테고리를 문자열로 정규화
 */
function normalizeCategoryString(rssCategory: string | string[]): string {
  if (Array.isArray(rssCategory)) {
    return rssCategory[0]?.toString() || ""
  }
  if (typeof rssCategory === "object") {
    return JSON.stringify(rssCategory)
  }
  return String(rssCategory)
}

/**
 * RSS 카테고리 문자열에서 카테고리 추출
 */
function checkRSSCategory(categoryLower: string): NewsCategory | null {
  // Politics (정치) - 우선순위 높임
  if (
    categoryLower.includes("politics") ||
    categoryLower.includes("political") ||
    categoryLower.includes("government") ||
    categoryLower.includes("정치") ||
    categoryLower.includes("국회") ||
    categoryLower.includes("선거")
  ) {
    return "politics"
  }

  if (
    categoryLower.includes("business") ||
    categoryLower.includes("economy") ||
    categoryLower.includes("economic") ||
    categoryLower.includes("finance") ||
    categoryLower.includes("market") ||
    categoryLower.includes("경제") ||
    categoryLower.includes("비즈니스")
  ) {
    return "business"
  }
  if (
    categoryLower.includes("tech") ||
    categoryLower.includes("technology") ||
    categoryLower.includes("digital") ||
    categoryLower.includes("기술") ||
    categoryLower.includes("it")
  ) {
    return "technology"
  }
  if (
    categoryLower.includes("science") ||
    categoryLower.includes("scientific") ||
    categoryLower.includes("과학") ||
    categoryLower.includes("연구")
  ) {
    return "science"
  }
  if (
    categoryLower.includes("health") ||
    categoryLower.includes("medical") ||
    categoryLower.includes("medicine") ||
    categoryLower.includes("건강") ||
    categoryLower.includes("의료")
  ) {
    return "health"
  }
  if (
    categoryLower.includes("sport") ||
    categoryLower.includes("스포츠") ||
    categoryLower.includes("축구") ||
    categoryLower.includes("야구") ||
    categoryLower.includes("농구") ||
    categoryLower.includes("배구") ||
    categoryLower.includes("골프") ||
    categoryLower.includes("테니스") ||
    categoryLower.includes("올림픽") ||
    categoryLower.includes("kbo") ||
    categoryLower.includes("mlb") ||
    categoryLower.includes("nba") ||
    categoryLower.includes("프리미어리그") ||
    categoryLower.includes("premier league") ||
    categoryLower.includes("champions league")
  ) {
    return "sports"
  }
  if (
    categoryLower.includes("entertainment") ||
    categoryLower.includes("culture") ||
    categoryLower.includes("movie") ||
    categoryLower.includes("music") ||
    categoryLower.includes("celebrity") ||
    categoryLower.includes("연예") ||
    categoryLower.includes("엔터") ||
    categoryLower.includes("영화") ||
    categoryLower.includes("음악") ||
    categoryLower.includes("드라마") ||
    categoryLower.includes("케이팝") ||
    categoryLower.includes("kpop") ||
    categoryLower.includes("k-pop")
  ) {
    return "entertainment"
  }
  return null
}

/**
 * 키워드 기반 카테고리 분류
 * 애매한 분류는 "all" 반환 (전체 카테고리에서만 표시)
 */
function categorizeByKeywords(text: string): NewsCategory {
  // Business (비즈니스)
  if (
    // 영문 키워드 - 일반
    text.includes("business") ||
    text.includes("economy") ||
    text.includes("economic") ||
    text.includes("market") ||
    text.includes("stock") ||
    text.includes("trade") ||
    text.includes("trading") ||
    text.includes("finance") ||
    text.includes("financial") ||
    text.includes("investment") ||
    text.includes("investor") ||
    text.includes("company") ||
    text.includes("corporate") ||
    text.includes("startup") ||
    text.includes("entrepreneur") ||
    text.includes("agriculture") ||
    text.includes("farming") ||
    text.includes("revenue") ||
    text.includes("profit") ||
    text.includes("earnings") ||
    text.includes("dividend") ||
    text.includes("merger") ||
    text.includes("acquisition") ||
    text.includes("ipo") ||
    text.includes("bankruptcy") ||
    text.includes("cryptocurrency") ||
    text.includes("bitcoin") ||
    text.includes("ethereum") ||
    text.includes("real estate") ||
    text.includes("property") ||
    text.includes("housing") ||
    text.includes("mortgage") ||
    text.includes("interest rate") ||
    text.includes("inflation") ||
    text.includes("recession") ||
    text.includes("gdp") ||
    text.includes("fed") ||
    text.includes("federal reserve") ||
    text.includes("central bank") ||
    text.includes("bond") ||
    text.includes("commodity") ||
    text.includes("oil price") ||
    text.includes("gold") ||
    text.includes("dollar") ||
    text.includes("currency") ||
    text.includes("exchange rate") ||
    // 한글 키워드 - 일반
    text.includes("경제") ||
    text.includes("시장") ||
    text.includes("주식") ||
    text.includes("기업") ||
    text.includes("금융") ||
    text.includes("투자") ||
    text.includes("무역") ||
    text.includes("재정") ||
    text.includes("비즈니스") ||
    text.includes("스타트업") ||
    text.includes("창업") ||
    text.includes("벤처") ||
    text.includes("매출") ||
    text.includes("영업이익") ||
    text.includes("순이익") ||
    text.includes("실적") ||
    text.includes("분기") ||
    text.includes("반기") ||
    text.includes("연간") ||
    text.includes("배당") ||
    text.includes("배당금") ||
    text.includes("주가") ||
    text.includes("증시") ||
    text.includes("코스피") ||
    text.includes("kospi") ||
    text.includes("코스닥") ||
    text.includes("kosdaq") ||
    text.includes("상장") ||
    text.includes("공모") ||
    text.includes("ipo") ||
    text.includes("증권") ||
    text.includes("은행") ||
    text.includes("은행권") ||
    text.includes("금리") ||
    text.includes("기준금리") ||
    text.includes("대출") ||
    text.includes("예금") ||
    text.includes("적금") ||
    text.includes("채권") ||
    text.includes("국채") ||
    text.includes("회사채") ||
    text.includes("환율") ||
    text.includes("달러") ||
    text.includes("엔화") ||
    text.includes("유로") ||
    text.includes("위안") ||
    text.includes("원화") ||
    text.includes("외환") ||
    text.includes("인플레이션") ||
    text.includes("물가") ||
    text.includes("소비자물가") ||
    text.includes("경기") ||
    text.includes("경기침체") ||
    text.includes("불황") ||
    text.includes("호황") ||
    text.includes("경기부양") ||
    text.includes("부동산") ||
    text.includes("아파트") ||
    text.includes("주택") ||
    text.includes("전세") ||
    text.includes("월세") ||
    text.includes("집값") ||
    text.includes("분양") ||
    text.includes("청약") ||
    text.includes("재건축") ||
    text.includes("재개발") ||
    text.includes("암호화폐") ||
    text.includes("가상화폐") ||
    text.includes("가상자산") ||
    text.includes("비트코인") ||
    text.includes("이더리움") ||
    text.includes("코인") ||
    text.includes("업비트") ||
    text.includes("빗썸") ||
    text.includes("거래소") ||
    text.includes("M&A") ||
    text.includes("인수합병") ||
    text.includes("합병") ||
    text.includes("인수") ||
    text.includes("지분") ||
    text.includes("지주회사") ||
    text.includes("계열사") ||
    text.includes("자회사") ||
    text.includes("대기업") ||
    text.includes("중소기업") ||
    text.includes("중견기업") ||
    text.includes("재벌") ||
    // 한글 키워드 - 농업/1차 산업
    text.includes("쌀") ||
    text.includes("경기미") ||
    text.includes("농산물") ||
    text.includes("농업") ||
    text.includes("농가") ||
    text.includes("어업") ||
    text.includes("축산") ||
    text.includes("수출") ||
    text.includes("수입") ||
    text.includes("관세") ||
    // 한글 키워드 - 주요 기업/브랜드
    text.includes("삼성전자") ||
    text.includes("sk하이닉스") ||
    text.includes("네이버") ||
    text.includes("카카오") ||
    text.includes("lg전자") ||
    text.includes("현대차") ||
    text.includes("기아") ||
    text.includes("포스코") ||
    text.includes("한화") ||
    text.includes("롯데") ||
    text.includes("신세계") ||
    text.includes("gs") ||
    text.includes("쿠팡") ||
    text.includes("배달의민족") ||
    text.includes("토스") ||
    text.includes("애플") ||
    text.includes("마이크로소프트") ||
    text.includes("구글") ||
    text.includes("아마존") ||
    text.includes("메타") ||
    text.includes("페이스북") ||
    text.includes("인스타그램") ||
    text.includes("테슬라")
  ) {
    return "business"
  }

  // Technology (기술)
  if (
    // 영문 키워드 - AI/ML
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("machine learning") ||
    text.includes("deep learning") ||
    text.includes("neural network") ||
    text.includes("chatgpt") ||
    text.includes("gpt") ||
    text.includes("claude") ||
    text.includes("bard") ||
    text.includes("gemini") ||
    text.includes("openai") ||
    text.includes("anthropic") ||
    text.includes("llm") ||
    text.includes("generative ai") ||
    // 영문 키워드 - 소프트웨어/하드웨어
    text.includes("software") ||
    text.includes("hardware") ||
    text.includes("computer") ||
    text.includes("digital") ||
    text.includes("internet") ||
    text.includes("app") ||
    text.includes("application") ||
    text.includes("mobile") ||
    text.includes("smartphone") ||
    text.includes("iphone") ||
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("windows") ||
    text.includes("mac") ||
    text.includes("linux") ||
    text.includes("operating system") ||
    text.includes("processor") ||
    text.includes("cpu") ||
    text.includes("gpu") ||
    text.includes("chip") ||
    text.includes("chipset") ||
    text.includes("memory") ||
    text.includes("ram") ||
    text.includes("ssd") ||
    text.includes("storage") ||
    // 영문 키워드 - 네트워크/통신
    text.includes("5g") ||
    text.includes("6g") ||
    text.includes("network") ||
    text.includes("wifi") ||
    text.includes("broadband") ||
    text.includes("fiber") ||
    text.includes("telecom") ||
    text.includes("telecommunication") ||
    // 영문 키워드 - 신기술
    text.includes("robot") ||
    text.includes("robotics") ||
    text.includes("automation") ||
    text.includes("autonomous") ||
    text.includes("self-driving") ||
    text.includes("electric vehicle") ||
    text.includes("ev") ||
    text.includes("battery") ||
    text.includes("cyber") ||
    text.includes("cybersecurity") ||
    text.includes("hacker") ||
    text.includes("hacking") ||
    text.includes("data breach") ||
    text.includes("blockchain") ||
    text.includes("crypto") ||
    text.includes("nft") ||
    text.includes("metaverse") ||
    text.includes("vr") ||
    text.includes("virtual reality") ||
    text.includes("ar") ||
    text.includes("augmented reality") ||
    text.includes("iot") ||
    text.includes("internet of things") ||
    text.includes("cloud computing") ||
    text.includes("cloud") ||
    text.includes("aws") ||
    text.includes("azure") ||
    text.includes("quantum") ||
    text.includes("quantum computing") ||
    text.includes("semiconductor") ||
    text.includes("fab") ||
    text.includes("foundry") ||
    text.includes("drone") ||
    text.includes("3d printing") ||
    text.includes("nanotechnology") ||
    // 한글 키워드 - AI/ML
    text.includes("기술") ||
    text.includes("인공지능") ||
    text.includes("머신러닝") ||
    text.includes("딥러닝") ||
    text.includes("신경망") ||
    text.includes("챗gpt") ||
    text.includes("챗지피티") ||
    text.includes("오픈ai") ||
    text.includes("오픈에이아이") ||
    text.includes("생성형ai") ||
    text.includes("생성형 인공지능") ||
    text.includes("초거대ai") ||
    // 한글 키워드 - 소프트웨어/하드웨어
    text.includes("소프트웨어") ||
    text.includes("하드웨어") ||
    text.includes("컴퓨터") ||
    text.includes("디지털") ||
    text.includes("인터넷") ||
    text.includes("앱") ||
    text.includes("애플리케이션") ||
    text.includes("모바일") ||
    text.includes("스마트폰") ||
    text.includes("아이폰") ||
    text.includes("갤럭시") ||
    text.includes("안드로이드") ||
    text.includes("운영체제") ||
    text.includes("프로세서") ||
    text.includes("중앙처리장치") ||
    text.includes("그래픽카드") ||
    text.includes("메모리") ||
    text.includes("ssd") ||
    text.includes("저장장치") ||
    // 한글 키워드 - 네트워크/통신
    text.includes("5g") ||
    text.includes("6g") ||
    text.includes("네트워크") ||
    text.includes("와이파이") ||
    text.includes("광통신") ||
    text.includes("통신사") ||
    text.includes("kt") ||
    text.includes("skt") ||
    text.includes("lg유플러스") ||
    // 한글 키워드 - 신기술
    text.includes("로봇") ||
    text.includes("로봇공학") ||
    text.includes("자동화") ||
    text.includes("자율주행") ||
    text.includes("무인자동차") ||
    text.includes("전기차") ||
    text.includes("전기자동차") ||
    text.includes("배터리") ||
    text.includes("이차전지") ||
    text.includes("사이버") ||
    text.includes("사이버보안") ||
    text.includes("해킹") ||
    text.includes("해커") ||
    text.includes("보안") ||
    text.includes("정보보안") ||
    text.includes("블록체인") ||
    text.includes("메타버스") ||
    text.includes("가상현실") ||
    text.includes("증강현실") ||
    text.includes("사물인터넷") ||
    text.includes("클라우드") ||
    text.includes("양자컴퓨터") ||
    text.includes("양자컴퓨팅") ||
    text.includes("반도체") ||
    text.includes("칩") ||
    text.includes("파운드리") ||
    text.includes("팹리스") ||
    text.includes("드론") ||
    text.includes("3d프린팅") ||
    text.includes("3d프린터") ||
    text.includes("나노기술") ||
    // 한글 키워드 - 주요 IT 기업
    text.includes("삼성전자") ||
    text.includes("sk하이닉스") ||
    text.includes("네이버") ||
    text.includes("카카오") ||
    text.includes("엔비디아") ||
    text.includes("인텔") ||
    text.includes("amd") ||
    text.includes("퀄컴") ||
    text.includes("tsmc")
  ) {
    return "technology"
  }

  // Science (과학)
  if (
    // 영문 키워드 - 일반
    text.includes("science") ||
    text.includes("scientific") ||
    text.includes("research") ||
    text.includes("study") ||
    text.includes("scientist") ||
    text.includes("discovery") ||
    text.includes("experiment") ||
    text.includes("laboratory") ||
    text.includes("lab") ||
    text.includes("theory") ||
    text.includes("hypothesis") ||
    text.includes("journal") ||
    text.includes("peer review") ||
    text.includes("publication") ||
    // 영문 키워드 - 물리/화학/생물
    text.includes("physics") ||
    text.includes("quantum") ||
    text.includes("particle") ||
    text.includes("atom") ||
    text.includes("molecule") ||
    text.includes("chemistry") ||
    text.includes("chemical") ||
    text.includes("biology") ||
    text.includes("biological") ||
    text.includes("genetics") ||
    text.includes("gene") ||
    text.includes("dna") ||
    text.includes("rna") ||
    text.includes("genome") ||
    text.includes("cell") ||
    text.includes("protein") ||
    text.includes("enzyme") ||
    text.includes("evolution") ||
    text.includes("species") ||
    text.includes("ecosystem") ||
    text.includes("biodiversity") ||
    // 영문 키워드 - 우주
    text.includes("space") ||
    text.includes("nasa") ||
    text.includes("spacex") ||
    text.includes("rocket") ||
    text.includes("satellite") ||
    text.includes("mars") ||
    text.includes("moon") ||
    text.includes("planet") ||
    text.includes("star") ||
    text.includes("galaxy") ||
    text.includes("universe") ||
    text.includes("astronomy") ||
    text.includes("astronaut") ||
    text.includes("telescope") ||
    text.includes("iss") ||
    text.includes("space station") ||
    // 영문 키워드 - 기후/환경
    text.includes("climate") ||
    text.includes("climate change") ||
    text.includes("global warming") ||
    text.includes("greenhouse") ||
    text.includes("carbon") ||
    text.includes("emission") ||
    text.includes("renewable") ||
    text.includes("solar") ||
    text.includes("wind energy") ||
    text.includes("environment") ||
    text.includes("environmental") ||
    text.includes("pollution") ||
    text.includes("sustainability") ||
    text.includes("conservation") ||
    text.includes("ecology") ||
    // 영문 키워드 - 지질/해양
    text.includes("geology") ||
    text.includes("earthquake") ||
    text.includes("volcano") ||
    text.includes("tsunami") ||
    text.includes("ocean") ||
    text.includes("marine") ||
    text.includes("coral reef") ||
    text.includes("meteorology") ||
    text.includes("weather") ||
    // 한글 키워드 - 일반
    text.includes("과학") ||
    text.includes("연구") ||
    text.includes("실험") ||
    text.includes("과학자") ||
    text.includes("연구원") ||
    text.includes("발견") ||
    text.includes("이론") ||
    text.includes("가설") ||
    text.includes("논문") ||
    text.includes("학술지") ||
    text.includes("연구소") ||
    text.includes("실험실") ||
    // 한글 키워드 - 물리/화학/생물
    text.includes("물리") ||
    text.includes("물리학") ||
    text.includes("양자") ||
    text.includes("입자") ||
    text.includes("원자") ||
    text.includes("분자") ||
    text.includes("화학") ||
    text.includes("화학물질") ||
    text.includes("생물") ||
    text.includes("생물학") ||
    text.includes("유전자") ||
    text.includes("유전학") ||
    text.includes("유전공학") ||
    text.includes("게놈") ||
    text.includes("dna") ||
    text.includes("세포") ||
    text.includes("단백질") ||
    text.includes("효소") ||
    text.includes("진화") ||
    text.includes("종") ||
    text.includes("생태계") ||
    text.includes("생물다양성") ||
    // 한글 키워드 - 우주
    text.includes("우주") ||
    text.includes("우주선") ||
    text.includes("우주왕복선") ||
    text.includes("로켓") ||
    text.includes("인공위성") ||
    text.includes("위성") ||
    text.includes("화성") ||
    text.includes("달") ||
    text.includes("행성") ||
    text.includes("별") ||
    text.includes("은하") ||
    text.includes("우주정거장") ||
    text.includes("천문학") ||
    text.includes("천문") ||
    text.includes("우주비행사") ||
    text.includes("망원경") ||
    text.includes("나사") ||
    text.includes("스페이스x") ||
    // 한글 키워드 - 기후/환경
    text.includes("기후") ||
    text.includes("기후변화") ||
    text.includes("지구온난화") ||
    text.includes("온난화") ||
    text.includes("온실가스") ||
    text.includes("탄소") ||
    text.includes("이산화탄소") ||
    text.includes("배출") ||
    text.includes("배출량") ||
    text.includes("재생에너지") ||
    text.includes("태양광") ||
    text.includes("풍력") ||
    text.includes("수소") ||
    text.includes("환경") ||
    text.includes("환경오염") ||
    text.includes("오염") ||
    text.includes("대기오염") ||
    text.includes("수질오염") ||
    text.includes("미세먼지") ||
    text.includes("pm") ||
    text.includes("지속가능") ||
    text.includes("보존") ||
    text.includes("생태") ||
    // 한글 키워드 - 지질/해양
    text.includes("지진") ||
    text.includes("화산") ||
    text.includes("쓰나미") ||
    text.includes("지질") ||
    text.includes("해양") ||
    text.includes("바다") ||
    text.includes("산호초") ||
    text.includes("기상") ||
    text.includes("날씨") ||
    text.includes("태풍") ||
    text.includes("폭염") ||
    text.includes("한파") ||
    text.includes("가뭄") ||
    text.includes("홍수")
  ) {
    return "science"
  }

  // Health (건강)
  if (
    // 영문 키워드 - 일반
    text.includes("health") ||
    text.includes("healthcare") ||
    text.includes("medical") ||
    text.includes("medicine") ||
    text.includes("hospital") ||
    text.includes("clinic") ||
    text.includes("doctor") ||
    text.includes("physician") ||
    text.includes("nurse") ||
    text.includes("patient") ||
    text.includes("disease") ||
    text.includes("illness") ||
    text.includes("symptom") ||
    text.includes("diagnosis") ||
    text.includes("treatment") ||
    text.includes("therapy") ||
    text.includes("surgery") ||
    text.includes("operation") ||
    text.includes("wellness") ||
    text.includes("fitness") ||
    // 영문 키워드 - 질병/감염
    text.includes("covid") ||
    text.includes("coronavirus") ||
    text.includes("pandemic") ||
    text.includes("epidemic") ||
    text.includes("vaccine") ||
    text.includes("vaccination") ||
    text.includes("virus") ||
    text.includes("bacteria") ||
    text.includes("infection") ||
    text.includes("infectious") ||
    text.includes("flu") ||
    text.includes("influenza") ||
    text.includes("cold") ||
    text.includes("fever") ||
    text.includes("cancer") ||
    text.includes("tumor") ||
    text.includes("diabetes") ||
    text.includes("hypertension") ||
    text.includes("heart disease") ||
    text.includes("stroke") ||
    text.includes("alzheimer") ||
    text.includes("dementia") ||
    text.includes("asthma") ||
    text.includes("allergy") ||
    text.includes("obesity") ||
    // 영문 키워드 - 의약품/치료
    text.includes("drug") ||
    text.includes("medication") ||
    text.includes("prescription") ||
    text.includes("pharmaceutical") ||
    text.includes("pharmacy") ||
    text.includes("pill") ||
    text.includes("tablet") ||
    text.includes("antibiotic") ||
    text.includes("painkiller") ||
    text.includes("clinical trial") ||
    text.includes("fda") ||
    text.includes("approval") ||
    // 영문 키워드 - 정신건강
    text.includes("mental health") ||
    text.includes("depression") ||
    text.includes("anxiety") ||
    text.includes("stress") ||
    text.includes("psychiatry") ||
    text.includes("psychology") ||
    // 한글 키워드 - 일반
    text.includes("건강") ||
    text.includes("보건") ||
    text.includes("의료") ||
    text.includes("병원") ||
    text.includes("의원") ||
    text.includes("의사") ||
    text.includes("간호사") ||
    text.includes("환자") ||
    text.includes("진료") ||
    text.includes("진단") ||
    text.includes("검사") ||
    text.includes("검진") ||
    text.includes("치료") ||
    text.includes("수술") ||
    text.includes("시술") ||
    text.includes("웰빙") ||
    text.includes("건강관리") ||
    // 한글 키워드 - 질병/감염
    text.includes("질병") ||
    text.includes("질환") ||
    text.includes("병") ||
    text.includes("증상") ||
    text.includes("코로나") ||
    text.includes("covid") ||
    text.includes("팬데믹") ||
    text.includes("확진자") ||
    text.includes("감염") ||
    text.includes("백신") ||
    text.includes("예방접종") ||
    text.includes("접종") ||
    text.includes("바이러스") ||
    text.includes("변이") ||
    text.includes("독감") ||
    text.includes("인플루엔자") ||
    text.includes("감기") ||
    text.includes("열") ||
    text.includes("발열") ||
    text.includes("암") ||
    text.includes("종양") ||
    text.includes("당뇨") ||
    text.includes("당뇨병") ||
    text.includes("고혈압") ||
    text.includes("심장병") ||
    text.includes("뇌졸중") ||
    text.includes("치매") ||
    text.includes("알츠하이머") ||
    text.includes("천식") ||
    text.includes("알레르기") ||
    text.includes("비만") ||
    // 한글 키워드 - 의약품/치료
    text.includes("약물") ||
    text.includes("약") ||
    text.includes("의약품") ||
    text.includes("신약") ||
    text.includes("처방") ||
    text.includes("처방전") ||
    text.includes("제약") ||
    text.includes("약국") ||
    text.includes("항생제") ||
    text.includes("진통제") ||
    text.includes("임상시험") ||
    text.includes("임상") ||
    text.includes("식약처") ||
    text.includes("승인") ||
    text.includes("허가") ||
    // 한글 키워드 - 정신건강
    text.includes("정신건강") ||
    text.includes("우울증") ||
    text.includes("불안") ||
    text.includes("스트레스") ||
    text.includes("정신과") ||
    text.includes("심리") ||
    // 한글 키워드 - 보험/의료시스템
    text.includes("건강보험") ||
    text.includes("의료보험") ||
    text.includes("실손보험") ||
    text.includes("급여") ||
    text.includes("비급여") ||
    text.includes("건보")
  ) {
    return "health"
  }

  // Sports (스포츠)
  if (
    // 영문 키워드 - 일반
    text.includes("sport") ||
    text.includes("football") ||
    text.includes("basketball") ||
    text.includes("soccer") ||
    text.includes("baseball") ||
    text.includes("olympic") ||
    text.includes("championship") ||
    text.includes("tournament") ||
    text.includes("athlete") ||
    text.includes("player") ||
    text.includes("match") ||
    text.includes("coach") ||
    text.includes("stadium") ||
    text.includes("league") ||
    text.includes("world cup") ||
    // 영문 키워드 - 종목
    text.includes("golf") ||
    text.includes("tennis") ||
    text.includes("badminton") ||
    text.includes("volleyball") ||
    text.includes("hockey") ||
    text.includes("cricket") ||
    text.includes("rugby") ||
    text.includes("boxing") ||
    text.includes("mma") ||
    text.includes("ufc") ||
    text.includes("wrestling") ||
    text.includes("swimming") ||
    text.includes("athletics") ||
    text.includes("marathon") ||
    text.includes("skiing") ||
    text.includes("skating") ||
    // 영문 키워드 - 주요 리그
    text.includes("nba") || // 미국 프로농구
    text.includes("nfl") || // 미국 프로풋볼
    text.includes("mlb") || // 메이저리그 야구
    text.includes("major league") ||
    text.includes("nhl") || // 북미 아이스하키
    text.includes("premier league") || // 영국 프리미어리그
    text.includes("la liga") || // 스페인 라리가
    text.includes("serie a") || // 이탈리아 세리에A
    text.includes("bundesliga") || // 독일 분데스리가
    text.includes("ligue 1") || // 프랑스 리그1
    text.includes("champions league") || // UEFA 챔피언스리그
    text.includes("uefa") ||
    text.includes("fifa") ||
    text.includes("wimbledon") || // 윔블던 테니스
    text.includes("pga") || // 프로골프
    text.includes("f1") || // 포뮬러 원
    text.includes("formula one") ||
    // 한글 키워드 - 일반
    text.includes("스포츠") ||
    text.includes("축구") ||
    text.includes("야구") ||
    text.includes("농구") ||
    text.includes("배구") ||
    text.includes("올림픽") ||
    text.includes("선수") ||
    text.includes("우승") ||
    text.includes("감독") ||
    text.includes("코치") ||
    text.includes("경기장") ||
    text.includes("리그") ||
    text.includes("월드컵") ||
    // 한글 키워드 - 종목
    text.includes("골프") ||
    text.includes("테니스") ||
    text.includes("배드민턴") ||
    text.includes("탁구") ||
    text.includes("수영") ||
    text.includes("육상") ||
    text.includes("마라톤") ||
    text.includes("권투") ||
    text.includes("태권도") ||
    text.includes("유도") ||
    text.includes("레슬링") ||
    text.includes("격투기") ||
    text.includes("피겨") ||
    text.includes("스케이팅") ||
    text.includes("스키") ||
    text.includes("e스포츠") ||
    text.includes("이스포츠") ||
    // 한글 키워드 - 한국 리그
    text.includes("kbo") || // 한국프로야구
    text.includes("프로야구") ||
    text.includes("kbl") || // 한국프로농구
    text.includes("프로농구") ||
    text.includes("k리그") || // 한국프로축구
    text.includes("프로축구") ||
    text.includes("v리그") || // 한국프로배구
    text.includes("프로배구") ||
    text.includes("klpga") || // 한국여자프로골프
    text.includes("kpga") || // 한국프로골프
    // 한글 키워드 - 해외 리그
    text.includes("메이저리그") ||
    text.includes("프리미어리그") ||
    text.includes("라리가") ||
    text.includes("세리에") ||
    text.includes("분데스리가") ||
    text.includes("챔피언스리그") ||
    text.includes("챔스") ||
    // 한글 키워드 - 팀명 (주요)
    text.includes("맨유") ||
    text.includes("첼시") ||
    text.includes("레알") ||
    text.includes("바르샤") ||
    text.includes("바이에른") ||
    text.includes("한화") ||
    text.includes("두산") ||
    text.includes("롯데") ||
    text.includes("kt위즈") ||
    text.includes("lg트윈스") ||
    text.includes("ssr") ||
    text.includes("nc다이노스") ||
    // "경기"는 스포츠 관련 단어와 함께 있을 때만 매칭
    (text.includes("경기") &&
      (text.includes("스포츠") ||
        text.includes("축구") ||
        text.includes("야구") ||
        text.includes("농구") ||
        text.includes("배구") ||
        text.includes("선수") ||
        text.includes("리그") ||
        text.includes("팀")))
  ) {
    return "sports"
  }

  // Entertainment (엔터테인먼트)
  if (
    // 영문 키워드 - 일반
    text.includes("entertainment") ||
    text.includes("movie") ||
    text.includes("film") ||
    text.includes("cinema") ||
    text.includes("music") ||
    text.includes("celebrity") ||
    text.includes("actor") ||
    text.includes("actress") ||
    text.includes("singer") ||
    text.includes("concert") ||
    text.includes("album") ||
    text.includes("show") ||
    text.includes("series") ||
    text.includes("drama") ||
    text.includes("theater") ||
    text.includes("broadway") ||
    text.includes("hollywood") ||
    text.includes("festival") ||
    text.includes("grammy") ||
    text.includes("oscar") ||
    text.includes("emmy") ||
    text.includes("award") ||
    text.includes("idol") ||
    text.includes("kpop") ||
    text.includes("k-pop") ||
    text.includes("billboard") ||
    // 영문 키워드 - 해외 엔터사
    text.includes("disney") ||
    text.includes("warner bros") ||
    text.includes("universal pictures") ||
    text.includes("universal studios") ||
    text.includes("paramount") ||
    text.includes("sony pictures") ||
    text.includes("netflix") ||
    text.includes("mgm") ||
    text.includes("dreamworks") ||
    text.includes("marvel") ||
    text.includes("dc comics") ||
    text.includes("hbo") ||
    text.includes("amazon studios") ||
    text.includes("apple tv") ||
    // 한글 키워드 - 일반
    text.includes("엔터") ||
    text.includes("연예") ||
    text.includes("영화") ||
    text.includes("음악") ||
    text.includes("배우") ||
    text.includes("가수") ||
    text.includes("아이돌") ||
    text.includes("걸그룹") ||
    text.includes("보이그룹") ||
    text.includes("콘서트") ||
    text.includes("앨범") ||
    text.includes("드라마") ||
    text.includes("방송") ||
    text.includes("예능") ||
    text.includes("뮤지컬") ||
    text.includes("공연") ||
    text.includes("시상식") ||
    text.includes("영화제") ||
    text.includes("음악축제") ||
    text.includes("페스티벌") ||
    text.includes("케이팝") ||
    text.includes("한류") ||
    // 한글 키워드 - 한국 엔터사 (Big 3 + 주요사)
    text.includes("sm엔터") ||
    text.includes("sm엔터테인먼트") ||
    text.includes("에스엠") ||
    text.includes("jyp") ||
    text.includes("제이와이피") ||
    text.includes("yg") ||
    text.includes("와이지") ||
    text.includes("하이브") ||
    text.includes("hybe") ||
    text.includes("빅히트") ||
    text.includes("어도어") ||
    text.includes("ador") ||
    text.includes("소스뮤직") ||
    text.includes("플레디스") ||
    text.includes("큐브") ||
    text.includes("cube") ||
    text.includes("fnc") ||
    text.includes("스타쉽") ||
    text.includes("starship") ||
    text.includes("울림") ||
    text.includes("판타지오") ||
    text.includes("안테나") ||
    text.includes("피네이션") ||
    text.includes("모스트콘텐츠") ||
    text.includes("넥스타") ||
    text.includes("키이스트") ||
    text.includes("젤리피쉬") ||
    text.includes("크래커") ||
    text.includes("rbw") ||
    text.includes("wm") ||
    text.includes("dsp") ||
    // 한글 키워드 - 한국 엔터사 (방송사 계열)
    text.includes("카카오엔터") ||
    text.includes("카카오m") ||
    text.includes("스튜디오드래곤") ||
    text.includes("초록뱀") ||
    text.includes("넷플릭스") ||
    text.includes("티빙") ||
    text.includes("웨이브") ||
    text.includes("왓챠") ||
    // 한글 키워드 - 해외 엔터사
    text.includes("디즈니") ||
    text.includes("워너브라더스") ||
    text.includes("유니버설") ||
    text.includes("파라마운트") ||
    text.includes("소니픽처스") ||
    text.includes("마블") ||
    text.includes("디씨") ||
    // 한글 키워드 - K-pop 그룹/아티스트
    text.includes("bts") ||
    text.includes("방탄소년단") ||
    text.includes("블랙핑크") ||
    text.includes("blackpink") ||
    text.includes("뉴진스") ||
    text.includes("newjeans") ||
    text.includes("에스파") ||
    text.includes("aespa") ||
    text.includes("아이브") ||
    text.includes("ive") ||
    text.includes("르세라핌") ||
    text.includes("le sserafim") ||
    text.includes("엑소") ||
    text.includes("exo") ||
    text.includes("세븐틴") ||
    text.includes("seventeen") ||
    text.includes("트와이스") ||
    text.includes("twice") ||
    text.includes("레드벨벳") ||
    text.includes("red velvet") ||
    text.includes("있지") ||
    text.includes("itzy") ||
    text.includes("스트레이키즈") ||
    text.includes("stray kids") ||
    text.includes("엔시티") ||
    text.includes("nct") ||
    text.includes("아이유") ||
    text.includes("iu") ||
    text.includes("지드래곤") ||
    text.includes("빅뱅") ||
    text.includes("bigbang") ||
    text.includes("투모로우바이투게더") ||
    text.includes("txt") ||
    text.includes("엔믹스") ||
    text.includes("nmixx") ||
    text.includes("케플러") ||
    text.includes("kep1er") ||
    // 한글 키워드 - 드라마/예능
    text.includes("드라마") ||
    text.includes("예능") ||
    text.includes("시청률") ||
    text.includes("방영") ||
    text.includes("프로그램") ||
    text.includes("티빙") ||
    text.includes("웨이브") ||
    text.includes("왓챠") ||
    text.includes("tvn") ||
    text.includes("jtbc") ||
    text.includes("sbs") ||
    text.includes("kbs") ||
    text.includes("mbc")
  ) {
    return "entertainment"
  }

  // Politics (정치) - World보다 먼저 체크하여 우선순위 확보
  if (
    // 영문 키워드 - 정치 일반
    text.includes("politics") ||
    text.includes("political") ||
    text.includes("politician") ||
    text.includes("president") ||
    text.includes("prime minister") ||
    text.includes("minister") ||
    text.includes("congress") ||
    text.includes("parliament") ||
    text.includes("senate") ||
    text.includes("election") ||
    text.includes("vote") ||
    text.includes("voting") ||
    text.includes("campaign") ||
    text.includes("party") ||
    text.includes("democrat") ||
    text.includes("republican") ||
    text.includes("liberal") ||
    text.includes("conservative") ||
    text.includes("legislation") ||
    text.includes("law") ||
    text.includes("policy") ||
    text.includes("government") ||
    text.includes("governance") ||
    // 한글 키워드 - 정치 일반
    text.includes("정치") ||
    text.includes("정당") ||
    text.includes("국회") ||
    text.includes("의원") ||
    text.includes("장관") ||
    text.includes("선거") ||
    text.includes("투표") ||
    text.includes("대선") ||
    text.includes("총선") ||
    text.includes("지선") ||
    text.includes("보궐선거") ||
    text.includes("여당") ||
    text.includes("야당") ||
    text.includes("법안") ||
    text.includes("정책") ||
    text.includes("국정") ||
    text.includes("정부") ||
    text.includes("행정부") ||
    text.includes("입법부") ||
    text.includes("사법부") ||
    // 한글 키워드 - 한국 정당
    text.includes("민주당") ||
    text.includes("국민의힘") ||
    text.includes("진보당") ||
    text.includes("정의당") ||
    // 한글 키워드 - 정치인 직책
    text.includes("대통령") ||
    text.includes("총리") ||
    text.includes("국무총리") ||
    text.includes("청와대") ||
    text.includes("대통령실") ||
    text.includes("용산") ||
    text.includes("국무회의") ||
    text.includes("비서실") ||
    text.includes("참모진") ||
    // 한글 키워드 - 정치인 (주요 인물)
    text.includes("윤석열") ||
    text.includes("이재명") ||
    text.includes("한동훈") ||
    text.includes("이준석") ||
    // 한글 키워드 - 국회/입법
    text.includes("국회의원") ||
    text.includes("의원총회") ||
    text.includes("교섭단체") ||
    text.includes("상임위") ||
    text.includes("법사위") ||
    text.includes("기재위") ||
    text.includes("예결위") ||
    text.includes("정무위") ||
    text.includes("외교통일위") ||
    text.includes("국방위") ||
    text.includes("본회의") ||
    text.includes("청문회") ||
    text.includes("국정감사") ||
    text.includes("국감") ||
    text.includes("대정부질문") ||
    text.includes("예산안") ||
    text.includes("추경") ||
    text.includes("추가경정예산") ||
    text.includes("법률안") ||
    text.includes("개정안") ||
    text.includes("의안") ||
    // 한글 키워드 - 선거
    text.includes("대선") ||
    text.includes("대통령선거") ||
    text.includes("총선") ||
    text.includes("총선거") ||
    text.includes("지선") ||
    text.includes("지방선거") ||
    text.includes("재보선") ||
    text.includes("보궐선거") ||
    text.includes("후보") ||
    text.includes("공약") ||
    text.includes("출마") ||
    text.includes("경선") ||
    text.includes("당대표") ||
    text.includes("대표경선") ||
    text.includes("지지율") ||
    text.includes("여론조사") ||
    // 정치 + 특정 키워드 조합 (정확도 향상)
    (text.includes("법") &&
      (text.includes("개정") ||
        text.includes("제정") ||
        text.includes("통과") ||
        text.includes("발의")))
  ) {
    return "politics"
  }

  // World (세계/국제 뉴스) - 정치 제외한 국제 뉴스
  if (
    // 영문 키워드
    text.includes("world") ||
    text.includes("international") ||
    text.includes("global") ||
    text.includes("war") ||
    text.includes("conflict") ||
    text.includes("diplomacy") ||
    text.includes("united nations") ||
    text.includes("summit") ||
    text.includes("treaty") ||
    // 한글 키워드
    text.includes("세계") ||
    text.includes("국제") ||
    text.includes("글로벌") ||
    text.includes("전쟁") ||
    text.includes("분쟁") ||
    text.includes("외교") ||
    text.includes("유엔") ||
    text.includes("정상회담") ||
    text.includes("조약") ||
    text.includes("국가")
  ) {
    return "world"
  }

  // Default: 애매한 분류는 "all" (전체 카테고리에서만 표시)
  return "all"
}
