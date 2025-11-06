"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Sparkles, Bookmark, TrendingUp, Filter, Clock, Mail, Lightbulb, Zap, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserGuideModal({ open, onOpenChange }: UserGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
            📱 Pulse 뉴스 앱 사용 가이드
          </DialogTitle>
          <DialogDescription>
            Pulse를 더욱 효과적으로 사용하는 방법을 알아보세요
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">주요 기능</TabsTrigger>
            <TabsTrigger value="tips">팁 & 트릭</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* 주요 기능 탭 */}
          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* 뉴스 검색 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    뉴스 검색
                    <Badge variant="secondary" className="text-[10px]">기본</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    키워드를 입력하고 Enter 키를 누르거나 돋보기 아이콘을 클릭하세요.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 데스크톱: 상단 검색창 이용</li>
                    <li>• 모바일: 카테고리 옆 검색창 이용</li>
                    <li>• 자동 오타 교정 기능 제공</li>
                  </ul>
                </div>
              </div>

              {/* AI 요약 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    AI 요약
                    <Badge variant="secondary" className="text-[10px]">인기</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    긴 기사를 AI가 핵심 포인트로 요약해드립니다.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 뉴스 카드의 "AI 요약" 버튼 클릭</li>
                    <li>• 요약 완료 후 자동으로 모달 표시</li>
                    <li>• 요약된 내용은 캐시되어 빠르게 재로딩</li>
                  </ul>
                </div>
              </div>

              {/* 북마크 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Bookmark className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    북마크
                    <Badge variant="secondary" className="text-[10px]">로그인 필요</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    관심있는 뉴스를 저장하고 나중에 다시 볼 수 있습니다.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 뉴스 이미지 위 북마크 아이콘 클릭</li>
                    <li>• 마이페이지에서 저장된 북마크 확인</li>
                    <li>• 로그인 후 사용 가능</li>
                  </ul>
                </div>
              </div>

              {/* 인기 검색어 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    인기 검색어
                    <Badge variant="destructive" className="text-[10px]">LIVE</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    실시간으로 많이 검색되는 키워드를 확인하세요.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 키워드 클릭으로 빠른 검색</li>
                    <li>• 1시간, 24시간, 7일 기간 선택 가능</li>
                    <li>• 실시간 업데이트</li>
                  </ul>
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Filter className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">카테고리 필터</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    원하는 분야의 뉴스만 골라서 볼 수 있습니다.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 정치, 경제, IT, 스포츠, 연예 등</li>
                    <li>• 지역 필터: 국내/해외</li>
                    <li>• 기간 필터: 1시간~30일</li>
                  </ul>
                </div>
              </div>

              {/* 이메일 구독 */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    이메일 구독
                    <Badge variant="secondary" className="text-[10px]">로그인 필요</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    관심 키워드의 뉴스를 매일 이메일로 받아보세요.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 마이페이지에서 구독 설정</li>
                    <li>• 키워드, 발송 시간, 요일 설정 가능</li>
                    <li>• AI 요약 포함된 다이제스트</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 팁 & 트릭 탭 */}
          <TabsContent value="tips" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">키보드 단축키</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter 키를 눌러 빠르게 검색하세요. 검색창에 포커스가 있을 때 작동합니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <Zap className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">필터 조합하기</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    카테고리 + 지역 + 기간을 조합하여 정확한 뉴스를 찾으세요.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예: "IT 카테고리 + 국내 + 24시간" = 최근 24시간 국내 IT 뉴스
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <Star className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">AI 요약 활용</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    AI 요약은 한 번 생성되면 캐시되어 빠르게 다시 볼 수 있습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 팁: 요약 완료 후 모달이 자동으로 열립니다. 닫았다가 다시 보려면 팝업 아이콘을 클릭하세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
                <Clock className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">최근 본 기사</h3>
                  <p className="text-sm text-muted-foreground">
                    원문 보기 또는 AI 요약을 클릭하면 자동으로 최근 본 기사에 저장됩니다. 오른쪽 사이드바에서 확인하세요.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">모바일 최적화</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• 스와이프로 뉴스 카드 탐색</li>
                  <li>• 카테고리 옆 검색창으로 빠른 검색</li>
                  <li>• 인기 검색어는 2줄까지 표시됩니다</li>
                  <li>• 모든 기능이 터치에 최적화되어 있습니다</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* FAQ 탭 */}
          <TabsContent value="faq" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. 로그인하지 않아도 사용할 수 있나요?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 네! 뉴스 검색, AI 요약, 카테고리 필터 등 대부분의 기능을 로그인 없이 사용할 수 있습니다.
                  북마크와 이메일 구독 기능은 로그인이 필요합니다.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. AI 요약은 무료인가요?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 네, AI 요약 기능은 완전 무료입니다. 원하는 만큼 사용하세요!
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. 뉴스는 얼마나 자주 업데이트되나요?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 뉴스는 실시간으로 수집되며, 인기 검색어는 2분마다 자동으로 업데이트됩니다.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. 이메일 구독은 어떻게 설정하나요?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 로그인 후 마이페이지에서 구독할 키워드, 발송 시간, 요일을 설정할 수 있습니다.
                  매일 선택한 시간에 AI 요약이 포함된 뉴스 다이제스트를 받아보세요.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. 검색이 제대로 안 될 때는?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 자동 오타 교정 기능이 있지만, 정확한 키워드를 입력하면 더 좋은 결과를 얻을 수 있습니다.
                  또한 카테고리와 지역 필터를 활용해보세요.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Q. 다크모드를 사용할 수 있나요?</h3>
                <p className="text-sm text-muted-foreground">
                  A. 네! 헤더 오른쪽의 테마 토글 버튼으로 라이트/다크 모드를 전환할 수 있습니다.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
