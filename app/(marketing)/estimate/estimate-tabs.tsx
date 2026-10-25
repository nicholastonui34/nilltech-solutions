"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProjectEstimatorForm } from "@/components/sections/project-estimator-form";
import { TokenEstimatorForm } from "@/components/sections/token-estimator-form";

export function EstimateTabs() {
  const [tab, setTab] = useState<"project" | "tokens">("project");

  return (
    <div>
      <div className="mb-10 flex justify-center gap-2">
        <Button
          type="button"
          variant={tab === "project" ? "default" : "outline"}
          onClick={() => setTab("project")}
          aria-pressed={tab === "project"}
        >
          Project quote
        </Button>
        <Button
          type="button"
          variant={tab === "tokens" ? "default" : "outline"}
          onClick={() => setTab("tokens")}
          aria-pressed={tab === "tokens"}
        >
          AI token cost
        </Button>
      </div>

      {tab === "project" ? <ProjectEstimatorForm /> : <TokenEstimatorForm />}
    </div>
  );
}
