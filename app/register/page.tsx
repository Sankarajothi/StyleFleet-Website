'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OwnerRegistrationView } from '@/components/owner-registration';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';

  return (
    <OwnerRegistrationView
      initialPhone={phoneParam}
      onBackToLogin={() => router.push('/')}
      onRegistrationComplete={() => router.push('/dashboard')}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07152B] flex flex-col items-center justify-center text-white select-none">
          <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
          <p className="text-xs font-bold tracking-[0.2em] text-[#A7B0C3] uppercase">
            Loading StyleFleet Registration...
          </p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
