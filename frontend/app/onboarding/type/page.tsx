"use client";
import React, { Suspense, useState } from "react";
import { CompanyDetails } from "@/app/companies/[companyId]/administrator/onboarding/details";
import PersonalDetails from "@/app/onboarding/PersonalDetails";
import OnboardingLayout from "@/app/onboarding/layout";
import RadioButtons from "@/components/RadioButtons";
import { Label } from "@/components/ui/label";

export default function SignUp() {
  const [accessRole, setAccessRole] = useState<"administrator" | "contractor">("administrator");

  return (
    <OnboardingLayout>
      <div className="grid gap-2">
        <Label>I'm a...</Label>
        <RadioButtons
          value={accessRole}
          onChange={setAccessRole}
          options={[
            { value: "administrator", label: "Company", description: "I want to pay my team and manage ownership" },
            { value: "contractor", label: "Freelancer", description: "I want to bill and invoice clients" },
          ]}
        />
      </div>
      <Suspense>{accessRole === "administrator" ? <CompanyDetails /> : <PersonalDetails />}</Suspense>
    </OnboardingLayout>
  );
}
