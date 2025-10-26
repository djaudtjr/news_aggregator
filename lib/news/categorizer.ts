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
    // 영문 키워드
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
    // 한글 키워드
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
    text.includes("쌀") ||
    text.includes("경기미") ||
    text.includes("농산물") ||
    text.includes("농업") ||
    text.includes("농가") ||
    text.includes("수출") ||
    text.includes("수입")
  ) {
    return "business"
  }

  // Technology (기술)
  if (
    // 영문 키워드
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("machine learning") ||
    text.includes("software") ||
    text.includes("hardware") ||
    text.includes("computer") ||
    text.includes("digital") ||
    text.includes("internet") ||
    text.includes("app") ||
    text.includes("mobile") ||
    text.includes("robot") ||
    text.includes("automation") ||
    text.includes("cyber") ||
    text.includes("blockchain") ||
    text.includes("crypto") ||
    text.includes("metaverse") ||
    text.includes("vr") ||
    text.includes("ar") ||
    text.includes("iot") ||
    text.includes("cloud computing") ||
    text.includes("5g") ||
    text.includes("semiconductor") ||
    // 한글 키워드
    text.includes("기술") ||
    text.includes("인공지능") ||
    text.includes("머신러닝") ||
    text.includes("딥러닝") ||
    text.includes("소프트웨어") ||
    text.includes("하드웨어") ||
    text.includes("컴퓨터") ||
    text.includes("디지털") ||
    text.includes("인터넷") ||
    text.includes("앱") ||
    text.includes("모바일") ||
    text.includes("로봇") ||
    text.includes("자동화") ||
    text.includes("사이버") ||
    text.includes("블록체인") ||
    text.includes("암호화폐") ||
    text.includes("가상화폐") ||
    text.includes("메타버스") ||
    text.includes("반도체") ||
    text.includes("칩") ||
    text.includes("클라우드")
  ) {
    return "technology"
  }

  // Science (과학)
  if (
    // 영문 키워드
    text.includes("science") ||
    text.includes("scientific") ||
    text.includes("research") ||
    text.includes("study") ||
    text.includes("scientist") ||
    text.includes("discovery") ||
    text.includes("experiment") ||
    text.includes("laboratory") ||
    text.includes("physics") ||
    text.includes("chemistry") ||
    text.includes("biology") ||
    text.includes("space") ||
    text.includes("climate") ||
    // 한글 키워드
    text.includes("과학") ||
    text.includes("연구") ||
    text.includes("실험") ||
    text.includes("과학자") ||
    text.includes("발견") ||
    text.includes("물리") ||
    text.includes("화학") ||
    text.includes("생물") ||
    text.includes("우주") ||
    text.includes("기후")
  ) {
    return "science"
  }

  // Health (건강)
  if (
    // 영문 키워드
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("medicine") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("disease") ||
    text.includes("vaccine") ||
    text.includes("virus") ||
    text.includes("patient") ||
    text.includes("treatment") ||
    text.includes("drug") ||
    text.includes("pharmaceutical") ||
    text.includes("wellness") ||
    // 한글 키워드
    text.includes("건강") ||
    text.includes("의료") ||
    text.includes("병원") ||
    text.includes("의사") ||
    text.includes("질병") ||
    text.includes("백신") ||
    text.includes("바이러스") ||
    text.includes("환자") ||
    text.includes("치료") ||
    text.includes("약물") ||
    text.includes("제약")
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
    text.includes("디씨")
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
