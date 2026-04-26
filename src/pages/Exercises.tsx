import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  Clock,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';
import {
  intensityBadgeClass,
  intensityLabels,
  routineGroupLabels,
} from '@/lib/routines';
import { useRoutines } from '@/lib/useRoutines';
import type { Routine, RoutineGroup } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const groupOrder: RoutineGroup[] = [
  'hip_mobility',
  'legs',
  'upper_body',
  'full_body',
  'kb_only',
  'kb_bodyweight',
  'gym',
  'lower_body',
];
const REST_SEC = 30;

type DrillSegment = {
  kind: 'drill';
  exerciseIndex: number;
  exerciseName: string;
  prescription: string;
  label?: string;
  type: 'reps' | 'time';
  durationSec?: number;
  reps?: number;
};

type RestSegment = {
  kind: 'rest';
  durationSec: number;
  nextDrillName: string;
  nextDrillLabel?: string;
};

type Segment = DrillSegment | RestSegment;

function buildSegments(routine: Routine): Segment[] {
  const drills: DrillSegment[] = [];
  routine.exercises.forEach((ex, i) => {
    const labels: (string | undefined)[] = ex.segments ?? [undefined];
    for (const label of labels) {
      drills.push({
        kind: 'drill',
        exerciseIndex: i,
        exerciseName: ex.name,
        prescription: ex.prescription,
        label,
        type: ex.type,
        durationSec: ex.durationSec,
        reps: ex.reps,
      });
    }
  });
  const out: Segment[] = [];
  drills.forEach((d, i) => {
    out.push(d);
    const next = drills[i + 1];
    if (next) {
      out.push({
        kind: 'rest',
        durationSec: REST_SEC,
        nextDrillName: next.exerciseName,
        nextDrillLabel: next.label,
      });
    }
  });
  return out;
}

function initialRemaining(seg: Segment): number {
  if (seg.kind === 'rest') return seg.durationSec;
  if (seg.type === 'time') return seg.durationSec ?? 0;
  return 0;
}

function formatMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type RunningMode = {
  kind: 'running';
  routineId: string;
  segmentIndex: number;
  startedAt: number;
  completedSegments: Set<number>;
};

type CompleteMode = {
  kind: 'complete';
  routineId: string;
  totalSec: number;
  completedSegments: Set<number>;
};

type Mode = { kind: 'browse' } | RunningMode | CompleteMode;

export default function Exercises() {
  const [mode, setMode] = useState<Mode>({ kind: 'browse' });
  const routines = useRoutines();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (mode.kind === 'browse') return;
    if (!routines.find((r) => r.id === mode.routineId)) {
      setMode({ kind: 'browse' });
    }
  }, [mode, routines]);

  useEffect(() => {
    const requestedId = searchParams.get('routineId');
    if (!requestedId) return;
    if (mode.kind !== 'browse') return;
    if (routines.length === 0) return;
    const target = routines.find((r) => r.id === requestedId);
    if (target) {
      setMode({
        kind: 'running',
        routineId: target.id,
        segmentIndex: 0,
        startedAt: Date.now(),
        completedSegments: new Set<number>(),
      });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('routineId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, routines, mode.kind]);

  if (mode.kind === 'browse') {
    return (
      <BrowseView
        onStart={(routine) =>
          setMode({
            kind: 'running',
            routineId: routine.id,
            segmentIndex: 0,
            startedAt: Date.now(),
            completedSegments: new Set<number>(),
          })
        }
      />
    );
  }

  const routine = routines.find((r) => r.id === mode.routineId);
  if (!routine) return null;

  if (mode.kind === 'running') {
    return <RunnerView routine={routine} mode={mode} setMode={setMode} />;
  }

  return (
    <CompleteView
      routine={routine}
      totalSec={mode.totalSec}
      completedSegments={mode.completedSegments}
      onDone={() => setMode({ kind: 'browse' })}
    />
  );
}

// ---------- Browse ----------

interface BrowseViewProps {
  onStart: (routine: Routine) => void;
}

function BrowseView({ onStart }: BrowseViewProps) {
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
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <p className="text-sm text-muted-foreground">
          Pick a routine to run it. Each drill shows a timer or rep counter, with
          30s of rest in between.
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
                  onStart={() => onStart(routine)}
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
  onStart: () => void;
}

function RoutineCard({ routine, open, onToggle, onStart }: RoutineCardProps) {
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
          <Button onClick={onStart} size="lg" className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Start routine
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Runner ----------

interface RunnerViewProps {
  routine: Routine;
  mode: RunningMode;
  setMode: (mode: Mode) => void;
}

function RunnerView({ routine, mode, setMode }: RunnerViewProps) {
  const segments = useMemo(() => buildSegments(routine), [routine]);
  const segment = segments[mode.segmentIndex];

  const [isPaused, setIsPaused] = useState(false);
  const [remaining, setRemaining] = useState<number>(() =>
    segment ? initialRemaining(segment) : 0,
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!segment) return;
    setRemaining(initialRemaining(segment));
    setIsPaused(false);
  }, [mode.segmentIndex, segment]);

  useEffect(() => {
    if (!segment) return;
    if (isPaused) return;
    if (segment.kind === 'drill' && segment.type === 'reps') return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode.segmentIndex, isPaused, segment]);

  useEffect(() => {
    if (!segment) return;
    if (segment.kind === 'drill' && segment.type === 'reps') return;
    if (remaining !== 0) return;
    finishCurrentSegment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!segment) return null;

  function finishCurrentSegment() {
    const completed = new Set(mode.completedSegments);
    if (segment && segment.kind === 'drill') completed.add(mode.segmentIndex);
    advanceTo(mode.segmentIndex + 1, completed);
  }

  function skipSegment() {
    advanceTo(mode.segmentIndex + 1, mode.completedSegments);
  }

  function goBack() {
    if (mode.segmentIndex === 0) return;
    setMode({ ...mode, segmentIndex: mode.segmentIndex - 1 });
  }

  function advanceTo(nextIdx: number, completedSegments: Set<number>) {
    if (nextIdx >= segments.length) {
      setMode({
        kind: 'complete',
        routineId: routine.id,
        totalSec: Math.round((Date.now() - mode.startedAt) / 1000),
        completedSegments,
      });
      return;
    }
    setMode({ ...mode, segmentIndex: nextIdx, completedSegments });
  }

  const drillNumbers = useMemo(() => {
    const map = new Map<number, { index: number; total: number }>();
    let idx = 0;
    let total = 0;
    for (const s of segments) if (s.kind === 'drill') total++;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (s && s.kind === 'drill') {
        idx++;
        map.set(i, { index: idx, total });
      }
    }
    return map;
  }, [segments]);

  const progressLabel = (() => {
    if (segment.kind === 'rest') return 'Rest';
    const p = drillNumbers.get(mode.segmentIndex);
    return p ? `Drill ${p.index} of ${p.total}` : '';
  })();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowExitConfirm(true)}
          aria-label="Exit session"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold">{routine.name}</p>
          <p className="text-xs text-muted-foreground">{progressLabel}</p>
        </div>
        <div className="w-10" aria-hidden />
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        {segment.kind === 'rest' ? (
          <RestPanel
            remaining={remaining}
            totalSec={segment.durationSec}
            nextDrillName={segment.nextDrillName}
            nextDrillLabel={segment.nextDrillLabel}
            onSkipRest={skipSegment}
          />
        ) : segment.type === 'time' ? (
          <TimeDrillPanel
            segment={segment}
            remaining={remaining}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
          />
        ) : (
          <RepsDrillPanel segment={segment} onDone={finishCurrentSegment} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goBack}
          disabled={mode.segmentIndex === 0}
          aria-label="Previous segment"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsPaused((p) => !p)}
          disabled={segment.kind === 'drill' && segment.type === 'reps'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <Play className="h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={skipSegment}
          aria-label="Skip segment"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {showExitConfirm && (
        <ExitConfirmDialog
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => setMode({ kind: 'browse' })}
        />
      )}
    </div>
  );
}

// ---------- Runner panels ----------

interface RestPanelProps {
  remaining: number;
  totalSec: number;
  nextDrillName: string;
  nextDrillLabel?: string;
  onSkipRest: () => void;
}

function RestPanel({
  remaining,
  totalSec,
  nextDrillName,
  nextDrillLabel,
  onSkipRest,
}: RestPanelProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Rest
      </p>
      <CountdownRing remaining={remaining} total={totalSec} />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Next up
        </p>
        <p className="mt-1 text-lg font-semibold">{nextDrillName}</p>
        {nextDrillLabel && (
          <p className="mt-0.5 text-sm text-muted-foreground">{nextDrillLabel}</p>
        )}
      </div>
      <Button variant="ghost" onClick={onSkipRest}>
        Skip rest
      </Button>
    </div>
  );
}

interface TimeDrillPanelProps {
  segment: DrillSegment;
  remaining: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

function TimeDrillPanel({
  segment,
  remaining,
  isPaused,
  onTogglePause,
}: TimeDrillPanelProps) {
  const total = segment.durationSec ?? 0;
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {segment.prescription}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{segment.exerciseName}</h2>
        {segment.label && (
          <p className="mt-1 text-sm font-medium text-primary">
            {segment.label}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onTogglePause}
        className="rounded-full transition-opacity hover:opacity-80"
        aria-label={isPaused ? 'Resume' : 'Pause'}
      >
        <CountdownRing remaining={remaining} total={total} paused={isPaused} />
      </button>
      {isPaused && (
        <p className="text-sm font-medium text-muted-foreground">Paused</p>
      )}
    </div>
  );
}

interface RepsDrillPanelProps {
  segment: DrillSegment;
  onDone: () => void;
}

function RepsDrillPanel({ segment, onDone }: RepsDrillPanelProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {segment.prescription}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{segment.exerciseName}</h2>
        {segment.label && (
          <p className="mt-1 text-sm font-medium text-primary">
            {segment.label}
          </p>
        )}
      </div>
      <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5">
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums">{segment.reps ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            reps
          </p>
        </div>
      </div>
      <Button onClick={onDone} size="lg" className="min-w-[8rem]">
        <Check className="mr-2 h-5 w-5" />
        Done
      </Button>
    </div>
  );
}

interface CountdownRingProps {
  remaining: number;
  total: number;
  paused?: boolean;
}

function CountdownRing({ remaining, total, paused }: CountdownRingProps) {
  const size = 192;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? remaining / total : 0;
  const offset = c * (1 - pct);

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        className={cn(
          'stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear',
          paused && 'opacity-50',
        )}
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-4xl font-bold tabular-nums"
      >
        {formatMMSS(remaining)}
      </text>
    </svg>
  );
}

interface ExitConfirmDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

function ExitConfirmDialog({ onCancel, onConfirm }: ExitConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Exit session?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your progress so far will be discarded.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Keep going
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Complete ----------

interface CompleteViewProps {
  routine: Routine;
  totalSec: number;
  completedSegments: Set<number>;
  onDone: () => void;
}

function CompleteView({
  routine,
  totalSec,
  completedSegments,
  onDone,
}: CompleteViewProps) {
  const segments = useMemo(() => buildSegments(routine), [routine]);

  const exerciseStatus = useMemo(() => {
    return routine.exercises.map((_, exIdx) => {
      const drillIndexes: number[] = [];
      segments.forEach((s, i) => {
        if (s.kind === 'drill' && s.exerciseIndex === exIdx) drillIndexes.push(i);
      });
      const allDone = drillIndexes.every((i) => completedSegments.has(i));
      return allDone ? 'done' : 'skipped';
    });
  }, [routine, segments, completedSegments]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Complete
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {routine.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Total time: {formatMMSS(totalSec)}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drills
        </p>
        <ul className="mt-3 space-y-2">
          {routine.exercises.map((ex, i) => {
            const status = exerciseStatus[i];
            return (
              <li
                key={`${routine.id}-${i}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex gap-2">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                      status === 'done'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-muted-foreground/40',
                    )}
                  >
                    {status === 'done' && <Check className="h-3 w-3" />}
                  </span>
                  <span className="text-sm">{ex.name}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {ex.prescription}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <Button onClick={onDone} size="lg" className="w-full">
        Done
      </Button>
    </div>
  );
}
