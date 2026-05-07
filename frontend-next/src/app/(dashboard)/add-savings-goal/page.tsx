"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AddSavingsGoalScreen from '@/src/screens/AddSavingsGoalScreen';
import { getGoal } from '@/src/api/savingsApi';

export default function AddSavingsGoalPage() {
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goalId');
  const [existingGoal, setExistingGoal] = useState<any>(null);
  const [loading, setLoading] = useState(!!goalId);

  useEffect(() => {
    if (!goalId) return;
    getGoal(goalId)
      .then(setExistingGoal)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [goalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" />
      </div>
    );
  }

  return <AddSavingsGoalScreen existingGoal={existingGoal ?? undefined} />;
}
