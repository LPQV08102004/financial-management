"use client";

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const { state } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (state.isLoading) return;

    if (state.userToken) {
      router.push('/home');
    } else {
      router.push('/auth/login');
    }
    setIsChecking(false);
  }, [state.userToken, state.isLoading, router]);

  if (isChecking || state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#075c09]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  return null;
}