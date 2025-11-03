"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useEmailSettings } from "@/hooks/useEmailSettings";
import { LoginModal } from "@/components/auth/login-modal";
import { useRouter } from "next/navigation";

export function FloatingSubscribeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user } = useAuth();
  const { settings } = useEmailSettings();
  const router = useRouter();

  // 구독 중인지 확인 (enabled가 true일 때만 구독 중으로 간주)
  const isSubscribed = settings?.enabled === true;

  const handleClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      // 로그인된 경우 마이페이지로 이동
      router.push("/mypage");
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="뉴스레터 구독"
      >
        <div className="relative">
          {/* 펄스 애니메이션 배경 - 구독 중이 아닐 때만 표시 */}
          {!isSubscribed && (
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
          )}

          {/* 메인 버튼 */}
          <div className="relative flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Mail className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">
              {user ? "구독 관리" : "무료 구독"}
            </span>
          </div>
        </div>
      </button>

      {/* 로그인 모달 */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      {/* 구독 안내 다이얼로그 (옵션) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI 뉴스레터 구독하기</DialogTitle>
            <DialogDescription>
              매일 아침, AI가 선별한 핵심 뉴스를 받아보세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">구독 혜택</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>AI가 요약한 핵심 뉴스</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>관심 키워드별 맞춤 뉴스</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>원하는 요일과 시간에 배송</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>주요 트렌드 한눈에 정리</span>
                </li>
              </ul>
            </div>
            <Button onClick={handleClick} className="w-full" size="lg">
              {user ? "구독 설정하기" : "로그인하고 시작하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
