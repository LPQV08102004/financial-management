"use client";

import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.userToken) {
      router.push('/dashboard');
    }
  }, [state.userToken, router]);

  return <>{children}</>;
}
