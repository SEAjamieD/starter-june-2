"use client";

import { TransitionLink } from "@/components/site/transition-link";
import { useLayoutEffect, useRef, useState } from "react";
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

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export function SignupCard({
  skipTransitionRegistration = false,
}: {
  skipTransitionRegistration?: boolean;
}) {
  const { registerAuthCard, authCardSuppressed, runAppEnterTransition, isTransitioning } =
    useSiteTransition();
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "email" | "password", string>>
  >({});

  useLayoutEffect(() => {
    if (skipTransitionRegistration) return;
    registerAuthCard(cardWrapperRef.current);
    return () => registerAuthCard(null);
  }, [registerAuthCard, skipTransitionRegistration]);

  const handleSubmit = async (formData: FormData) => {
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors({
        name: parsed.error.flatten().fieldErrors.name?.[0],
        email: parsed.error.flatten().fieldErrors.email?.[0],
        password: parsed.error.flatten().fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message ?? "Could not sign up.");
      return;
    }

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
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  disabled={loading || isTransitioning}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>
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
                  "Create account"
                )}
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <TransitionLink className="underline" href="/login" transitionDirection="login">
              Log in
            </TransitionLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
