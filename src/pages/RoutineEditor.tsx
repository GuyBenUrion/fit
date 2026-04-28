import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/routines/ConfirmDialog';
import {
  DrillRow,
  type EditorDrill,
} from '@/components/routines/DrillRow';
import { ExercisePicker } from '@/components/routines/ExercisePicker';
import { useAppStore } from '@/store/useAppStore';
import {
  useExercises,
  useExercisesLoading,
  useUserRoutines,
  useUserRoutinesLoading,
} from '@/lib/useRoutines';
import type { DraftDrill, DraftRoutine } from '@/lib/api/userRoutines';
import type { Exercise, Routine } from '@/lib/types';

const DEFAULT_REST_SEC = 90;

function exerciseToDrill(ex: Exercise): EditorDrill {
  const drill: EditorDrill = {
    exerciseId: ex.id,
    name: ex.name,
    type: ex.type,
    category: ex.category,
    bodyParts: ex.bodyParts,
  };
  if (ex.defaultDurationSec !== undefined)
    drill.defaultDurationSec = ex.defaultDurationSec;
  if (ex.defaultReps !== undefined) drill.defaultReps = ex.defaultReps;
  if (ex.defaultSegments !== undefined)
    drill.defaultSegments = ex.defaultSegments;
  if (ex.type === 'reps' && ex.defaultReps !== undefined)
    drill.reps = ex.defaultReps;
  if (ex.type === 'time' && ex.defaultDurationSec !== undefined)
    drill.durationSec = ex.defaultDurationSec;
  if (ex.defaultSegments !== undefined) drill.segments = [...ex.defaultSegments];
  return drill;
}

function routineToDrills(
  routine: Routine,
  exercisesById: Map<string, Exercise>,
): EditorDrill[] {
  return routine.exercises.map((re) => {
    const ex = exercisesById.get(re.exerciseId);
    const drill: EditorDrill = {
      exerciseId: re.exerciseId,
      name: re.name,
      type: re.type,
      category: re.category,
      bodyParts: re.bodyParts,
    };
    if (ex?.defaultDurationSec !== undefined)
      drill.defaultDurationSec = ex.defaultDurationSec;
    if (ex?.defaultReps !== undefined) drill.defaultReps = ex.defaultReps;
    if (ex?.defaultSegments !== undefined)
      drill.defaultSegments = ex.defaultSegments;
    if (re.durationSec !== undefined) drill.durationSec = re.durationSec;
    if (re.reps !== undefined) drill.reps = re.reps;
    if (re.segments !== undefined) drill.segments = [...re.segments];
    if (re.restSec !== undefined) drill.restSec = re.restSec;
    return drill;
  });
}

function drillToDraft(d: EditorDrill): DraftDrill {
  const draft: DraftDrill = { exerciseId: d.exerciseId };
  if (d.type === 'reps' && d.reps !== undefined) draft.reps = d.reps;
  if (d.type === 'time' && d.durationSec !== undefined)
    draft.durationSec = d.durationSec;
  if (d.segments !== undefined) draft.segments = d.segments;
  if (d.restSec !== undefined) draft.restSec = d.restSec;
  return draft;
}

function computeDurationMin(drills: EditorDrill[], defaultRest: number): number {
  let totalSec = 0;
  for (const d of drills) {
    const segs = d.segments?.length ?? 1;
    const dur = d.durationSec ?? d.defaultDurationSec ?? 0;
    totalSec += dur * segs;
  }
  if (drills.length > 1) {
    for (let i = 0; i < drills.length - 1; i++) {
      const d = drills[i];
      if (!d) continue;
      totalSec += d.restSec ?? defaultRest;
    }
  }
  return Math.max(0, Math.round(totalSec / 60));
}

export default function RoutineEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const userRoutines = useUserRoutines();
  const userRoutinesLoading = useUserRoutinesLoading();
  const exercises = useExercises();
  const exercisesLoading = useExercisesLoading();
  const saveUserRoutine = useAppStore((s) => s.saveUserRoutine);
  const removeUserRoutine = useAppStore((s) => s.removeUserRoutine);

  const exercisesById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  const existing = useMemo(
    () => (isEdit ? userRoutines.find((r) => r.id === id) ?? null : null),
    [isEdit, id, userRoutines],
  );

  const [name, setName] = useState('');
  const [defaultRestSec, setDefaultRestSec] = useState(DEFAULT_REST_SEC);
  const [notes, setNotes] = useState('');
  const [drills, setDrills] = useState<EditorDrill[]>([]);
  const [hydrated, setHydrated] = useState(!isEdit);

  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    if (hydrated) return;
    if (!existing) return;
    if (exercises.length === 0) return;
    setName(existing.name);
    setDefaultRestSec(existing.defaultRestSec ?? DEFAULT_REST_SEC);
    setNotes(existing.notes ?? '');
    setDrills(routineToDrills(existing, exercisesById));
    setHydrated(true);
  }, [isEdit, hydrated, existing, exercises, exercisesById]);

  if (isEdit && !hydrated) {
    if (userRoutinesLoading || exercisesLoading || userRoutines.length === 0) {
      return <p className="text-sm text-muted-foreground">Loading routine…</p>;
    }
    if (!existing) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Routine not found.</p>
          <Button variant="outline" onClick={() => navigate('/my-routines')}>
            Back
          </Button>
        </div>
      );
    }
  }

  const durationMin = computeDurationMin(drills, defaultRestSec);
  const canSave = name.trim().length > 0 && drills.length > 0 && !saving;

  const handleAdd = (ex: Exercise) => {
    setDrills((prev) => [...prev, exerciseToDrill(ex)]);
    setShowPicker(false);
  };

  const handleChangeDrill = (index: number, next: EditorDrill) => {
    setDrills((prev) => prev.map((d, i) => (i === index ? next : d)));
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    setDrills((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      if (!a || !b) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  const handleRemoveDrill = (index: number) => {
    setDrills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const draft: DraftRoutine = {
        name: name.trim(),
        defaultRestSec,
        notes: notes.trim() || undefined,
        drills: drills.map(drillToDraft),
      };
      await saveUserRoutine(id ?? null, draft);
      navigate('/my-routines');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save routine');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await removeUserRoutine(id);
      navigate('/my-routines');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete routine');
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/my-routines')}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {isEdit ? 'Edit routine' : 'New routine'}
        </h1>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Name
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning hip flow"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Default rest between drills (seconds)
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={defaultRestSec}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setDefaultRestSec(
                Number.isFinite(n) && n >= 0 ? n : DEFAULT_REST_SEC,
              );
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Total: ~{durationMin} min · {drills.length}{' '}
          {drills.length === 1 ? 'drill' : 'drills'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Drills
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowPicker(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add drill
          </Button>
        </div>

        {drills.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No drills yet. Tap "Add drill" to pick from the exercise catalog.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {drills.map((d, i) => (
              <DrillRow
                key={`${d.exerciseId}-${i}`}
                drill={d}
                index={i}
                total={drills.length}
                defaultRestSec={defaultRestSec}
                onChange={(next) => handleChangeDrill(i, next)}
                onMoveUp={() => handleMove(i, -1)}
                onMoveDown={() => handleMove(i, 1)}
                onDelete={() => handleRemoveDrill(i)}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {isEdit ? (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            Delete routine
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/my-routines')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={handleAdd}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this routine?"
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
