"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { NewsHeader } from "@/components/news-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, Search, Bookmark, FileText, Link as LinkIcon, User, Bell, Plus, X, Mail, Trash2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useSubscribedKeywords } from "@/hooks/useSubscribedKeywords"
import { useEmailSettings } from "@/hooks/useEmailSettings"
import { useToast } from "@/hooks/use-toast"

interface MyPageData {
  stats: {
    totalSummaryRequests: number
    totalLinkClicks: number
    totalSearches: number
    totalBookmarks: number
  }
  recentSearches: Array<{
    keyword: string
    search_count: number
    last_searched_at: string
  }>
  recentBookmarks: Array<{
    id: string
    title: string
    description?: string
    link: string
    source?: string
    category?: string
    created_at: string
  }>
}

export default function MyPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarksPage, setBookmarksPage] = useState(1)
  const [searchesPage, setSearchesPage] = useState(1)
  const [activeRegion, setActiveRegion] = useState("all")
  const [timeRange, setTimeRange] = useState(1)
  const bookmarksPerPage = 5
  const searchesPerPage = 5

  // 구독 키워드 관련
  const { keywords, addKeyword, removeKeyword } = useSubscribedKeywords()
  const [newKeyword, setNewKeyword] = useState("")

  // 추천 키워드 관련
  const [recommendations, setRecommendations] = useState<Array<{
    keyword: string
    subscriberCount: number
    rank: number
  }>>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  // 이메일 설정 관련
  const { settings: emailSettings, saveSettings } = useEmailSettings()
  const [emailForm, setEmailForm] = useState({
    email: user?.email || "",
    enabled: false,
    deliveryDays: [1, 2, 3, 4, 5], // 월~금
    deliveryHour: 6, // 기본값: 6시
    favoriteNewsEnabled: true, // 기본값: true (활성화)
  })

  // 이메일 유효성 검증 상태
  const [emailError, setEmailError] = useState<string>("")

  // 이메일 형식 검증 함수
  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === "") {
      return false
    }
    // RFC 5322 표준에 가까운 정규식 + 최상위 도메인(TLD) 필수
    // 예: user@example.com (O), user@example (X)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
    return emailRegex.test(email.trim())
  }

  // 이메일 설정 초기화
  useEffect(() => {
    if (emailSettings) {
      setEmailForm({
        email: emailSettings.email,
        enabled: emailSettings.enabled,
        deliveryDays: emailSettings.delivery_days,
        deliveryHour: emailSettings.delivery_hour,
        favoriteNewsEnabled: emailSettings.favorite_news_enabled ?? true,
      })
    } else if (user?.email) {
      setEmailForm((prev) => ({ ...prev, email: user.email! }))
    }
  }, [emailSettings, user])

  // 키워드가 없으면 나의 뉴스 조회 자동 OFF
  useEffect(() => {
    if (keywords.length === 0) {
      setEmailForm((prev) => ({ ...prev, favoriteNewsEnabled: false }))
    }
  }, [keywords.length])

  // 이메일 설정 변경사항 확인 (favoriteNewsEnabled는 즉시 저장되므로 제외)
  const hasUnsavedEmailChanges = useMemo(() => {
    if (!emailSettings) return false

    return (
      emailForm.email !== emailSettings.email ||
      emailForm.enabled !== emailSettings.enabled ||
      emailForm.deliveryHour !== emailSettings.delivery_hour ||
      JSON.stringify([...emailForm.deliveryDays].sort()) !== JSON.stringify([...emailSettings.delivery_days].sort())
    )
  }, [emailForm, emailSettings])

  const fetchMyPageData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/mypage?userId=${user.id}`)

      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error:", response.status, errorData)
        setError(`데이터를 불러올 수 없습니다 (${response.status})${errorData.details ? `: ${errorData.details}` : ''}`)
      }
    } catch (err) {
      console.error("Failed to fetch my page data:", err)
      setError(`데이터를 불러오는 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }, [user])

  // user가 로드되면 한 번만 데이터 로드 (화면 이동 시에만 실행)
  useEffect(() => {
    if (user) {
      fetchMyPageData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // user.id가 변경될 때만 실행 (로그인 시 한 번만)

  // 추천 키워드 가져오기
  const fetchRecommendations = useCallback(async () => {
    if (!user) {
      console.log("[Recommendations] No user, skipping fetch")
      return
    }

    try {
      setRecommendationsLoading(true)
      console.log("[Recommendations] Fetching for user:", user.id)
      const response = await fetch(`/api/recommendations/keywords?userId=${user.id}&limit=5`)

      if (response.ok) {
        const data = await response.json()
        console.log("[Recommendations] Received data:", data)
        setRecommendations(data.recommendations || [])
      } else {
        console.error("[Recommendations] API error:", response.status, await response.text())
      }
    } catch (err) {
      console.error("[Recommendations] Failed to fetch:", err)
    } finally {
      setRecommendationsLoading(false)
    }
  }, [user])

  // user가 로드되면 한 번만 추천 목록 로드 (화면 이동 시에만 실행)
  useEffect(() => {
    console.log("[Recommendations] Effect triggered - user:", !!user, "keywords:", keywords?.length, "loading:", loading)
    if (user) {
      fetchRecommendations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // user.id가 변경될 때만 실행 (로그인 시 한 번만)

  // 브라우저 뒤로가기/새로고침 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedEmailChanges) {
        e.preventDefault()
        e.returnValue = '저장하지 않은 변경사항이 있습니다. 페이지를 벗어나시겠습니까?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedEmailChanges])

  // 북마크 데이터가 변경되면 페이지 범위 조정
  useEffect(() => {
    if (data?.recentBookmarks) {
      const totalPages = Math.ceil(data.recentBookmarks.length / bookmarksPerPage)
      if (bookmarksPage > totalPages && totalPages > 0) {
        setBookmarksPage(totalPages)
      }
    }
  }, [data?.recentBookmarks, bookmarksPage, bookmarksPerPage])

  // 검색 데이터가 변경되면 페이지 범위 조정
  useEffect(() => {
    if (data?.recentSearches) {
      const totalPages = Math.ceil(data.recentSearches.length / searchesPerPage)
      if (searchesPage > totalPages && totalPages > 0) {
        setSearchesPage(totalPages)
      }
    }
  }, [data?.recentSearches, searchesPage, searchesPerPage])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query)}`)
    }
  }

  const handleRefresh = () => {
    // 새로고침 버튼이나 로고 클릭 시 메인 페이지로 이동
    // 저장하지 않은 변경사항이 있으면 경고
    if (hasUnsavedEmailChanges) {
      setPendingAction('home')
      setShowUnsavedChangesDialog(true)
      return
    }
    router.push('/')
  }

  // 변경사항 무시하고 이동
  const handleContinueWithoutSaving = async () => {
    setShowUnsavedChangesDialog(false)
    if (pendingAction === 'home') {
      router.push('/')
    } else if (pendingAction === 'logout') {
      // 로그아웃 진행
      try {
        await signOut()
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }
    setPendingAction(null)
  }

  // 로그아웃 시도 시 호출
  const handleLogoutAttempt = () => {
    if (hasUnsavedEmailChanges) {
      setPendingAction('logout')
      setShowUnsavedChangesDialog(true)
    }
  }

  // 모든 북마크 삭제
  const handleClearAllBookmarks = async () => {
    if (!user) return
    if (!confirm("모든 북마크를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/api/bookmarks?userId=${user.id}&deleteAll=true`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchMyPageData() // 데이터 새로고침
        toast({
          title: "✅ 북마크 삭제 완료",
          description: "모든 북마크가 삭제되었습니다.",
        })
      } else {
        toast({
          title: "❌ 삭제 실패",
          description: "북마크 삭제에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete bookmarks:", error)
      toast({
        title: "❌ 오류 발생",
        description: "북마크 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 키워드 추가 핸들러
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) {
      return
    }

    const success = await addKeyword(newKeyword.trim())
    if (success) {
      const keyword = newKeyword.trim()
      setNewKeyword("")
      toast({
        title: "✅ 키워드 추가 완료",
        description: `"${keyword}" 키워드가 추가되었습니다.`,
      })
    }
  }

  // 추천 키워드 추가 핸들러
  const handleAddRecommendedKeyword = async (keyword: string) => {
    const success = await addKeyword(keyword)
    if (success) {
      toast({
        title: "✅ 키워드 추가 완료",
        description: `"${keyword}" 키워드가 추가되었습니다.`,
      })
    }
  }

  // 모든 키워드 삭제
  const handleClearAllKeywords = async () => {
    if (!confirm("모든 구독 키워드를 삭제하시겠습니까?")) return

    for (const kw of keywords) {
      await removeKeyword(kw.id)
    }

    // 키워드가 없으면 나의 뉴스 조회 OFF
    setEmailForm((prev) => ({ ...prev, favoriteNewsEnabled: false }))
  }

  // 이메일 입력 핸들러 (실시간 검증)
  const handleEmailChange = (email: string) => {
    setEmailForm((prev) => ({ ...prev, email }))

    // 실시간 검증
    if (email.trim() === "") {
      setEmailError("이메일 주소를 입력해주세요.")
    } else if (!validateEmail(email)) {
      setEmailError("올바른 이메일 형식이 아닙니다. (예: example@email.com)")
    } else {
      setEmailError("")
    }
  }

  // 이메일 설정 저장 핸들러
  const handleSaveEmailSettings = async () => {
    // 최종 이메일 검증
    if (!validateEmail(emailForm.email)) {
      toast({
        title: "❌ 이메일 오류",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive",
      })
      setEmailError("올바른 이메일 형식이 아닙니다. (예: example@email.com)")
      return
    }

    // 구독 키워드가 없으면 이메일 알림 자동 off
    if (keywords.length === 0) {
      const updatedForm = { ...emailForm, enabled: false }
      const success = await saveSettings(updatedForm)
      if (success) {
        setEmailForm(updatedForm)
        toast({
          title: "⚠️ 키워드 없음",
          description: "구독 키워드가 없어서 이메일은 비활성화되어 저장되었습니다.",
          variant: "default",
        })
      } else {
        toast({
          title: "❌ 저장 실패",
          description: "설정 저장에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive",
        })
      }
      return
    }

    const success = await saveSettings(emailForm)
    if (success) {
      toast({
        title: "✅ 저장 완료",
        description: "이메일 알림 설정이 저장되었습니다.",
      })
    } else {
      toast({
        title: "❌ 저장 실패",
        description: "설정 저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  // 테스트 이메일 전송 핸들러
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false)

  // 저장하지 않은 변경사항 감지
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'home' | 'logout' | null>(null)

  const handleTestEmailClick = () => {
    if (!user) {
      toast({
        title: "⚠️ 로그인 필요",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }

    if (keywords.length === 0) {
      toast({
        title: "⚠️ 키워드 없음",
        description: "먼저 구독 키워드를 추가해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!emailForm.email) {
      toast({
        title: "⚠️ 이메일 미입력",
        description: "이메일 주소를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    // 이메일 형식 검증
    if (!validateEmail(emailForm.email)) {
      toast({
        title: "❌ 이메일 오류",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive",
      })
      setEmailError("올바른 이메일 형식이 아닙니다. (예: example@email.com)")
      return
    }

    // 설정이 변경되었는지 확인
    if (emailSettings) {
      const isChanged =
        emailForm.email !== emailSettings.email ||
        emailForm.enabled !== emailSettings.enabled ||
        emailForm.deliveryHour !== emailSettings.delivery_hour ||
        JSON.stringify(emailForm.deliveryDays.sort()) !== JSON.stringify(emailSettings.delivery_days.sort())

      if (isChanged) {
        toast({
          title: "⚠️ 설정 저장 필요",
          description: "변경된 설정을 먼저 저장해주세요.",
          variant: "destructive",
        })
        return
      }
    } else {
      // emailSettings가 없으면 첫 설정이므로 저장 필요
      toast({
        title: "⚠️ 설정 저장 필요",
        description: "먼저 설정을 저장해주세요.",
        variant: "destructive",
      })
      return
    }

    setShowTestEmailDialog(true)
  }

  const handleSendTestEmail = async () => {
    setShowTestEmailDialog(false)

    try {
      setSendingTestEmail(true)
      console.log(`[Test Email] Sending test email to ${emailForm.email}...`)

      toast({
        title: "📤 발송 중...",
        description: "테스트 이메일을 발송하고 있습니다. 잠시만 기다려주세요.",
      })

      const response = await fetch("/api/email/send-digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user!.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "✅ 전송 완료!",
          description: (
            <div className="space-y-2">
              <p className="font-semibold">테스트 이메일이 성공적으로 전송되었습니다!</p>
              <div className="text-sm space-y-1 pl-2 border-l-2 border-green-500">
                <p>📧 <strong>수신 주소:</strong> {emailForm.email}</p>
                <p>📰 <strong>뉴스 개수:</strong> {result.newsCount}개</p>
                <p>🔑 <strong>키워드:</strong> {keywords.map(k => k.keyword).join(", ")}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">메일함을 확인해주세요!</p>
            </div>
          ),
          duration: 8000,
        })
      } else {
        toast({
          title: "❌ 전송 실패",
          description: (
            <div className="space-y-2">
              <p className="font-semibold">이메일 전송에 실패했습니다.</p>
              <p className="text-sm text-red-200">{result.error || "알 수 없는 오류가 발생했습니다."}</p>
            </div>
          ),
          variant: "destructive",
          duration: 6000,
        })
      }
    } catch (error: any) {
      console.error("[Test Email] Error:", error)
      toast({
        title: "❌ 오류 발생",
        description: (
          <div className="space-y-2">
            <p className="font-semibold">이메일 전송 중 오류가 발생했습니다.</p>
            <p className="text-sm text-red-200">{error.message}</p>
          </div>
        ),
        variant: "destructive",
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  // 요일 토글 핸들러
  const toggleDeliveryDay = (day: number) => {
    setEmailForm((prev) => {
      const days = prev.deliveryDays.includes(day)
        ? prev.deliveryDays.filter((d) => d !== day)
        : [...prev.deliveryDays, day].sort()
      return { ...prev, deliveryDays: days }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          hasUnsavedChanges={hasUnsavedEmailChanges}
          onLogoutAttempt={handleLogoutAttempt}
          hideSearchBar
        />
        <main className="container mx-auto px-4 py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>로그인 필요</AlertTitle>
            <AlertDescription>마이페이지를 보려면 로그인이 필요합니다.</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          hasUnsavedChanges={hasUnsavedEmailChanges}
          onLogoutAttempt={handleLogoutAttempt}
          hideSearchBar
        />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          hasUnsavedChanges={hasUnsavedEmailChanges}
          onLogoutAttempt={handleLogoutAttempt}
          hideSearchBar
        />
        <main className="container mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        activeRegion={activeRegion}
        onRegionChange={setActiveRegion}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        hasUnsavedChanges={hasUnsavedEmailChanges}
        onLogoutAttempt={handleLogoutAttempt}
        hideSearchBar
      />
      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* 상단: 프로필 (좌측) + 통계 (우측) */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* 프로필 섹션 */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-0.5 pt-1">
              <div className="flex flex-col items-center gap-0">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || "User"}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="text-center leading-tight">
                  <CardTitle className="text-sm mb-0">{user.user_metadata?.full_name || "사용자"}</CardTitle>
                  <CardDescription className="text-xs leading-tight">{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 통계 카드 (AI요약, 기사조회, 검색) */}
          <div className="md:col-span-3 grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-1">
                <CardTitle className="text-xs font-medium">AI 요약</CardTitle>
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0.5 pb-1">
                <div className="text-xl font-bold leading-none mb-0">{data?.stats.totalSummaryRequests || 0}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">총 요청 횟수</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-1">
                <CardTitle className="text-xs font-medium">기사 조회</CardTitle>
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0.5 pb-1">
                <div className="text-xl font-bold leading-none mb-0">{data?.stats.totalLinkClicks || 0}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">총 클릭 횟수</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-1">
                <CardTitle className="text-xs font-medium">검색</CardTitle>
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0.5 pb-1">
                <div className="text-xl font-bold leading-none mb-0">{data?.stats.totalSearches || 0}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">총 검색 횟수</p>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* 중단: 구독 키워드 + 이메일 알림 통합 (좌측) + 최근 검색 키워드 (우측) */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 뉴스 구독 설정 (키워드 + 이메일 알림 통합) - 강조 */}
          <Card className="border-primary/50 shadow-lg shadow-primary/10 bg-gradient-to-br from-primary/5 to-background ring-1 ring-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">뉴스 구독 설정</CardTitle>
                  </div>
                  <CardDescription className="font-medium">관심 키워드를 추가하고 이메일로 뉴스를 받아보세요</CardDescription>
                </div>
                {keywords && keywords.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAllKeywords}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 구독 키워드 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">1</Badge>
                    <h3 className="font-semibold text-sm">구독 키워드</h3>
                  </div>
                  {/* 나의 뉴스 조회 스위치 */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="favorite-news-enabled" className="text-xs font-medium cursor-pointer">
                      나의 뉴스 조회
                    </Label>
                    <Switch
                      id="favorite-news-enabled"
                      checked={emailForm.favoriteNewsEnabled}
                      onCheckedChange={async (checked) => {
                        // 낙관적 업데이트
                        setEmailForm((prev) => ({ ...prev, favoriteNewsEnabled: checked }))

                        // DB에 즉시 저장
                        const success = await saveSettings({
                          email: emailForm.email,
                          enabled: emailForm.enabled,
                          deliveryDays: emailForm.deliveryDays,
                          deliveryHour: emailForm.deliveryHour,
                          favoriteNewsEnabled: checked,
                        })

                        if (success) {
                          toast({
                            title: checked ? "✅ 나의 뉴스 ON" : "✅ 나의 뉴스 OFF",
                            description: checked
                              ? "구독 키워드로만 뉴스가 조회됩니다."
                              : "전체 뉴스가 조회됩니다.",
                          })
                        } else {
                          // 실패 시 원래 상태로 되돌리기
                          setEmailForm((prev) => ({ ...prev, favoriteNewsEnabled: !checked }))
                          toast({
                            title: "❌ 저장 실패",
                            description: "설정 저장에 실패했습니다. 다시 시도해주세요.",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={keywords.length === 0}
                    />
                  </div>
                </div>

                {/* 키워드 추가 폼 */}
                <form onSubmit={handleAddKeyword} className="flex gap-1.5">
                  <Input
                    placeholder="예: AI, 삼성전자, 기후변화"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    disabled={keywords?.length >= 3}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={keywords?.length >= 3 || !newKeyword.trim()}
                    title={keywords?.length >= 3 ? "최대 3개까지 추가 가능합니다" : "키워드 추가"}
                    className="h-9 w-9"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </form>

                {/* 최대 개수 안내 */}
                {keywords && keywords.length >= 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    ⚠️ 최대 3개의 키워드까지만 구독할 수 있습니다.
                  </p>
                )}
                {keywords && keywords.length > 0 && keywords.length < 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    {3 - keywords.length}개 더 추가할 수 있습니다.
                  </p>
                )}

                {/* 키워드 목록 */}
                <div className="flex flex-wrap gap-2">
                  {keywords && keywords.length > 0 ? (
                    keywords.map((kw) => (
                      <div
                        key={kw.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-accent/50"
                      >
                        <span className="font-medium text-sm">{kw.keyword}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyword(kw.id)}
                          className="h-5 w-5 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2 w-full">
                      구독 중인 키워드가 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 추천 키워드 섹션 */}
              {(() => {
                const shouldShow = !loading && keywords && keywords.length < 3 && recommendations.length > 0
                console.log("[Recommendations] Render check:", {
                  loading,
                  keywordsLength: keywords?.length,
                  recommendationsLength: recommendations.length,
                  shouldShow
                })
                return null
              })()}
              {!loading && keywords && keywords.length < 3 && recommendations.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">💡</Badge>
                    <h3 className="font-semibold text-sm">이런 키워드는 어떠세요?</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    다른 사용자들이 많이 구독한 인기 키워드입니다
                  </p>

                  {recommendationsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recommendations.map((rec) => (
                        <Button
                          key={rec.keyword}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddRecommendedKeyword(rec.keyword)}
                          disabled={keywords?.length >= 3}
                          className="h-8 text-xs px-2.5"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {rec.keyword}
                          <Badge variant="secondary" className="ml-1.5 text-[9px] px-1 py-0">
                            {rec.subscriberCount}명
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">2</Badge>
                  <h3 className="font-semibold text-sm">이메일 알림</h3>
                </div>

                {/* 이메일 주소 & 이메일 활성화 토글 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="email-address" className="whitespace-nowrap">수신 이메일</Label>
                        <Input
                          id="email-address"
                          type="email"
                          value={emailForm.email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          disabled={!emailForm.enabled}
                          className={`flex-1 ${emailError && emailForm.enabled ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          placeholder="example@email.com"
                        />
                      </div>
                      {/* 이메일 에러 메시지 */}
                      {emailError && emailForm.enabled && (
                        <p className="text-xs text-red-500 pl-[88px]">{emailError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email-enabled" className="whitespace-nowrap">이메일 알림</Label>
                      <Switch
                        id="email-enabled"
                        checked={emailForm.enabled}
                        onCheckedChange={(checked) => setEmailForm((prev) => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 발송 요일 */}
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">발송 요일</Label>
                  <div className="flex gap-1">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                      <Button
                        key={index}
                        variant={emailForm.deliveryDays.includes(index) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDeliveryDay(index)}
                        disabled={!emailForm.enabled}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 발송 시간 */}
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">발송 시간</Label>
                  <div className="flex gap-3">
                    {[
                      { value: 6, label: "오전 6시" },
                      { value: 18, label: "오후 6시" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-1.5">
                        <input
                          type="radio"
                          id={`hour-${option.value}`}
                          name="delivery-hour"
                          value={option.value}
                          checked={emailForm.deliveryHour === option.value}
                          onChange={(e) =>
                            setEmailForm((prev) => ({ ...prev, deliveryHour: parseInt(e.target.value) }))
                          }
                          disabled={!emailForm.enabled}
                          className="h-4 w-4 text-primary focus:ring-primary"
                        />
                        <Label
                          htmlFor={`hour-${option.value}`}
                          className={!emailForm.enabled ? "text-muted-foreground" : "cursor-pointer"}
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 저장 및 테스트 버튼 */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEmailSettings}
                    className="flex-[2] h-9 text-sm"
                    disabled={!!emailError || !emailForm.email.trim()}
                  >
                    설정 저장
                  </Button>
                  <Button
                    onClick={handleTestEmailClick}
                    variant="outline"
                    disabled={sendingTestEmail || !emailForm.email || keywords.length === 0 || !!emailError}
                    className="flex-[1] h-9 text-sm"
                  >
                    {sendingTestEmail ? "전송 중..." : "메일보내기"}
                  </Button>
                </div>

                {/* 안내 문구 */}
                {emailForm.enabled && (
                  <Alert className="py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-[10px]">
                      선택한 요일{" "}
                      {emailForm.deliveryHour === 6 ? "오전 6시" : "오후 6시"}
                      에 구독 키워드당 최신 뉴스 5개씩 이메일로 받습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 최근 검색 키워드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>최근 검색 키워드</CardTitle>
                  </div>
                  <CardDescription>
                    내가 자주 검색한 키워드
                    {data?.recentSearches && data.recentSearches.length > 0 && (
                      <span className="ml-2">
                        (총 {data.recentSearches.length}개)
                      </span>
                    )}
                  </CardDescription>
                </div>
                {data?.recentSearches && data.recentSearches.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("모든 검색 기록을 삭제하시겠습니까?")) {
                        toast({
                          title: "🚧 준비 중",
                          description: "검색 기록 삭제 기능은 곧 추가됩니다.",
                        })
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data?.recentSearches && data.recentSearches.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {data.recentSearches
                      .slice((searchesPage - 1) * searchesPerPage, searchesPage * searchesPerPage)
                      .map((search, index) => {
                        const globalIndex = (searchesPage - 1) * searchesPerPage + index + 1
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{globalIndex}</Badge>
                              <div>
                                <div className="font-medium">{search.keyword}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(search.last_searched_at), { addSuffix: true, locale: ko })}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">{search.search_count}회</Badge>
                          </div>
                        )
                      })}
                  </div>

                  {/* 페이지네이션 */}
                  {data.recentSearches.length > searchesPerPage && (
                    <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchesPage((prev) => Math.max(1, prev - 1))}
                        disabled={searchesPage === 1}
                      >
                        이전
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.ceil(data.recentSearches.length / searchesPerPage) },
                          (_, i) => i + 1
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={searchesPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSearchesPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSearchesPage((prev) =>
                            Math.min(Math.ceil(data.recentSearches.length / searchesPerPage), prev + 1)
                          )
                        }
                        disabled={searchesPage === Math.ceil(data.recentSearches.length / searchesPerPage)}
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">검색 기록이 없습니다</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 하단: 북마크한 기사 (전체 너비) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <CardTitle>북마크한 기사</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {data?.recentBookmarks && data.recentBookmarks.length > 0 && (
                  <>
                    <Badge variant="secondary">{data.recentBookmarks.length}개</Badge>
                    <Button variant="ghost" size="sm" onClick={handleClearAllBookmarks}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentBookmarks && data.recentBookmarks.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.recentBookmarks
                    .slice((bookmarksPage - 1) * bookmarksPerPage, bookmarksPage * bookmarksPerPage)
                    .map((bookmark) => (
                      <a
                        key={bookmark.id}
                        href={bookmark.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="font-medium line-clamp-2">{bookmark.title}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {bookmark.source && <Badge variant="secondary">{bookmark.source}</Badge>}
                          {bookmark.category && <Badge variant="outline">{bookmark.category}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true, locale: ko })}
                        </div>
                      </a>
                    ))}
                </div>

                {/* 페이지네이션 */}
                {data.recentBookmarks.length > bookmarksPerPage && (
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookmarksPage((prev) => Math.max(1, prev - 1))}
                      disabled={bookmarksPage === 1}
                    >
                      이전
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.ceil(data.recentBookmarks.length / bookmarksPerPage) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          variant={bookmarksPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setBookmarksPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setBookmarksPage((prev) =>
                          Math.min(Math.ceil(data.recentBookmarks.length / bookmarksPerPage), prev + 1)
                        )
                      }
                      disabled={bookmarksPage === Math.ceil(data.recentBookmarks.length / bookmarksPerPage)}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">북마크한 기사가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 테스트 이메일 발송 확인 다이얼로그 */}
      <AlertDialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              테스트 이메일 발송
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-base">다음 정보로 테스트 이메일을 발송하시겠습니까?</p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-foreground">수신 주소</p>
                      <p className="text-muted-foreground">{emailForm.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Search className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-foreground">구독 키워드</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {keywords.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 최근 24시간 이내의 뉴스가 키워드별로 발송됩니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendTestEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              발송하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 저장하지 않은 변경사항 경고 다이얼로그 */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              저장하지 않은 변경사항
            </AlertDialogTitle>
            <AlertDialogDescription>
              뉴스 구독 정보를 변경했지만 저장하지 않았습니다.
              <br />
              저장하지 않고 페이지를 벗어나시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContinueWithoutSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
