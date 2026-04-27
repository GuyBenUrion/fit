import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Shuffle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRoutines, useRoutinesLoading } from '@/lib/useRoutines';
import {
  intensityBadgeClass,
  intensityLabels,
  routineGroupLabels,
} from '@/lib/routineLabels';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function pickIndex(length: number, exclude?: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * length);
  if (exclude !== undefined && idx === exclude) {
    idx = (idx + 1) % length;
  }
  return idx;
}

export default function Today() {
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const routines = useRoutines();
  const loading = useRoutinesLoading();
  const navigate = useNavigate();

  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null && routines.length > 0) {
      setIndex(pickIndex(routines.length));
    }
  }, [routines.length, index]);

  const routine = index !== null ? routines[index] : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email ?? 'unknown'}
        </p>
      </div>

      {routine ? (
        <div className="space-y-3 rounded-lg border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Random pick · {routineGroupLabels[routine.group]}
              </p>
              <h2 className="text-xl font-semibold">{routine.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {routine.durationMin} min
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    intensityBadgeClass[routine.intensity],
                  )}
                >
                  {intensityLabels[routine.intensity]}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((curr) => pickIndex(routines.length, curr ?? undefined))}
            >
              <Shuffle className="mr-1 h-3 w-3" />
              Shuffle
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={() => navigate(`/exercises?routineId=${routine.id}`)}
          >
            <Play className="mr-2 h-4 w-4" />
            Start routine
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When to do it
            </p>
            <p className="mt-1 text-sm">{routine.whenToDo}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exercises
            </p>
            <ol className="mt-2 divide-y rounded-md border">
              {routine.exercises.map((ex, i) => (
                <li
                  key={`${routine.id}-${i}`}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="flex gap-2">
                    <span className="w-5 shrink-0 text-xs text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span>{ex.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ex.prescription}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading routines…' : 'No routines available.'}
          </p>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
