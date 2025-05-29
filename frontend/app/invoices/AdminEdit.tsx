"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ComboBox from "@/components/ComboBox";
import { Label } from "@/components/ui/label";
import { useCurrentCompany, useCurrentUser } from "@/global";
import { trpc } from "@/trpc/client";
import Edit from "./Edit";

const AdminEdit = () => {
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get("admin") === "true";
  
  if (!user.roles.administrator || !isAdminMode) {
    return <Edit />;
  }

  const [selectedContractor, setSelectedContractor] = useState<string>("");
  const { data: contractors } = trpc.contractors.list.useQuery({ 
    companyId: company.id, 
    excludeAlumni: true 
  });

  const contractorOptions = contractors?.map(contractor => ({
    value: contractor.user.id,
    label: `${contractor.user.name} (${contractor.role || 'No role'})`
  })) || [];

  if (!selectedContractor) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create invoice for contractor</h2>
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
            onClick={() => setSelectedContractor(selectedContractor)}
            disabled={!selectedContractor}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Continue to invoice form
          </button>
        </div>
      </div>
    );
  }

  return <Edit contractorId={selectedContractor} isAdminMode={true} />;
};

export default AdminEdit;
