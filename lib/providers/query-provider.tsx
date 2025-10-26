"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTime: 데이터가 신선한 상태로 유지되는 시간 (5분)
            staleTime: 5 * 60 * 1000,
            // gcTime: 캐시가 유지되는 시간 (10분)
            gcTime: 10 * 60 * 1000,
            // refetchOnWindowFocus: 윈도우 포커스 시 자동 갱신
            refetchOnWindowFocus: false,
            // retry: 실패 시 재시도 횟수
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
