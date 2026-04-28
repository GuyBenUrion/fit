import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExercises, useExercisesLoading } from '@/lib/useRoutines';
import {
  bodyPartLabels,
  exerciseCategoryLabels,
} from '@/lib/routineLabels';
import type { BodyPart, Exercise, ExerciseCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const ALL_CATEGORIES: ExerciseCategory[] = [
  'stretch_mobility',
  'body_weight',
  'gym',
  'kb',
];

export function ExercisePicker({ onSelect, onClose }: ExercisePickerProps) {
  const exercises = useExercises();
  const loading = useExercisesLoading();
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<ExerciseCategory>>(
    new Set(),
  );
  const [activeBodyParts, setActiveBodyParts] = useState<Set<BodyPart>>(
    new Set(),
  );
  const [showBodyParts, setShowBodyParts] = useState(false);

  const allBodyParts = useMemo(() => {
    const set = new Set<BodyPart>();
    for (const ex of exercises) for (const bp of ex.bodyParts) set.add(bp);
    return Array.from(set).sort((a, b) =>
      bodyPartLabels[a].localeCompare(bodyPartLabels[b]),
    );
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (activeCategories.size > 0 && !activeCategories.has(ex.category))
        return false;
      if (
        activeBodyParts.size > 0 &&
        !ex.bodyParts.some((bp) => activeBodyParts.has(bp))
      )
        return false;
      if (q) {
        const haystack: string[] = [
          ex.name.toLowerCase(),
          exerciseCategoryLabels[ex.category].toLowerCase(),
        ];
        for (const bp of ex.bodyParts) {
          haystack.push(bodyPartLabels[bp].toLowerCase());
          haystack.push(bp);
        }
        if (!haystack.some((h) => h.includes(q))) return false;
      }
      return true;
    });
  }, [exercises, search, activeCategories, activeBodyParts]);

  const toggleCategory = (c: ExerciseCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const toggleBodyPart = (bp: BodyPart) => {
    setActiveBodyParts((prev) => {
      const next = new Set(prev);
      if (next.has(bp)) next.delete(bp);
      else next.add(bp);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCategories(new Set());
    setActiveBodyParts(new Set());
  };

  const hasFilters =
    search.length > 0 || activeCategories.size > 0 || activeBodyParts.size > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-2xl flex-col rounded-t-lg border bg-card shadow-lg sm:h-[80vh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Add a drill</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3 border-b px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drills, body parts, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={activeCategories.has(c)}
                onClick={() => toggleCategory(c)}
              >
                {exerciseCategoryLabels[c]}
              </Chip>
            ))}
            <Chip
              active={showBodyParts || activeBodyParts.size > 0}
              onClick={() => setShowBodyParts((v) => !v)}
            >
              Body parts
              {activeBodyParts.size > 0 && ` (${activeBodyParts.size})`}
            </Chip>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {showBodyParts && (
            <div className="flex flex-wrap gap-1.5 rounded-md border bg-background/50 p-2">
              {allBodyParts.map((bp) => (
                <Chip
                  key={bp}
                  active={activeBodyParts.has(bp)}
                  onClick={() => toggleBodyPart(bp)}
                >
                  {bodyPartLabels[bp]}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading && exercises.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading exercises…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No drills match your filters.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ex)}
                    className="flex w-full items-start justify-between gap-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{ex.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {exerciseCategoryLabels[ex.category]}
                        {ex.bodyParts.length > 0 && ' · '}
                        {ex.bodyParts.map((bp) => bodyPartLabels[bp]).join(', ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      {ex.type === 'reps' ? 'Reps' : 'Time'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
