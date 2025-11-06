"use client";

import { useState, useEffect } from "react";
import { Mail, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/auth/login-modal";
import { useRouter } from "next/navigation";

export function HeroSubscribeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("heroSubscribeBannerVisible");
      if (stored !== null) {
        setIsVisible(stored === "true");
      }
    }
  }, []);

  // isVisible 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("heroSubscribeBannerVisible", String(isVisible));
    }
  }, [isVisible]);

  const handleSubscribe = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      router.push("/mypage");
    }
  };

  if (!isVisible) return null;

  // 로그인된 사용자에게는 배너를 표시하지 않음
  if (user) return null;

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-y border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* 왼쪽: 메시지 */}
            <div className="flex-1 space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AI가 선별한 핵심 뉴스를 매일 받아보세요
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="text-primary">✓</span>
                  <span>AI 요약</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary">✓</span>
                  <span>맞춤 키워드</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary">✓</span>
                  <span>시간 선택</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary">✓</span>
                  <span>무료</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 버튼 */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubscribe}
                size="default"
                className="gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Mail className="h-4 w-4" />
                {user ? "구독 관리" : "무료 구독"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="shrink-0"
                aria-label="배너 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      </div>

      {/* 로그인 모달 */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}
