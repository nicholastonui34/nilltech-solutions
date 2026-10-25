"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitTalentApplication } from "@/app/actions/talent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { SUBMIT_ERROR_MESSAGE } from "@/lib/leads/schema";
import {
  EAC_COUNTRIES,
  ENGAGEMENT_PREFERENCES,
  TALENT_ROLES,
} from "@/lib/talent/options";
import {
  talentApplicationSchema,
  type TalentApplicationInput,
  type TalentApplicationValues,
} from "@/lib/talent/schema";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-destructive mt-1 text-sm">{message}</p> : null;
}

export function TalentApplicationForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TalentApplicationInput, unknown, TalentApplicationValues>({
    resolver: zodResolver(talentApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      skills: "",
      yearsExperience: "",
      portfolioUrl: "",
      profileUrl: "",
      availability: "",
      message: "",
      consent: false,
      website: "",
    },
  });

  const onSubmit = async (values: TalentApplicationValues) => {
    trackEvent("form_start", { form: "talent_application" });
    let result: Awaited<ReturnType<typeof submitTalentApplication>>;
    try {
      result = await submitTalentApplication(values);
    } catch {
      setStatus("error");
      setErrorMessage(SUBMIT_ERROR_MESSAGE);
      return;
    }
    if (result.ok) {
      setStatus("success");
      trackEvent("form_submit", { form: "talent_application" });
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="border-border bg-card rounded-lg border p-6 text-center"
      >
        <p className="font-semibold">Application received — thank you.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Our recruitment team reviews every application and will contact you if
          it&rsquo;s a fit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="ta-website">Website</Label>
        <Input
          id="ta-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ta-name">Full name</Label>
          <Input
            id="ta-name"
            autoComplete="name"
            className="mt-1.5"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="ta-email">Email</Label>
          <Input
            id="ta-email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="ta-phone">Phone / WhatsApp (optional)</Label>
          <Input
            id="ta-phone"
            type="tel"
            autoComplete="tel"
            className="mt-1.5"
            {...register("phone")}
          />
        </div>
        <div>
          <Label htmlFor="ta-country">Country</Label>
          <NativeSelect
            id="ta-country"
            defaultValue=""
            className="mt-1.5"
            aria-invalid={!!errors.country}
            {...register("country")}
          >
            <option value="" disabled>
              Select one
            </option>
            {EAC_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors.country?.message} />
          <p className="text-muted-foreground mt-1 text-xs">
            We currently hire within East Africa.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ta-role">Main role</Label>
          <NativeSelect
            id="ta-role"
            defaultValue=""
            className="mt-1.5"
            aria-invalid={!!errors.primaryRole}
            {...register("primaryRole")}
          >
            <option value="" disabled>
              Select one
            </option>
            {TALENT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors.primaryRole?.message} />
        </div>
        <div>
          <Label htmlFor="ta-years">Years of experience</Label>
          <Input
            id="ta-years"
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            className="mt-1.5"
            aria-invalid={!!errors.yearsExperience}
            {...register("yearsExperience")}
          />
          <FieldError message={errors.yearsExperience?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="ta-skills">
          Key skills and tools (comma-separated, optional)
        </Label>
        <Input
          id="ta-skills"
          placeholder="e.g. React, TypeScript, Figma"
          className="mt-1.5"
          {...register("skills")}
        />
      </div>

      <div>
        <Label htmlFor="ta-engagement">How would you like to work with us?</Label>
        <NativeSelect
          id="ta-engagement"
          defaultValue=""
          className="mt-1.5"
          aria-invalid={!!errors.engagementPreference}
          {...register("engagementPreference")}
        >
          <option value="" disabled>
            Select one
          </option>
          {ENGAGEMENT_PREFERENCES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.engagementPreference?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ta-portfolio">Portfolio link (optional)</Label>
          <Input
            id="ta-portfolio"
            type="url"
            placeholder="https://"
            className="mt-1.5"
            aria-invalid={!!errors.portfolioUrl}
            {...register("portfolioUrl")}
          />
          <FieldError message={errors.portfolioUrl?.message} />
        </div>
        <div>
          <Label htmlFor="ta-profile">LinkedIn or GitHub (optional)</Label>
          <Input
            id="ta-profile"
            type="url"
            placeholder="https://"
            className="mt-1.5"
            aria-invalid={!!errors.profileUrl}
            {...register("profileUrl")}
          />
          <FieldError message={errors.profileUrl?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="ta-availability">Availability (optional)</Label>
        <Input
          id="ta-availability"
          placeholder="e.g. Full-time from December, or 20 hrs/week"
          className="mt-1.5"
          {...register("availability")}
        />
      </div>

      <div>
        <Label htmlFor="ta-message">Anything else we should know? (optional)</Label>
        <Textarea id="ta-message" rows={4} className="mt-1.5" {...register("message")} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4"
            aria-invalid={!!errors.consent}
            {...register("consent")}
          />
          <span>
            I agree to NillTech Solutions processing the details above to assess my
            application, as described in the{" "}
            <Link href="/legal" className="text-primary hover:underline">
              privacy notice
            </Link>
            .
          </span>
        </label>
        <FieldError message={errors.consent?.message} />
      </div>

      {status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Sending…" : "Send application"}
      </Button>
    </form>
  );
}
