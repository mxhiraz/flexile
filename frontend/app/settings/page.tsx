"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { MutationStatusButton } from "@/components/MutationButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCurrentCompany, useCurrentUser } from "@/global";
import defaultLogo from "@/images/default-company-logo.svg";
import { MAX_PREFERRED_NAME_LENGTH, MIN_EMAIL_LENGTH } from "@/models";
import { trpc } from "@/trpc/client";

export default function SettingsPage() {
  return (
      <div className="grid gap-8">
        <DetailsSection />
        <LeaveWorkspaceSection />
      </div>
  );
}

const DetailsSection = () => {
  const user = useCurrentUser();
  const form = useForm({
    defaultValues: {
      email: user.email,
      preferredName: user.preferredName || "",
    },
  });

  const saveMutation = trpc.users.update.useMutation({
    onSuccess: () => setTimeout(() => saveMutation.reset(), 2000),
  });
  const submit = form.handleSubmit((values) => saveMutation.mutate(values));

  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
        <h2 className="mb-4 text-xl font-medium">Profile</h2>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" minLength={MIN_EMAIL_LENGTH} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred name (visible to others)</FormLabel>
              <FormControl>
                <Input placeholder="Enter preferred name" maxLength={MAX_PREFERRED_NAME_LENGTH} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <MutationStatusButton
          className="w-fit"
          type="submit"
          mutation={saveMutation}
          loadingText="Saving..."
          successText="Saved!"
        >
          Save
        </MutationStatusButton>
      </form>
    </Form>
  );
};

const LeaveWorkspaceSection = () => {
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: contractorStatus } = trpc.users.getContractorStatus.useQuery(
    { companyId: company.id },
    {
      enabled: !!company,
    },
  );

  const leaveCompanyMutation = trpc.users.leaveCompany.useMutation({
    onSuccess: () => {
      document.cookie = `${user.id}_selected_company=; path=/; max-age=0`;
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  if (
    !contractorStatus?.isContractor ||
    contractorStatus?.contractSignedElsewhere ||
    contractorStatus?.hasActiveContract ||
    user.roles.administrator
  ) {
    return null;
  }

  const handleLeaveCompany = () => {
    setErrorMessage(null);
    if (!company) return;
    leaveCompanyMutation.mutate({ companyId: company.id });
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setErrorMessage(null);
      leaveCompanyMutation.reset();
    }
    setIsModalOpen(open);
  };

  return (
    <>
      <Separator />
      <div className="grid gap-4">
        <h2 className="text-xl font-medium">Workspace access</h2>
        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="size-8 rounded-md">
              <AvatarImage src={company.logo_url ?? defaultLogo.src} alt="Company logo" />
              <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{company.name}</span>
          </div>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive sm:ml-auto sm:w-auto"
            onClick={() => setIsModalOpen(true)}
          >
            Leave workspace
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this workspace?</DialogTitle>
            <DialogDescription>
              You will lose access to all data and documents in {company.name}. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleModalOpenChange(false)}>
              Cancel
            </Button>
            <MutationStatusButton
              idleVariant="critical"
              mutation={leaveCompanyMutation}
              onClick={handleLeaveCompany}
              loadingText="Leaving..."
              successText="Success!"
            >
              Leave
            </MutationStatusButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
