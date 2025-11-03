"use client";

import { useState } from "react";
import { Mail, Sparkles, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/auth/login-modal";
import { useRouter } from "next/navigation";

export function Footer() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubscribe = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      router.push("/mypage");
    }
  };

  return (
    <>
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          {/* 구독 섹션 */}
          <div className="mb-12 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">오늘부터 뉴스 탐색 시간을 절반으로 줄이세요</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                AI가 매일 아침 핵심 뉴스만 골라서 정리해드립니다
              </p>
            </div>

            {/* 구독 혜택 */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">AI 요약</div>
                  <div className="text-xs text-muted-foreground">핵심만 빠르게</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">트렌드 리포트</div>
                  <div className="text-xs text-muted-foreground">인기 키워드 분석</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">키워드 인사이트</div>
                  <div className="text-xs text-muted-foreground">맞춤형 뉴스</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">주간 하이라이트</div>
                  <div className="text-xs text-muted-foreground">놓친 뉴스 정리</div>
                </div>
              </div>
            </div>

            <Button onClick={handleSubscribe} size="lg" className="gap-2">
              <Mail className="h-5 w-5" />
              {user ? "구독 관리" : "무료 구독"}
            </Button>
          </div>

          {/* 하단 정보 */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                © 2025 Pulse News Aggregator. All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 로그인 모달 */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}
