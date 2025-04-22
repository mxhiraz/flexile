"use client";
import { useMutation } from "@tanstack/react-query";
import { formatISO, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useId } from "react";
import { DatePicker } from "@/components/DatePicker";
import FormSection from "@/components/FormSection";
import MainLayout from "@/components/layouts/Main";
import MutationButton from "@/components/MutationButton";
import NumberInput from "@/components/NumberInput";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useCurrentCompany } from "@/global";
import { trpc } from "@/trpc/client";
import { md5Checksum } from "@/utils";

export default function NewTenderOffer() {
  const company = useCurrentCompany();
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minimumValuation, setMinimumValuation] = useState(0);
  const [attachment, setAttachment] = useState<File | undefined>(undefined);

  const startDatePickerId = useId();
  const endDatePickerId = useId();

  const selectedStartDate = useMemo(() => (startDate ? parseISO(startDate) : undefined), [startDate]);
  const selectedEndDate = useMemo(() => (endDate ? parseISO(endDate) : undefined), [endDate]);

  const handleStartDateSelect = (newDate: Date | undefined) => {
    setStartDate(newDate ? formatISO(newDate, { representation: "date" }) : "");
  };
  const handleEndDateSelect = (newDate: Date | undefined) => {
    setEndDate(newDate ? formatISO(newDate, { representation: "date" }) : "");
  };

  const createUploadUrl = trpc.files.createDirectUploadUrl.useMutation();
  const createTenderOffer = trpc.tenderOffers.create.useMutation();

  const valid = startDate && endDate && minimumValuation && attachment;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!valid) return;

      const base64Checksum = await md5Checksum(attachment);
      const { directUploadUrl, key } = await createUploadUrl.mutateAsync({
        isPublic: false,
        filename: attachment.name,
        byteSize: attachment.size,
        checksum: base64Checksum,
        contentType: attachment.type,
      });

      await fetch(directUploadUrl, {
        method: "PUT",
        body: attachment,
        headers: {
          "Content-Type": attachment.type,
          "Content-MD5": base64Checksum,
        },
      });

      await createTenderOffer.mutateAsync({
        companyId: company.id,
        startsAt: new Date(startDate),
        endsAt: new Date(endDate),
        minimumValuation: BigInt(minimumValuation),
        attachmentKey: key,
      });
      router.push(`/equity/tender_offers`);
    },
  });

  return (
    <MainLayout
      title="Start new tender offer"
      headerActions={
        <Button variant="outline" asChild>
          <Link href="/equity/tender_offers">Cancel</Link>
        </Button>
      }
    >
      <FormSection title="Details">
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={startDatePickerId}>Start date</Label>
              <DatePicker id={startDatePickerId} selected={selectedStartDate} onSelect={handleStartDateSelect} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={endDatePickerId}>End date</Label>
              <DatePicker id={endDatePickerId} selected={selectedEndDate} onSelect={handleEndDateSelect} />
            </div>
            <NumberInput
              value={minimumValuation}
              onChange={(value) => setMinimumValuation(value || 0)}
              label="Minimum valuation"
              prefix="$"
            />
            <div className="grid gap-2">
              <Label htmlFor="attachment">Attachment</Label>
              <input
                id="attachment"
                type="file"
                accept="application/zip"
                onChange={(e) => setAttachment(e.target.files?.[0])}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <MutationButton mutation={createMutation} disabled={!valid} loadingText="Creating...">
            Create tender offer
          </MutationButton>
        </CardFooter>
      </FormSection>
    </MainLayout>
  );
}
