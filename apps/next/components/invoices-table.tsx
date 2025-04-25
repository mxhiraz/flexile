"use client";

import { useCurrentUser } from "@/global";
import AdminList from "@/app/(dashboard)/invoices/AdminList";
import ViewList from "@/app/(dashboard)/invoices/ViewList";

export function InvoicesTable() {
  const user = useCurrentUser();

  return user.activeRole === "contractorOrInvestor" ? <ViewList /> : <AdminList />;
}
