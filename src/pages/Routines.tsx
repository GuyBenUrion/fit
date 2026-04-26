import { useMemo, useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { intensityLabels, routineGroupLabels } from '@/lib/routines';
import { useRoutines } from '@/lib/useRoutines';
import type { Routine, RoutineGroup } from '@/lib/types';
import { cn } from '@/lib/utils';

const groupOrder: RoutineGroup[] = [
  'hip_mobility',
  'legs',
  'upper_body',
  'full_body',
  'kb_only',
  'kb_bodyweight',
  'gym',
];

const intensityBadgeClass: Record<Routine['intensity'], string> = {
  deep: 'bg-destructive/10 text-destructive',
  medium: 'bg-primary/10 text-primary',
  light: 'bg-muted text-muted-foreground',
  dynamic: 'bg-secondary text-secondary-foreground',
};

export default function Routines() {
  const [openId, setOpenId] = useState<string | null>(null);
  const routines = useRoutines();

  const grouped = useMemo(() => {
    const out = new Map<RoutineGroup, Routine[]>();
    for (const g of groupOrder) out.set(g, []);
    for (const r of routines) out.get(r.group)?.push(r);
    return out;
  }, [routines]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
        <p className="text-sm text-muted-foreground">
          {routines.length} hardcoded sessions. Tap one to see the exercises and why it works.
        </p>
      </div>

      {groupOrder.map((group) => {
        const items = grouped.get(group) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {routineGroupLabels[group]}
            </h2>
            <div className="space-y-2">
              {items.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  open={openId === routine.id}
                  onToggle={() =>
                    setOpenId((curr) => (curr === routine.id ? null : routine.id))
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface RoutineCardProps {
  routine: Routine;
  open: boolean;
  onToggle: () => void;
}

function RoutineCard({ routine, open, onToggle }: RoutineCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              #{routine.number}
            </span>
            <span className="text-sm font-semibold">{routine.name}</span>
          </div>
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
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t bg-background/50 px-4 py-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When to do it
            </p>
            <p className="mt-1 text-foreground">{routine.whenToDo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it works
            </p>
            <p className="mt-1 text-foreground">{routine.whyItWorks}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exercises
            </p>
            <ol className="mt-2 divide-y rounded-md border">
              {routine.exercises.map((ex, i) => (
                <li
                  key={`${routine.id}-${i}`}
                  className="flex items-start justify-between gap-3 px-3 py-2"
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
      )}
    </div>
  );
}
