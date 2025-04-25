"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { InformationCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { pick } from "lodash-es";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Delta from "@/components/Delta";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import MutationButton from "@/components/MutationButton";
import NumberInput from "@/components/NumberInput";
import RadioButtons from "@/components/RadioButtons";
import { Editor as RichTextEditor } from "@/components/RichText";
import Select from "@/components/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PayRateType } from "@/db/enums";
import { useCurrentCompany } from "@/global";
import { trpc } from "@/trpc/client";
import { formatMoneyFromCents } from "@/utils/formatMoney";
import { pluralize } from "@/utils/pluralize";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  payRateType: z.nativeEnum(PayRateType),
  payRateInSubunits: z.number().min(1, "Rate is required"),
  trialEnabled: z.boolean().default(false),
  trialPayRateInSubunits: z.number().default(0),
  activelyHiring: z.boolean().default(false),
  jobDescription: z.string().default(""),
  capitalizedExpense: z.number().default(50),
  expenseAccountId: z.string().nullable().default(null),
  expenseCardEnabled: z.boolean().default(false),
  expenseCardSpendingLimitCents: z.bigint().default(BigInt(0)),
});

type FormValues = z.infer<typeof formSchema>;

const ManageModal = ({
  open,
  onClose,
  id,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  id: string | null;
  onCreated?: (id: string) => void;
}) => {
  const company = useCurrentCompany();
  const trpcUtils = trpc.useUtils();

  const [roles] = trpc.roles.list.useSuspenseQuery({ companyId: company.id });
  const getSelectedRole = () => {
    const role = roles.find((role) => role.id === id);
    if (role) return role;
    const defaults = {
      id: "",
      name: "",
      payRateInSubunits: 0,
      payRateType: PayRateType.Hourly,
      trialEnabled: false,
      trialPayRateInSubunits: 0,
      applicationCount: 0,
      activelyHiring: false,
      jobDescription: "",
      capitalizedExpense: 50,
      expenseAccountId: null,
      expenseCardEnabled: false,
      expenseCardSpendingLimitCents: 0n,
      expenseCardsCount: 0,
    };
    const lastRole = roles[0];
    return lastRole
      ? { ...defaults, ...pick(lastRole, "payRateInSubunits", "trialPayRateInSubunits", "capitalizedExpense") }
      : defaults;
  };
  
  const selectedRole = getSelectedRole();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: selectedRole.name,
      payRateType: selectedRole.payRateType,
      payRateInSubunits: selectedRole.payRateInSubunits,
      trialEnabled: selectedRole.trialEnabled,
      trialPayRateInSubunits: selectedRole.trialPayRateInSubunits,
      activelyHiring: selectedRole.activelyHiring,
      jobDescription: selectedRole.jobDescription,
      capitalizedExpense: selectedRole.capitalizedExpense ?? 50,
      expenseAccountId: selectedRole.expenseAccountId,
      expenseCardEnabled: selectedRole.expenseCardEnabled,
      expenseCardSpendingLimitCents: selectedRole.expenseCardSpendingLimitCents,
    },
  });
  
  useEffect(() => {
    if (id) {
      const role = getSelectedRole();
      form.reset({
        name: role.name,
        payRateType: role.payRateType,
        payRateInSubunits: role.payRateInSubunits,
        trialEnabled: role.trialEnabled,
        trialPayRateInSubunits: role.trialPayRateInSubunits,
        activelyHiring: role.activelyHiring,
        jobDescription: role.jobDescription,
        capitalizedExpense: role.capitalizedExpense ?? 50,
        expenseAccountId: role.expenseAccountId,
        expenseCardEnabled: role.expenseCardEnabled,
        expenseCardSpendingLimitCents: role.expenseCardSpendingLimitCents,
      });
    }
  }, [id, form]);
  
  const [updateContractorRates, setUpdateContractorRates] = useState(false);
  const [confirmingRateUpdate, setConfirmingRateUpdate] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  
  const watchPayRateInSubunits = form.watch("payRateInSubunits");
  const watchPayRateType = form.watch("payRateType");
  const watchTrialEnabled = form.watch("trialEnabled");
  const watchExpenseCardEnabled = form.watch("expenseCardEnabled");
  
  useEffect(() => {
    if (!id && watchPayRateInSubunits > 0) {
      form.setValue("trialPayRateInSubunits", Math.floor(watchPayRateInSubunits / 2));
    }
  }, [watchPayRateInSubunits, id, form]);
  
  const [quickbooks] = trpc.quickbooks.get.useSuspenseQuery({ companyId: company.id });
  const expenseAccounts = quickbooks?.expenseAccounts ?? [];
  const [{ workers: contractors }, { refetch: refetchContractors }] = trpc.contractors.list.useSuspenseQuery({
    companyId: company.id,
    roleId: id || "",
    type: "not_alumni",
  });
  
  const deleteMutation = trpc.roles.delete.useMutation({
    onSuccess: async () => {
      await trpcUtils.roles.list.invalidate();
      setConfirmingDelete(false);
      onClose();
    },
  });

  const contractorsToUpdate = contractors.filter(
    (contractor) => contractor.payRateInSubunits !== watchPayRateInSubunits,
  );
  const canDelete = contractors.length === 0;

  const createRoleMutation = trpc.roles.create.useMutation();
  const updateRoleMutation = trpc.roles.update.useMutation();
  const updateContractorMutation = trpc.contractors.update.useMutation();
  
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      setConfirmingRateUpdate(false);
      const params = { companyId: company.id, ...values, id: id || "" };

      if (id) {
        await updateRoleMutation.mutateAsync(params);
        if (updateContractorRates) {
          await Promise.all(
            contractorsToUpdate.map((contractor) =>
              updateContractorMutation.mutateAsync({
                companyId: company.id,
                id: contractor.id,
                payRateInSubunits: values.payRateInSubunits,
              }),
            ),
          );
          await refetchContractors();
        }
      } else {
        const newId = await createRoleMutation.mutateAsync(params);
        return newId;
      }
    },
    onSuccess: async (newId) => {
      await trpcUtils.roles.list.invalidate({ companyId: company.id });
      if (newId) onCreated?.(newId);
      onClose();
    },
  });
  
  const onSubmit = form.handleSubmit((values) => {
    if (contractorsToUpdate.length > 0 && updateContractorRates && id) {
      setConfirmingRateUpdate(true);
    } else {
      saveMutation.mutate(values);
    }
  });

  return (
    <>
      <Modal open={open} onClose={onClose} title={id ? "Edit role" : "New role"}>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payRateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioButtons
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { label: "Hourly", value: PayRateType.Hourly } as const,
                        { label: "Project-based", value: PayRateType.ProjectBased } as const,
                        company.flags.includes("salary_roles") ? ({ label: "Salary", value: PayRateType.Salary } as const) : null,
                      ].filter((option) => !!option)}
                      disabled={!!id}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className={`grid gap-3 ${expenseAccounts.length > 0 ? "md:grid-cols-2" : ""}`}>
              <FormField
                control={form.control}
                name="payRateInSubunits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="pay-rate">Rate</FormLabel>
                    <FormControl>
                      <NumberInput
                        id="pay-rate"
                        value={field.value / 100}
                        onChange={(value) => field.onChange((value ?? 0) * 100)}
                        prefix="$"
                        suffix={
                          watchPayRateType === PayRateType.Hourly
                            ? "/ hour"
                            : watchPayRateType === PayRateType.Salary
                              ? "/ year"
                              : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {expenseAccounts.length > 0 && (
                <FormField
                  control={form.control}
                  name="capitalizedExpense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="capitalized-expense">Capitalized R&D expense</FormLabel>
                      <FormControl>
                        <NumberInput
                          id="capitalized-expense"
                          value={field.value ?? 0}
                          onChange={(value) => field.onChange(value ?? 0)}
                          suffix="%"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {id && contractorsToUpdate.length > 0 ? (
              <>
                {!updateContractorRates && (
                  <Alert>
                    <InformationCircleIcon />
                    <AlertDescription>
                      {contractorsToUpdate.length}{" "}
                      {contractorsToUpdate.length === 1 ? "contractor has a" : "contractors have"} different{" "}
                      {pluralize("rate", contractorsToUpdate.length)} that won't be updated.
                    </AlertDescription>
                  </Alert>
                )}
                <Checkbox
                  checked={updateContractorRates}
                  onCheckedChange={(checked) => setUpdateContractorRates(checked === true)}
                  label="Update rate for all contractors with this role"
                />
              </>
            ) : null}
            
            {id && watchPayRateType === PayRateType.Hourly ? (
              <FormField
                control={form.control}
                name="trialEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        label="Start with trial period"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            {id && watchTrialEnabled ? (
              <FormField
                control={form.control}
                name="trialPayRateInSubunits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="trial-rate">Rate during trial period</FormLabel>
                    <FormControl>
                      <NumberInput
                        id="trial-rate"
                        value={field.value / 100}
                        onChange={(value) => field.onChange((value ?? 0) * 100)}
                        prefix="$"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            {id ? (
              <FormField
                control={form.control}
                name="expenseCardEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        label="Role should get expense card"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            {id && watchExpenseCardEnabled ? (
              <FormField
                control={form.control}
                name="expenseCardSpendingLimitCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="expense-limit">Limit</FormLabel>
                    <FormControl>
                      <NumberInput
                        id="expense-limit"
                        value={Number(field.value) / 100}
                        onChange={(value) => field.onChange(BigInt((value ?? 0) * 100))}
                        prefix="$"
                        suffix="/ month"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            
            {id && !watchExpenseCardEnabled && selectedRole.expenseCardsCount > 0 ? (
              <Alert variant="destructive">
                <ExclamationTriangleIcon />
                <AlertDescription>{selectedRole.expenseCardsCount} issued cards will no longer be usable.</AlertDescription>
              </Alert>
            ) : null}
            
            {id ? (
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job description</FormLabel>
                    <FormControl>
                      <RichTextEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            {expenseAccounts.length > 0 ? (
              <FormField
                control={form.control}
                name="expenseAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense account</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Default" },
                          ...expenseAccounts.map(({ id, name }) => ({ value: id, label: name })),
                        ]}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            {id ? (
              <FormField
                control={form.control}
                name="activelyHiring"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        label="Accepting candidates"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            
            <div className="flex w-full gap-3">
              <Button className="flex-1" type="submit">
                {id ? "Save changes" : "Create"}
              </Button>
              {id ? (
                <Tooltip>
                  <TooltipTrigger asChild={canDelete}>
                    <Button
                      variant="critical"
                      aria-label="Delete role"
                      disabled={!canDelete}
                      onClick={() => setConfirmingDelete(true)}
                      type="button"
                    >
                      <TrashIcon className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  {!canDelete ? <TooltipContent>You can't delete roles with active contractors</TooltipContent> : null}
                </Tooltip>
              ) : null}
            </div>
          </form>
        </Form>
      </Modal>
      
      <Modal
        open={confirmingRateUpdate}
        onClose={() => setConfirmingRateUpdate(false)}
        title={`Update rates for ${contractorsToUpdate.length} ${pluralize("contractor", contractorsToUpdate.length)} to match role rate?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmingRateUpdate(false)}>
              Cancel
            </Button>
            <MutationButton mutation={saveMutation} param={form.getValues()}>Yes, change</MutationButton>
          </>
        }
      >
        <div>Rate changes will apply to future invoices.</div>
        <Card>
          <CardContent>
            {contractorsToUpdate.map((contractor, i) => (
              <Fragment key={i}>
                <div className="flex justify-between gap-2">
                  <b>{contractor.user.name}</b>
                  <div>
                    <del>{formatMoneyFromCents(contractor.payRateInSubunits)}</del>{" "}
                    {formatMoneyFromCents(watchPayRateInSubunits)}{" "}
                    <span>
                      (<Delta diff={watchPayRateInSubunits / contractor.payRateInSubunits - 1} />)
                    </span>
                  </div>
                </div>
                {i !== contractorsToUpdate.length - 1 && <Separator />}
              </Fragment>
            ))}
          </CardContent>
        </Card>
      </Modal>
      
      <Modal title="Permanently delete role?" open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        {selectedRole.applicationCount ? <p>This will remove {selectedRole.applicationCount} candidates.</p> : null}
        <p>This action cannot be undone.</p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
            No, cancel
          </Button>
          <MutationButton mutation={deleteMutation} param={{ companyId: company.id, id: id || "" }}>
            Yes, delete
          </MutationButton>
        </div>
      </Modal>
    </>
  );
};

export default ManageModal;
