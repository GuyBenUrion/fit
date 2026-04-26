import { useAppStore } from '@/store/useAppStore';
import { friendRoutines } from '@/lib/friendRoutines';
import { routines } from '@/lib/routines';
import type { Routine } from '@/lib/types';

const FRIEND_EMAIL = 'chompan98@gmail.com';

export function useRoutines(): Routine[] {
  const email = useAppStore((s) => s.user?.email);
  return email === FRIEND_EMAIL ? friendRoutines : routines;
}
