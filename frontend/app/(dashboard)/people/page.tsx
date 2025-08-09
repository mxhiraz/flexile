"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import { formatISO } from "date-fns";
import { LinkIcon, Plus, Users } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DashboardHeader } from "@/components/DashboardHeader";
import DataTable, { createColumnHelper, useTable } from "@/components/DataTable";
import DatePicker from "@/components/DatePicker";
import { MutationStatusButton } from "@/components/MutationButton";
import Placeholder from "@/components/Placeholder";
import Status from "@/components/Status";
import TableSkeleton from "@/components/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCurrentCompany } from "@/global";
import { countries } from "@/models/constants";
import { PayRateType, trpc } from "@/trpc/client";
import { request } from "@/utils/request";
import { company_workers_path } from "@/utils/routes";
import { formatDate } from "@/utils/time";
import { useIsMobile } from "@/utils/use-mobile";
import NewDocumentField, { schema as documentSchema } from "../documents/NewDocumentField";
import FormFields, { schema as formSchema } from "./FormFields";
import InviteLinkModal from "./InviteLinkModal";

const schema = formSchema.merge(documentSchema).extend({
  email: z.string().email(),
  startDate: z.instanceof(CalendarDate),
  contractSignedElsewhere: z.boolean().default(false),
});

const removeMailtoPrefix = (email: string) => email.replace(/^mailto:/iu, "");

export default function PeoplePage() {
  const company = useCurrentCompany();
  const queryClient = useQueryClient();
  const { data: workers = [], isLoading, refetch } = trpc.contractors.list.useQuery({ companyId: company.id });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);

  const lastContractor = workers[0];

  const form = useForm({
    values: {
      email: "",
      role: lastContractor?.role ?? "",
      payRateType: lastContractor?.payRateType ?? PayRateType.Hourly,
      payRateInSubunits: lastContractor?.payRateInSubunits ?? null,
      startDate: today(getLocalTimeZone()),
      contractSignedElsewhere: lastContractor?.contractSignedElsewhere ?? false,
    },
    resolver: zodResolver(schema),
  });

  const trpcUtils = trpc.useUtils();
  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const formData = new FormData();
      formData.append("contractor[email]", values.email);
      formData.append("contractor[started_at]", formatISO(values.startDate.toDate(getLocalTimeZone())));
      formData.append("contractor[pay_rate_in_subunits]", values.payRateInSubunits?.toString() ?? "");
      formData.append(
        "contractor[pay_rate_type]",
        values.payRateType === PayRateType.Hourly ? "hourly" : "project_based",
      );
      formData.append("contractor[role]", values.role);
      formData.append("contractor[contract_signed_elsewhere]", values.contractSignedElsewhere.toString());
      const contract = values.contractFile || values.contractText;
      if (contract) formData.append("contractor[contract]", contract);

      const response = await request({
        url: company_workers_path(company.id),
        method: "POST",
        accept: "json",
        assertOk: true,
        formData,
      });

      if (!response.ok) {
        const json = z.object({ error_message: z.string() }).parse(await response.json());
        throw new Error(json.error_message);
      }
    },
    onSuccess: async () => {
      await refetch();
      await trpcUtils.documents.list.invalidate();
      setShowInviteModal(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
  const submit = form.handleSubmit((values) => saveMutation.mutate(values));

  const columnHelper = createColumnHelper<(typeof workers)[number]>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("user.name", {
        header: "Name",
        cell: (info) => {
          const content = info.getValue();
          return (
            <Link href={`/people/${info.row.original.user.id}`} className="after:absolute after:inset-0">
              {content}
            </Link>
          );
        },
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => info.getValue() || "N/A",
        meta: { filterOptions: [...new Set(workers.map((worker) => worker.role))] },
      }),
      columnHelper.simple("user.countryCode", "Country", (v) => v && countries.get(v)),
      columnHelper.accessor((row) => (row.endedAt ? "Alumni" : row.startedAt > new Date() ? "Onboarding" : "Active"), {
        header: "Status",
        meta: { filterOptions: ["Active", "Onboarding", "Alumni"] },
        cell: (info) =>
          info.row.original.endedAt ? (
            <Status variant="critical">Ended on {formatDate(info.row.original.endedAt)}</Status>
          ) : info.row.original.startedAt <= new Date() ? (
            <Status variant="success">Started on {formatDate(info.row.original.startedAt)}</Status>
          ) : info.row.original.user.onboardingCompleted ? (
            <Status variant="success">Starts on {formatDate(info.row.original.startedAt)}</Status>
          ) : info.row.original.user.invitationAcceptedAt ? (
            <Status variant="primary">In Progress</Status>
          ) : (
            <Status variant="primary">Invited</Status>
          ),
      }),
    ],
    [],
  );

  const table = useTable({
    columns,
    data: workers,
    initialState: {
      sorting: [{ id: "Status", desc: false }],
    },
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const actionsPanel = (
    <ActionPanel
      showInviteLinkModal={() => setShowInviteLinkModal(true)}
      showInviteModal={() => setShowInviteModal(true)}
    />
  );

  return (
    <>
      <DashboardHeader title="People" headerActions={workers.length === 0 ? actionsPanel : null} />

      {isLoading ? (
        <TableSkeleton columns={4} />
      ) : workers.length > 0 ? (
        <DataTable table={table} searchColumn="user_name" actions={actionsPanel} />
      ) : (
        <div className="mx-4">
          <Placeholder icon={Users}>Contractors will show up here.</Placeholder>
        </div>
      )}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who's joining?</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Contractor's email"
                        onChange={(e) => field.onChange(removeMailtoPrefix(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker {...field} label="Start date" granularity="day" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormFields />

              <FormField
                control={form.control}
                name="contractSignedElsewhere"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        label="Already signed contract elsewhere"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch("contractSignedElsewhere") && <NewDocumentField />}
              <div className="flex flex-col items-end space-y-2">
                <MutationStatusButton mutation={saveMutation} type="submit">
                  Send invite
                </MutationStatusButton>
                {saveMutation.isError ? <div className="text-red text-sm">{saveMutation.error.message}</div> : null}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <InviteLinkModal open={showInviteLinkModal} onOpenChange={setShowInviteLinkModal} />
    </>
  );
}

const ActionPanel = ({
  showInviteLinkModal,
  showInviteModal,
}: {
  showInviteLinkModal: () => void;
  showInviteModal: () => void;
}) => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="floating-action">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Invite people to your workspace</DialogTitle>
        <DialogDescription className="sr-only">Invite people to your workspace</DialogDescription>
        <div className="flex flex-col gap-3">
          <DialogClose asChild onClick={showInviteLinkModal}>
            <Button size="small" variant="outline">
              <LinkIcon className="size-4" />
              Invite link
            </Button>
          </DialogClose>
          <DialogClose asChild onClick={showInviteModal}>
            <Button size="small">
              <Plus className="size-4" />
              Add contractor
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <div className="flex flex-row gap-2">
      <Button size="small" variant="outline" onClick={showInviteLinkModal}>
        <LinkIcon className="size-4" />
        Invite link
      </Button>
      <Button size="small" onClick={showInviteModal}>
        <Plus className="size-4" />
        Add contractor
      </Button>
    </div>
  );
};
