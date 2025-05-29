import { Suspense } from "react";
import Edit from "@/app/invoices/Edit";
import AdminEdit from "@/app/invoices/AdminEdit";
import { useSearchParams } from "next/navigation";

function NewInvoicePage() {
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get("admin") === "true";

  return isAdminMode ? <AdminEdit /> : <Edit />;
}

export default function Page() {
  return (
    <Suspense>
      <NewInvoicePage />
    </Suspense>
  );
}
