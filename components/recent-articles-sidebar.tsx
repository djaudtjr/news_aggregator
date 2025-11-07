"use client"

import { useState, useEffect } from "react"
import { History, X, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecentArticles, type RecentArticle } from "@/hooks/useRecentArticles"
import { useAuth } from "@/hooks/useAuth"

interface RecentArticlesSidebarProps {
  onArticleClick?: (article: RecentArticle) => void
  totalNewsCount?: number
  currentPage?: number
  totalPages?: number
}

export function RecentArticlesSidebar({ onArticleClick, totalNewsCount, currentPage, totalPages }: RecentArticlesSidebarProps) {
  const { recentArticles, removeRecentArticle, clearRecentArticles } = useRecentArticles()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isBannerVisible, setIsBannerVisible] = useState(true)

  // 클라이언트에서만 localStorage 읽기 및 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("heroSubscribeBannerVisible")
        setIsBannerVisible(stored !== null ? stored === "true" : true)
      }
    }

    // 초기 값 설정
    handleStorageChange()

    // localStorage 변경 감지
    window.addEventListener("storage", handleStorageChange)

    // 같은 탭에서의 변경도 감지하기 위해 주기적으로 체크
    const interval = setInterval(handleStorageChange, 100)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // top 위치 계산 (뉴스 카드의 top 라인과 일치)
  const calculateTopPosition = () => {
    // Header: 64px (h-16)
    // CategoryBar: 80px (py-2 8px * 2 + h-16 64px)
    // MainPadding: 24px (md:py-6)
    // Banner: 88px (py-4 16px * 2 + content ~56px)

    const headerHeight = 64
    const categoryBarHeight = 80
    const mainPaddingTop = 24
    const bannerHeight = 88

    // 배너가 표시되는 조건: 로그인하지 않았고 배너가 visible 상태
    const showBanner = !user && isBannerVisible

    const baseTop = headerHeight + categoryBarHeight + mainPaddingTop
    return showBanner ? baseTop + bannerHeight : baseTop
  }

  const handleArticleClick = (article: RecentArticle) => {
    if (onArticleClick) {
      onArticleClick(article)
    } else {
      window.open(article.link, "_blank", "noopener,noreferrer")
    }
  }

  const handleRemove = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation()
    removeRecentArticle(articleId)
  }

  const handleClearAll = () => {
    if (confirm("최근 본 기사를 모두 삭제하시겠습니까?")) {
      clearRecentArticles()
    }
  }

  const shouldShowPaginationInfo =
    typeof totalNewsCount === "number" &&
    totalNewsCount > 0 &&
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    totalPages > 0

  return (
    <div
      style={{
        position: 'fixed',
        right: '16px',
        top: `${calculateTopPosition()}px`,
        width: isExpanded ? '200px' : '40px',
        zIndex: 9999,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          padding: '8px',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        {shouldShowPaginationInfo && isExpanded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px',
              padding: '6px 8px',
              borderRadius: '8px',
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              총 {totalNewsCount?.toLocaleString()}건
            </span>
            <span style={{ fontSize: '11px', opacity: 0.6 }}>|</span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              Page {currentPage}/{totalPages}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isExpanded ? '8px' : '0',
            paddingLeft: '4px',
            paddingRight: '4px',
            transition: 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "접기" : "펼치기"}
              className="h-5 w-5 rounded-full hover:bg-accent shrink-0"
            >
              {isExpanded ? (
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300" />
              )}
            </Button>
            {isExpanded && (
              <>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: isExpanded ? 1 : 0,
                    transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  최근 본 기사
                </span>
                {recentArticles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-3 px-1 text-[9px]"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {recentArticles.length}
                  </Badge>
                )}
              </>
            )}
          </div>
          {isExpanded && recentArticles.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearAll}
              title="전체 삭제"
              className="h-5 w-5 rounded-full hover:bg-accent shrink-0"
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* 기사 목록 */}
        <div
          style={{
            maxHeight: isExpanded ? 'calc(100vh - 220px)' : '0',
            overflowY: 'auto',
            opacity: isExpanded ? 1 : 0,
            transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isExpanded && (
            <>
              {recentArticles.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <History className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p style={{ fontSize: '10px' }}>
                    아직 본 기사가
                    <br />
                    없습니다
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentArticles.slice(0, 10).map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  style={{
                    position: 'relative',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    animation: isExpanded ? `slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both` : 'none',
                  }}
                  className="group hover:bg-accent"
                >
                  {article.imageUrl && (
                    <div style={{ width: '100%', height: '64px', overflow: 'hidden' }}>
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.2s',
                        }}
                        className="group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '6px' }}>
                    <h4
                      style={{
                        fontSize: '10px',
                        fontWeight: '500',
                        lineHeight: '1.3',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {article.title}
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          color: 'var(--muted-foreground)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {article.source}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        onClick={(e) => handleRemove(e, article.id)}
                        title="삭제"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 애니메이션 키프레임 */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
