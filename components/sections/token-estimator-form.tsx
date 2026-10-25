"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitTokenEstimator } from "@/app/actions/leads";
import { CtaButton } from "@/components/cta/cta-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  aiModels,
  estimateMonthlyTokenCostUsd,
  lastVerified,
} from "@/config/ai-model-pricing";
import { trackEvent } from "@/lib/analytics";
import { tokenEstimatorSchema, type TokenEstimatorValues } from "@/lib/leads/schema";

const taskOptions = [
  { value: "chatbot", label: "Chatbot" },
  { value: "document-processing", label: "Document processing" },
  { value: "classification", label: "Classification" },
  { value: "rag", label: "RAG / knowledge search" },
] as const;

const volumeOptions = [
  { value: "under-1k", label: "Under 1,000 / month" },
  { value: "1k-10k", label: "1,000 – 10,000 / month" },
  { value: "10k-100k", label: "10,000 – 100,000 / month" },
  { value: "100k-plus", label: "100,000+ / month" },
] as const;

export function TokenEstimatorForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [modelId, setModelId] = useState(aiModels[0].id);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TokenEstimatorValues>({
    resolver: zodResolver(tokenEstimatorSchema),
    defaultValues: { name: "", email: "", company: "", website: "" },
  });

  const task = watch("task");
  const monthlyVolume = watch("monthlyVolume");

  const estimate = useMemo(() => {
    if (!task || !monthlyVolume) return null;
    return estimateMonthlyTokenCostUsd({ modelId, task, monthlyVolume });
  }, [modelId, task, monthlyVolume]);

  const onSubmit = async (values: TokenEstimatorValues) => {
    trackEvent("quote_generated", { form: "token_estimator" });
    const result = await submitTokenEstimator(values);
    if (result.ok) {
      setStatus("success");
      trackEvent("form_submit", { tier: result.tier, form: "token_estimator" });
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  if (status === "success") {
    return (
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-lg font-semibold">Thanks — we&rsquo;ll follow up.</p>
        <p className="text-muted-foreground mt-2">
          We&rsquo;ll confirm whether this estimate fits your actual usage pattern.
        </p>
        <div className="mt-6 flex justify-center">
          <CtaButton intent="demo" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-border bg-card rounded-lg border p-6 sm:p-8"
      noValidate
    >
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="te-website">Website</Label>
        <Input
          id="te-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="te-model">Model</Label>
          <select
            id="te-model"
            className="border-input bg-background mt-1.5 h-9 w-full rounded-md border px-3 text-sm"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {aiModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.provider})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="te-task">Task</Label>
          <select
            id="te-task"
            className="border-input bg-background mt-1.5 h-9 w-full rounded-md border px-3 text-sm"
            {...register("task")}
          >
            <option value="">Select a task</option>
            {taskOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="te-volume">Monthly volume</Label>
          <select
            id="te-volume"
            className="border-input bg-background mt-1.5 h-9 w-full rounded-md border px-3 text-sm"
            {...register("monthlyVolume")}
          >
            <option value="">Select a volume</option>
            {volumeOptions.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {estimate !== null ? (
        <div className="bg-muted/50 mt-6 rounded-lg p-4 text-sm">
          <p className="font-semibold">Estimated: ${estimate}/month</p>
          <p className="text-muted-foreground mt-1">
            Based on public model pricing, verified {lastVerified}. Indicative only — your
            actual prompt/response lengths will shift this.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="te-name">Name</Label>
          <Input id="te-name" className="mt-1.5" {...register("name")} />
          {errors.name ? (
            <p className="text-destructive mt-1 text-sm">{errors.name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="te-email">Email</Label>
          <Input id="te-email" type="email" className="mt-1.5" {...register("email")} />
          {errors.email ? (
            <p className="text-destructive mt-1 text-sm">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="te-company">Company (optional)</Label>
          <Input id="te-company" className="mt-1.5" {...register("company")} />
        </div>
      </div>

      {status === "error" ? (
        <p className="text-destructive mt-4 text-sm">{errorMessage}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-6" size="lg">
        {isSubmitting ? "Submitting…" : "Get this estimate"}
      </Button>
    </form>
  );
}
