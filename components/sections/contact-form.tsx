"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitContactForm } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { offers } from "@/config/offers";
import {
  SUBMIT_ERROR_MESSAGE,
  TIMELINE_URGENCY_OPTIONS,
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/leads/schema";
import { trackEvent } from "@/lib/analytics";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      message: "",
      website: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    trackEvent("form_start");
    let result: Awaited<ReturnType<typeof submitContactForm>>;
    try {
      result = await submitContactForm(values);
    } catch {
      setStatus("error");
      setErrorMessage(SUBMIT_ERROR_MESSAGE);
      return;
    }
    if (result.ok) {
      setStatus("success");
      trackEvent("form_submit", { tier: result.tier });
      reset();
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  if (status === "success") {
    return (
      <div className="border-border bg-card rounded-lg border p-6 text-center">
        <p className="font-semibold">Thanks — we got it.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          We&rsquo;ll follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Honeypot — visually hidden, real users never fill it in. */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          className="mt-1.5"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name ? (
          <p className="text-destructive mt-1 text-sm">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email ? (
          <p className="text-destructive mt-1 text-sm">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" className="mt-1.5" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="company">Company (optional)</Label>
          <Input id="company" className="mt-1.5" {...register("company")} />
        </div>
      </div>

      <div>
        <Label htmlFor="serviceInterest">What are you interested in?</Label>
        <NativeSelect
          id="serviceInterest"
          defaultValue=""
          className="mt-1.5"
          {...register("serviceInterest")}
          aria-invalid={!!errors.serviceInterest}
        >
          <option value="" disabled>
            Select one
          </option>
          {offers.map((offer) => (
            <option key={offer.slug} value={offer.slug}>
              {offer.title}
            </option>
          ))}
          <option value="not-sure">Not sure yet</option>
        </NativeSelect>
        {errors.serviceInterest ? (
          <p className="text-destructive mt-1 text-sm">
            {errors.serviceInterest.message}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="timelineUrgency">When do you need this?</Label>
        <NativeSelect
          id="timelineUrgency"
          defaultValue=""
          className="mt-1.5"
          {...register("timelineUrgency")}
          aria-invalid={!!errors.timelineUrgency}
        >
          <option value="" disabled>
            Select one
          </option>
          {TIMELINE_URGENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
        {errors.timelineUrgency ? (
          <p className="text-destructive mt-1 text-sm">
            {errors.timelineUrgency.message}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="message">What do you need?</Label>
        <Textarea
          id="message"
          className="mt-1.5"
          rows={4}
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message ? (
          <p className="text-destructive mt-1 text-sm">{errors.message.message}</p>
        ) : null}
      </div>

      {status === "error" ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
