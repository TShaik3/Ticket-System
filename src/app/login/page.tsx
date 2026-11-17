"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, {} as { error?: string });
  return (
    <form action={action} className="card mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Admin sign in</h1>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
      <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
