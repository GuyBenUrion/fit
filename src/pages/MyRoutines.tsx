import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/routines/ConfirmDialog';
import { useAppStore } from '@/store/useAppStore';
import { useUserRoutines, useUserRoutinesLoading } from '@/lib/useRoutines';
import type { Routine } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function MyRoutines() {
  const routines = useUserRoutines();
  const loading = useUserRoutinesLoading();
  const removeUserRoutine = useAppStore((s) => s.removeUserRoutine);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeUserRoutine(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete routine:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Routines</h1>
          <p className="text-sm text-muted-foreground">
            Build and save your own routines from any drill in the catalog.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/my-routines/new">
            <Plus className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      {loading && routines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : routines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {routines.map((routine) => (
            <UserRoutineCard
              key={routine.id}
              routine={routine}
              open={openId === routine.id}
              onToggle={() =>
                setOpenId((curr) => (curr === routine.id ? null : routine.id))
              }
              onDelete={() => setDeleteTarget(routine)}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name}"?`}
          description="This cannot be undone."
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          destructive
          onCancel={() => (deleting ? null : setDeleteTarget(null))}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center">
      <p className="text-sm font-medium">No custom routines yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Mix drills from the catalog into a routine you can save and run anytime.
      </p>
      <Button asChild className="mt-4">
        <Link to="/my-routines/new">
          <Plus className="mr-1 h-4 w-4" />
          Create your first routine
        </Link>
      </Button>
    </div>
  );
}

interface UserRoutineCardProps {
  routine: Routine;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function UserRoutineCard({
  routine,
  open,
  onToggle,
  onDelete,
}: UserRoutineCardProps) {
  const drillCount = routine.exercises.length;
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-sm font-semibold">{routine.name}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {routine.durationMin} min
            </span>
            <span>·</span>
            <span>
              {drillCount} {drillCount === 1 ? 'drill' : 'drills'}
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
          {routine.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {routine.notes}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Drills
            </p>
            {drillCount === 0 ? (
              <p className="mt-2 text-muted-foreground">No drills yet.</p>
            ) : (
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
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/my-routines/${routine.id}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
