export const EDITABLE_INVOICE_STATES = ["draft", "rejected"] as const;

export const useIsActionable = () => {
  const company = useCurrentCompany();
  return (invoice: { status: string; approvals: { approver: { id: string } }[] }) => {
    if (invoice.status !== "pending") return false;
    if (invoice.approvals.some((approval) => approval.approver.id === company.currentUserId)) return false;
    return true;
  };
};

export const useIsPayable = () => {
  const company = useCurrentCompany();
  const areTaxRequirementsMet = useAreTaxRequirementsMet();
  return (invoice: { status: string; approvals: { approver: { id: string } }[]; contractor: any }) => {
    if (invoice.status !== "pending") return false;
    if (!areTaxRequirementsMet(invoice)) return false;
    if (invoice.approvals.length < (company.requiredInvoiceApprovals ?? 1) - 1) return false;
    return true;
  };
};

export const useAreTaxRequirementsMet = () => {
  return (invoice: { contractor: { hasTaxInfo: boolean } }) => {
    return invoice.contractor.hasTaxInfo;
  };
};

export const useApproveInvoices = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: async ({
      approve_ids,
      pay_ids,
    }: {
      approve_ids: string[];
      pay_ids: string[];
    }) => {
      const company = useCurrentCompany.getState();
      await request({
        method: "POST",
        url: `/companies/${company.id}/invoices/approve`,
        accept: "json",
        jsonData: { approve_ids, pay_ids },
      });
    },
    onSuccess,
  });
};

import { useMutation } from "@tanstack/react-query";
import { useCurrentCompany } from "@/global";
import { trpc } from "@/trpc/client";
import { request } from "@/utils/request";
import { company_invoice_path } from "@/utils/routes";
