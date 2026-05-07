"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import EditNotificationScreen from '@/src/screens/EditNotificationScreen';

function EditNotificationContent() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  return <EditNotificationScreen reminderId={id} />;
}

export default function EditNotificationPage() {
  return (
    <Suspense>
      <EditNotificationContent />
    </Suspense>
  );
}

