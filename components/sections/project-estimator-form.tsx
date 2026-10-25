"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitProjectEstimator } from "@/app/actions/leads";
import { CtaButton } from "@/components/cta/cta-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  featureAddons,
  integrationAddons,
  PRICING_FINALIZED,
  computeProjectEstimate,
  kesToUsd,
  roundKes,
  type ProjectEstimate,
  type ProjectType,
  type Region,
} from "@/config/pricing-rules";
import { trackEvent } from "@/lib/analytics";
import {
  SUBMIT_ERROR_MESSAGE,
  TIMELINE_URGENCY_OPTIONS,
  projectEstimatorSchema,
  type ProjectEstimatorValues,
} from "@/lib/leads/schema";

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "custom-software", label: "Custom software" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "business-systems", label: "Business systems" },
];

const budgetOptions = [
  { value: "under-500k", label: "Under KES 500,000" },
  { value: "500k-2m", label: "KES 500,000 – 2,000,000" },
  { value: "2m-plus", label: "KES 2,000,000+" },
  { value: "unsure", label: "Not sure yet" },
] as const;

const regionOptions: { value: Region; label: string }[] = [
  { value: "primary-market", label: "Kenya, Uganda, Tanzania or Rwanda" },
  { value: "secondary-market", label: "US, UK or Canada" },
  { value: "other", label: "Somewhere else" },
];

const steps = ["Project", "Scope", "Timeline & budget", "Your details"] as const;

export function ProjectEstimatorForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [stepError, setStepError] = useState(false);
  const [estimate, setEstimate] = useState<{
    result: ProjectEstimate;
    international: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectEstimatorValues>({
    resolver: zodResolver(projectEstimatorSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      features: [],
      integrations: [],
      website: "",
    },
  });

  const features = watch("features") ?? [];
  const integrations = watch("integrations") ?? [];
  const projectType = watch("projectType");
  const timelineUrgency = watch("timelineUrgency");
  const budgetBand = watch("budgetBand");
  const region = watch("region");

  const toggleArrayValue = (field: "features" | "integrations", key: string) => {
    const current = field === "features" ? features : integrations;
    const next = current.includes(key)
      ? current.filter((v) => v !== key)
      : [...current, key];
    setValue(field, next);
  };

  // Deliberately not RHF's trigger(['field']) here: with a single combined
  // Zod schema, trigger() re-validates the WHOLE form on every call, so it
  // blocks advancing past an earlier step while later-step fields are
  // still empty — even though the current step's own field is valid.
  // Plain presence checks avoid that.
  const stepIsValid = [
    Boolean(projectType),
    true,
    Boolean(timelineUrgency && budgetBand && region),
  ];

  const next = () => {
    if (!stepIsValid[step]) {
      setStepError(true);
      return;
    }
    setStepError(false);
    setStep((s) => s + 1);
  };

  const onSubmit = async (values: ProjectEstimatorValues) => {
    trackEvent("quote_generated");
    let result: Awaited<ReturnType<typeof submitProjectEstimator>>;
    try {
      result = await submitProjectEstimator(values);
    } catch {
      setStatus("error");
      setErrorMessage(SUBMIT_ERROR_MESSAGE);
      return;
    }
    if (result.ok) {
      setEstimate({
        result: computeProjectEstimate(values),
        international: values.region === "secondary-market",
      });
      setStatus("success");
      trackEvent("form_submit", { tier: result.tier, form: "project_estimator" });
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  if (status === "success") {
    return (
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-lg font-semibold">
          Thanks — that&rsquo;s enough to get started.
        </p>
        {PRICING_FINALIZED && estimate ? (
          <div className="bg-muted/50 mx-auto mt-6 max-w-md rounded-lg p-5">
            <p className="text-muted-foreground text-sm">Indicative range</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {estimate.international
                ? `USD ${kesToUsd(estimate.result.price.minKes).toLocaleString()} – ${kesToUsd(estimate.result.price.maxKes).toLocaleString()}`
                : `KES ${roundKes(estimate.result.price.minKes).toLocaleString()} – ${roundKes(estimate.result.price.maxKes).toLocaleString()}`}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Typical timeline: {estimate.result.timeline.minWeeks}–
              {estimate.result.timeline.maxWeeks} weeks
            </p>
            <p className="text-muted-foreground mt-3 text-xs">
              Estimates are indicative. Your final quote follows a short discovery call.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2">
            Our pricing tables are being finalized — we&rsquo;ll follow up with a real
            range shortly.
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <CtaButton intent="discovery-call" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-lg border p-6 sm:p-8">
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
            <p
              className={`mt-2 text-xs ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="pe-website">Website</Label>
          <Input
            id="pe-website"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>

        {step === 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-lg font-semibold">What are you building?</legend>
            {projectTypes.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  projectType === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={opt.value}
                  {...register("projectType")}
                />
                {opt.label}
              </label>
            ))}
            {stepError && step === 0 ? (
              <p className="text-destructive text-sm">Pick a project type.</p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-8">
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Features</legend>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(featureAddons).map(([key, feature]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={features.includes(key)}
                      onChange={() => toggleArrayValue("features", key)}
                    />
                    {feature.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Integrations</legend>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(integrationAddons).map(([key, integration]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={integrations.includes(key)}
                      onChange={() => toggleArrayValue("integrations", key)}
                    />
                    {integration.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-8">
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Timeline</legend>
              <div className="grid grid-cols-2 gap-3">
                {TIMELINE_URGENCY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("timelineUrgency")}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Budget</legend>
              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={opt.value} {...register("budgetBand")} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Region</legend>
              <div className="flex flex-col gap-3">
                {regionOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={opt.value} {...register("region")} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            {stepError && step === 2 ? (
              <p className="text-destructive text-sm">
                Pick a timeline, budget and region to continue.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="pe-name">Name</Label>
              <Input id="pe-name" className="mt-1.5" {...register("name")} />
              {errors.name ? (
                <p className="text-destructive mt-1 text-sm">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="pe-email">Email</Label>
              <Input
                id="pe-email"
                type="email"
                className="mt-1.5"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-destructive mt-1 text-sm">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="pe-company">Company (optional)</Label>
              <Input id="pe-company" className="mt-1.5" {...register("company")} />
            </div>
            {status === "error" ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Get my estimate"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
