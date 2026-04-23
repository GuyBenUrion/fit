import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

export default function Today() {
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email ?? 'unknown'}
        </p>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          Your daily recommendation will live here. Coming in Phase 5.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
