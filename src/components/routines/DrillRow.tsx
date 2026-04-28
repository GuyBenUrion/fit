import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { autoPrescription } from '@/lib/prescription';
import { exerciseCategoryLabels } from '@/lib/routineLabels';
import type { BodyPart, ExerciseCategory } from '@/lib/types';

export interface EditorDrill {
  exerciseId: string;
  name: string;
  type: 'reps' | 'time';
  category: ExerciseCategory;
  bodyParts: BodyPart[];
  defaultDurationSec?: number;
  defaultReps?: number;
  defaultSegments?: string[];
  durationSec?: number;
  reps?: number;
  segments?: string[];
  restSec?: number;
}

interface DrillRowProps {
  drill: EditorDrill;
  index: number;
  total: number;
  defaultRestSec: number;
  onChange: (next: EditorDrill) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function DrillRow({
  drill,
  index,
  total,
  defaultRestSec,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: DrillRowProps) {
  const prescription = autoPrescription(drill);

  const setReps = (value: string) => {
    const n = parseInt(value, 10);
    onChange({ ...drill, reps: Number.isFinite(n) && n >= 0 ? n : undefined });
  };
  const setDuration = (value: string) => {
    const n = parseInt(value, 10);
    onChange({
      ...drill,
      durationSec: Number.isFinite(n) && n >= 0 ? n : undefined,
    });
  };
  const setRest = (value: string) => {
    if (value.trim() === '') {
      onChange({ ...drill, restSec: undefined });
      return;
    }
    const n = parseInt(value, 10);
    onChange({ ...drill, restSec: Number.isFinite(n) && n >= 0 ? n : undefined });
  };

  const setSegmentAt = (i: number, value: string) => {
    const segs = [...(drill.segments ?? [])];
    segs[i] = value;
    onChange({ ...drill, segments: segs });
  };
  const removeSegment = (i: number) => {
    const segs = [...(drill.segments ?? [])];
    segs.splice(i, 1);
    onChange({ ...drill, segments: segs.length === 0 ? undefined : segs });
  };
  const addSegment = () => {
    const segs = [...(drill.segments ?? [])];
    segs.push(`Set ${segs.length + 1}`);
    onChange({ ...drill, segments: segs });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}.
            </span>
            <p className="truncate text-sm font-semibold">{drill.name}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {exerciseCategoryLabels[drill.category]} · {prescription}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move up"
            className="h-8 w-8"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move down"
            className="h-8 w-8"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Remove drill"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {drill.type === 'reps' ? (
          <Field label="Reps">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={drill.reps ?? ''}
              onChange={(e) => setReps(e.target.value)}
              placeholder={String(drill.defaultReps ?? 0)}
            />
          </Field>
        ) : (
          <Field label="Duration (sec)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={drill.durationSec ?? ''}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={String(drill.defaultDurationSec ?? 0)}
            />
          </Field>
        )}
        <Field label="Rest (sec)">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={drill.restSec ?? ''}
            onChange={(e) => setRest(e.target.value)}
            placeholder={`${defaultRestSec} (default)`}
          />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Segments
        </p>
        {drill.segments && drill.segments.length > 0 ? (
          <div className="space-y-1.5">
            {drill.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={seg}
                  onChange={(e) => setSegmentAt(i, e.target.value)}
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSegment(i)}
                  aria-label="Remove segment"
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            One round. Add segments to repeat (e.g. Set 1, Set 2 or Right, Left).
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={addSegment}
          className="mt-2 h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add segment
        </Button>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
