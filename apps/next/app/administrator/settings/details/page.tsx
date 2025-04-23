"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Map } from "immutable";
import { useEffect, useState } from "react";
import FormSection from "@/components/FormSection";
import MutationButton from "@/components/MutationButton";
import Select from "@/components/Select";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCurrentCompany } from "@/global";
import { usStates } from "@/models";
import { trpc } from "@/trpc/client";

export default function Details() {
  const company = useCurrentCompany();
  const [settings] = trpc.companies.settings.useSuspenseQuery({ companyId: company.id });
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const [name, setName] = useState(settings.name ?? "");
  const [taxId, setTaxId] = useState(settings.taxId ?? "");
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber ?? "");
  const [streetAddress, setStreetAddress] = useState(company.address.street_address ?? "");
  const [city, setCity] = useState(company.address.city ?? "");
  const [state, setState] = useState(company.address.state ?? "");
  const [zipCode, setZipCode] = useState(company.address.zip_code ?? "");
  const data = { name, taxId, phoneNumber, streetAddress, city, state, zipCode };
  const [errors, setErrors] = useState(Map<string, string>());
  Object.entries(data).forEach(([key, value]) => useEffect(() => setErrors(errors.delete(key)), [value]));

  const updateSettings = trpc.companies.update.useMutation();
  const saveMutation = useMutation({
    mutationFn: async () => {
      const newErrors = errors.clear().withMutations((errors) => {
        Object.entries(data).forEach(([key, value]) => {
          if (!value) errors.set(key, "This field is required.");
        });

        if (data.phoneNumber.replace(/\D/gu, "").length !== 10) {
          errors.set("phoneNumber", "Please enter a valid U.S. phone number.");
        }

        const taxIdDigits = taxId.replace(/\D/gu, "");
        if (taxIdDigits.length !== 9) errors.set("taxId", "Please check that your EIN is 9 numbers long.");
        else if (/^(\d)\1{8}$/u.test(taxIdDigits)) errors.set("taxId", "Your EIN can't have all identical digits.");
      });
      setErrors(newErrors);
      if (newErrors.size > 0) throw new Error("Invalid form data");

      await updateSettings.mutateAsync({ companyId: company.id, ...data });
      await utils.companies.settings.invalidate();
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onSuccess: () => setTimeout(() => saveMutation.reset(), 2000),
  });

  return (
    <FormSection
      title="Details"
      description="These details will be included in tax forms, as well as in your contractor's invoices."
    >
      <CardContent>
        <div className="grid gap-4">
          <FormItem>
            <FormLabel>Company's legal name</FormLabel>
            <FormControl>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className={errors.has("name") ? "border-red-500" : ""} 
                autoFocus 
              />
            </FormControl>
            {errors.has("name") && <FormMessage>{errors.get("name")}</FormMessage>}
          </FormItem>
          
          <FormItem>
            <FormLabel>EIN</FormLabel>
            <FormControl>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(formatTaxId(e.target.value))}
                placeholder="XX-XXXXXXX"
                className={errors.has("taxId") ? "border-red-500" : ""}
              />
            </FormControl>
            {errors.has("taxId") && <FormMessage>{errors.get("taxId")}</FormMessage>}
          </FormItem>
          
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="(000) 000-0000"
                className={errors.has("phoneNumber") ? "border-red-500" : ""}
              />
            </FormControl>
            {errors.has("phoneNumber") && <FormMessage>{errors.get("phoneNumber")}</FormMessage>}
          </FormItem>
          
          <FormItem>
            <FormLabel>Residential address (street name, number, apt)</FormLabel>
            <FormControl>
              <Input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className={errors.has("streetAddress") ? "border-red-500" : ""}
              />
            </FormControl>
            {errors.has("streetAddress") && <FormMessage>{errors.get("streetAddress")}</FormMessage>}
          </FormItem>
          
          <div className="grid gap-3 md:grid-cols-3">
            <FormItem>
              <FormLabel>City or town</FormLabel>
              <FormControl>
                <Input 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className={errors.has("city") ? "border-red-500" : ""} 
                />
              </FormControl>
              {errors.has("city") && <FormMessage>{errors.get("city")}</FormMessage>}
            </FormItem>
            
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Select
                  value={state || undefined}
                  onChange={setState}
                  placeholder="Choose State"
                  options={usStates.map(({ name, code }) => ({ value: code, label: name }))}
                  invalid={errors.has("state")}
                />
              </FormControl>
              {errors.has("state") && <FormMessage>{errors.get("state")}</FormMessage>}
            </FormItem>
            
            <FormItem>
              <FormLabel>Postal code</FormLabel>
              <FormControl>
                <Input 
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)} 
                  className={errors.has("zipCode") ? "border-red-500" : ""} 
                />
              </FormControl>
              {errors.has("zipCode") && <FormMessage>{errors.get("zipCode")}</FormMessage>}
            </FormItem>
          </div>
          
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Select
                value=""
                onChange={(value) => value}
                placeholder="United States"
                options={[]}
                disabled
              />
            </FormControl>
            <FormMessage>Flexile is currently available only to companies incorporated in the United States.</FormMessage>
          </FormItem>
        </div>
      </CardContent>
      <CardFooter>
        <MutationButton mutation={saveMutation} loadingText="Saving..." successText="Changes saved">
          Save changes
        </MutationButton>
      </CardFooter>
    </FormSection>
  );
}

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/gu, "");
  if (digits.length < 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const formatTaxId = (value: string) => {
  const digits = value.replace(/\D/gu, "");
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};
