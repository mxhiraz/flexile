"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ComboBox from "@/components/ComboBox";
import RangeInput from "@/components/RangeInput";
import { Label } from "@/components/ui/label";
import { useCurrentCompany, useCurrentUser } from "@/global";
import { trpc } from "@/trpc/client";
import Edit from "./Edit";
import { MAX_EQUITY_PERCENTAGE } from "@/models";

const AdminEdit = () => {
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get("admin") === "true";

  if (!user.roles.administrator || !isAdminMode) {
    return <Edit />;
  }

  const [selectedContractor, setSelectedContractor] = useState<string>("");
  const [selectedEquityPercentage, setSelectedEquityPercentage] = useState<number>(25);
  const [showEquitySelection, setShowEquitySelection] = useState<boolean>(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState<boolean>(false);
  const { data: contractors } = trpc.contractors.list.useQuery({
    companyId: company.id,
    excludeAlumni: true,
  });

  const contractorOptions =
    contractors?.map((contractor) => ({
      value: contractor.user.id,
      label: `${contractor.user.name} (${contractor.role || "No role"})`,
    })) || [];

  if (!selectedContractor) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Create invoice for contractor</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contractor-select">Select contractor</Label>
            <ComboBox
              id="contractor-select"
              value={selectedContractor}
              onChange={setSelectedContractor}
              options={contractorOptions}
              placeholder="Choose a contractor..."
            />
          </div>
          <button
            onClick={() => {
              if (selectedContractor) {
                if (company.equityCompensationEnabled) {
                  // If equity is enabled, go to equity selection step
                  setSelectedEquityPercentage(25); // Ensure default is 25%
                  setShowEquitySelection(true);
                } else {
                  // If equity is not enabled, go straight to invoice form
                  setShowInvoiceForm(true);
                }
              }
            }}
            disabled={!selectedContractor}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (company.equityCompensationEnabled && showEquitySelection && !showInvoiceForm) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Set equity percentage</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="equity-percentage">Equity percentage</Label>
            <RangeInput
              id="equity-percentage"
              value={selectedEquityPercentage}
              onChange={setSelectedEquityPercentage}
              min={0}
              max={MAX_EQUITY_PERCENTAGE}
              aria-label="Equity percentage"
              unit="%"
            />
          </div>
          <button 
            onClick={() => setShowInvoiceForm(true)}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return <Edit contractorId={selectedContractor} isAdminMode equityPercentage={selectedEquityPercentage} />;
};

export default AdminEdit;
