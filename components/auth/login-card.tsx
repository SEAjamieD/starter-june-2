"use client";

import { TransitionLink } from "@/components/site/transition-link";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { z } from "zod";

import { useSiteTransition } from "@/components/site/site-transition";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const MIN_LOGIN_LOADING_MS = 3000;

export function LoginCard({
  skipTransitionRegistration = false,
}: {
  skipTransitionRegistration?: boolean;
}) {
  const { registerAuthCard, authCardSuppressed, runAppEnterTransition, isTransitioning } =
    useSiteTransition();
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});

  useLayoutEffect(() => {
    if (skipTransitionRegistration) return;
    registerAuthCard(cardWrapperRef.current);
    return () => registerAuthCard(null);
  }, [registerAuthCard, skipTransitionRegistration]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors({
        email: parsed.error.flatten().fieldErrors.email?.[0],
        password: parsed.error.flatten().fieldErrors.password?.[0],
      });
      return;
    }

    flushSync(() => {
      setErrors({});
      setLoading(true);
    });

    const minLoadingDelay = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_LOGIN_LOADING_MS),
    );

    const { error } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      flushSync(() => setLoading(false));
      toast.error(error.message ?? "Could not log in.");
      return;
    }

    await minLoadingDelay;

    runAppEnterTransition();
  };

  return (
    <div
      ref={cardWrapperRef}
      className={cn(
        "w-full max-w-md",
        !skipTransitionRegistration && authCardSuppressed && "invisible",
      )}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading || isTransitioning}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading || isTransitioning}
                />
                <FieldError>{errors.password}</FieldError>
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || isTransitioning}
                aria-busy={loading || isTransitioning}
              >
                {loading || isTransitioning ? (
                  <Spinner className="size-4" />
                ) : (
                  "Log in"
                )}
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Need an account?{" "}
            <TransitionLink className="underline" href="/signup" transitionDirection="signup">
              Sign up
            </TransitionLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
