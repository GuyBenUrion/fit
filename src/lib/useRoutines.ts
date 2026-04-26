import { useAppStore } from '@/store/useAppStore';
import { friendRoutines } from '@/lib/friendRoutines';
import { yaelRoutines } from '@/lib/yaelRoutines';
import { routines } from '@/lib/routines';
import type { Routine } from '@/lib/types';

const FRIEND_EMAIL = 'chompan98@gmail.com';
const YAEL_EMAIL = 'yaelgilat57@gmail.com';

export function useRoutines(): Routine[] {
  const email = useAppStore((s) => s.user?.email);
  if (email === FRIEND_EMAIL) return friendRoutines;
  if (email === YAEL_EMAIL) return yaelRoutines;
  return routines;
}
