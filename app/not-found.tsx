'use client'

import NotFoundPage from "@/components/ui/page-not-found"
import { useRouter } from "next/navigation"

export default function Custom404() {
  const router = useRouter()
  return (
    <NotFoundPage 
      onGoBack={() => router.back()} 
      onGoHome={() => router.push("/")} 
    />
  )
}
