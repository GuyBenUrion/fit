import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

type Mode = 'signin' | 'signup';
type Status = 'idle' | 'submitting' | 'error';

export default function Login() {
  const session = useAppStore((s) => s.session);
  const authLoading = useAppStore((s) => s.authLoading);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setStatus('submitting');
    setErrorMsg(null);

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('idle');
    }
  }

  const submitLabel =
    status === 'submitting'
      ? mode === 'signin'
        ? 'Signing in…'
        : 'Creating account…'
      : mode === 'signin'
        ? 'Sign in'
        : 'Create account';

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">StretchPlanner</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in with your email and password.' : 'Create an account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
          />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === 'submitting'}
          />
          <Button type="submit" className="w-full" disabled={status === 'submitting'}>
            {submitLabel}
          </Button>
          {errorMsg && (
            <p className="text-sm text-destructive" role="alert">
              {errorMsg}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMsg(null);
            }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

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
