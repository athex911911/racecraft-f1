"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const inputCls = (error?: boolean) =>
  cn(
    "w-full rounded-lg rounded-tr-none border bg-carbon-800 px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/50",
    error ? "border-f1-red/60" : "border-white/10 focus:border-f1-red/50",
  );

function LabeledField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-f1-red">{error}</p> : null}
    </div>
  );
}

const signInSchema = z.object({
  identifier: z.string().min(3, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});
type SignInValues = z.infer<typeof signInSchema>;

const registerSchema = z.object({
  email: z.string().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email"),
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(40, "Too long")
    .regex(/^[A-Za-z0-9_]+$/, "Letters, numbers and underscore only"),
  display_name: z.string().max(80).optional(),
  password: z.string().min(8, "At least 8 characters"),
});
type RegisterValues = z.infer<typeof registerSchema>;

function SignInForm({ onDone }: { onDone: () => void }) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (v: SignInValues) => {
    setServerError(null);
    try {
      await login(v.identifier, v.password);
      onDone();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <LabeledField label="Email or username" error={errors.identifier?.message}>
        <input
          className={inputCls(!!errors.identifier)}
          placeholder="athex"
          autoComplete="username"
          {...register("identifier")}
        />
      </LabeledField>
      <LabeledField label="Password" error={errors.password?.message}>
        <input
          type="password"
          className={inputCls(!!errors.password)}
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
        />
      </LabeledField>
      {serverError ? <p className="text-sm text-f1-red">{serverError}</p> : null}
      <SubmitButton loading={isSubmitting}>Sign in</SubmitButton>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (v: RegisterValues) => {
    setServerError(null);
    try {
      await registerUser({
        email: v.email,
        username: v.username,
        password: v.password,
        display_name: v.display_name || undefined,
      });
      onDone();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <LabeledField label="Email" error={errors.email?.message}>
        <input
          className={inputCls(!!errors.email)}
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
      </LabeledField>
      <div className="grid grid-cols-2 gap-3">
        <LabeledField label="Username" error={errors.username?.message}>
          <input
            className={inputCls(!!errors.username)}
            placeholder="athex"
            autoComplete="username"
            {...register("username")}
          />
        </LabeledField>
        <LabeledField label="Display name" error={errors.display_name?.message}>
          <input
            className={inputCls(!!errors.display_name)}
            placeholder="optional"
            {...register("display_name")}
          />
        </LabeledField>
      </div>
      <LabeledField label="Password" error={errors.password?.message}>
        <input
          type="password"
          className={inputCls(!!errors.password)}
          placeholder="8+ characters"
          autoComplete="new-password"
          {...register("password")}
        />
      </LabeledField>
      {serverError ? <p className="text-sm text-f1-red">{serverError}</p> : null}
      <SubmitButton loading={isSubmitting}>Create account</SubmitButton>
    </form>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg rounded-tr-none bg-f1-red px-4 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-f1-red/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [user, loading, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-card rounded-tr-none border border-white/8 bg-carbon-700 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg rounded-tr-none bg-black ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/racecraft-mark.png"
              alt="Racecraft"
              className="h-full w-full object-contain"
            />
          </span>
          <h1 className="font-display text-3xl font-bold uppercase italic tracking-wide">
            {mode === "signin" ? "Sign in" : "Join the paddock"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Access your favorites and Prediction League picks."
              : "Save favorites, make race predictions, climb the leaderboard."}
          </p>
        </div>

        {/* mode toggle */}
        <div className="mb-6 flex rounded-lg border border-white/10 p-0.5">
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition",
                mode === m ? "bg-f1-red text-white" : "text-silver hover:text-white",
              )}
            >
              {m === "signin" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        {mode === "signin" ? (
          <SignInForm onDone={() => router.replace("/profile")} />
        ) : (
          <RegisterForm onDone={() => router.replace("/profile")} />
        )}
      </motion.div>
    </div>
  );
}
