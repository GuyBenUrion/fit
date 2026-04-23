import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Login() {
  const session = useAppStore((s) => s.session);
  const authLoading = useAppStore((s) => s.authLoading);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Sign in — StretchPlanner';
  }, []);

  if (!authLoading && session) {
    return <Navigate to="/today" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setStatus('error');
      setErrorMsg(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.',
      );
      return;
    }
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/today' },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">StretchPlanner</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with a magic link. We'll email you a one-tap login.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-md border bg-secondary p-4 text-sm">
            Check your inbox for <span className="font-medium">{email}</span>. Click the link to
            sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'sending'}
            />
            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </Button>
            {errorMsg && (
              <p className="text-sm text-destructive" role="alert">
                {errorMsg}
              </p>
            )}
          </form>
        )}

        {!isSupabaseConfigured && (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Supabase env vars not set. Auth won't work until you add
            <code className="mx-1 rounded bg-muted px-1">VITE_SUPABASE_URL</code>
            and
            <code className="mx-1 rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>
            to <code className="rounded bg-muted px-1">.env.local</code>.
          </p>
        )}
      </div>
    </div>
  );
}
