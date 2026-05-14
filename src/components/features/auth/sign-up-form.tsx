"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { signUp } from "@/lib/auth-client";
import { signUpSchema } from "@/validations/auth";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = signUpSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof fieldErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: "/dashboard",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Gagal membuat akun");
      return;
    }
    toast.success("Akun berhasil dibuat");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Buat akun</CardTitle>
        <CardDescription className="text-(--text-secondary)">
          Buat ruang kerja Castricity dalam hitungan detik.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-accent-red">{errors.name}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-accent-red">{errors.email}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-accent-red">{errors.password}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-accent-red">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 mt-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner className="size-4" /> : "Buat akun"}
          </Button>
          <p className="text-xs text-(--text-muted)">
            Sudah punya akun?{" "}
            <Link href="/sign-in" className="text-accent-cyan hover:underline">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
