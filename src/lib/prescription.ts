interface PrescriptionInput {
  type: 'reps' | 'time';
  reps?: number;
  durationSec?: number;
  segments?: string[];
}

export function autoPrescription(ex: PrescriptionInput): string {
  const sets = ex.segments?.length ?? 1;
  if (ex.type === 'reps') {
    const reps = ex.reps ?? 0;
    return sets > 1 ? `${sets} × ${reps}` : `${reps} reps`;
  }
  const sec = ex.durationSec ?? 0;
  return sets > 1 ? `${sets} × ${sec}s` : `${sec}s hold`;
}
