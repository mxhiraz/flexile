"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { iso31662 } from "iso-3166";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LegalCertificationModal from "@/app/onboarding/LegalCertificationModal";
import FormSection from "@/components/FormSection";
import RadioButtons from "@/components/RadioButtons";
import Select from "@/components/Select";
import Status from "@/components/Status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessType, TaxClassification } from "@/db/enums";
import { useCurrentUser } from "@/global";
import { countries } from "@/models/constants";
import { trpc } from "@/trpc/client";
import { getTinName } from "@/utils/legal";
import { request } from "@/utils/request";
import { settings_tax_path } from "@/utils/routes";
import SettingsLayout from "../Layout";

const dataSchema = z.object({
  birth_date: z.string().nullable(),
  business_name: z.string().nullable(),
  business_type: z.number().nullable(),
  tax_classification: z.number().nullable(),
  citizenship_country_code: z.string(),
  city: z.string(),
  country_code: z.string(),
  display_name: z.string(),
  business_entity: z.boolean(),
  is_foreign: z.boolean(),
  is_tax_information_confirmed: z.boolean(),
  legal_name: z.string(),
  signature: z.string(),
  state: z.string(),
  street_address: z.string(),
  tax_id: z.string().nullable(),
  tax_id_status: z.enum(["verified", "invalid"]).nullable(),
  zip_code: z.string(),
  contractor_for_companies: z.array(z.string()),
});

const isForeign = (data: { citizenship_country_code?: string | null; country_code?: string | null }) =>
  data.citizenship_country_code !== "US" && data.country_code !== "US";

const taxFormSchema = z
  .object({
    legal_name: z.string().refine((name) => /\S+\s+\S+/u.test(name), {
      message: "This doesn't look like a complete full name.",
    }),
    citizenship_country_code: z.string().min(1, "Country of citizenship is required."),
    business_entity: z.boolean(),
    business_name: z.string().nullable(),
    business_type: z.nativeEnum(BusinessType).nullable(),
    tax_classification: z.nativeEnum(TaxClassification).nullable(),
    country_code: z.string().min(1, "Country of residence/incorporation is required."),
    tax_id: z.string().nullable(),
    birth_date: z.string().nullable(),
    street_address: z.string().min(1, "Please add your residential address."),
    city: z.string().min(1, "Please add your city or town."),
    state: z.string().nullable(),
    zip_code: z.string().min(1, "Postal/ZIP code is required."),
  })
  .refine((data) => !data.business_entity || !!data.business_name, {
    message: "Please add your business legal name.",
    path: ["business_name"],
  })
  .refine((data) => !(!isForeign(data) && data.business_entity) || data.business_type !== null, {
    message: "Please select a business type.",
    path: ["business_type"],
  })
  .refine((data) => !(data.business_type === BusinessType.LLC) || data.tax_classification !== null, {
    message: "Please select a tax classification.",
    path: ["tax_classification"],
  })
  .refine((formData) => !!formData.tax_id, {
    message: "Please add your SSN or ITIN.",
    path: ["tax_id"],
  })
  .refine((formData) => isForeign(formData) || (formData.tax_id && formData.tax_id.replace(/\D/gu, "").length === 9), {
    message: "Please check that your SSN or ITIN is 9 numbers long.",
    path: ["tax_id"],
  })
  .refine((formData) => isForeign(formData) || !/^(\d)\1{8}$/u.test(formData.tax_id?.replace(/\D/gu, "") ?? ""), {
    message: "Your EIN can't have all identical digits.",
    path: ["tax_id"],
  })
  .refine(
    (formData) => {
      const subdivisions = iso31662.filter((entry) => entry.code.startsWith(`${formData.country_code}-`));
      return subdivisions.length === 0 || !!formData.state;
    },
    {
      message: "Please select a state/province.",
      path: ["state"],
    },
  )
  .refine(
    (formData) =>
      formData.country_code !== "US" ||
      (formData.zip_code && /(^\d{5}|\d{9}|\d{5}[- ]\d{4})$/u.test(formData.zip_code)),
    {
      message: "Please add a valid ZIP code (5 or 9 digits).",
      path: ["zip_code"],
    },
  )
  .refine((formData) => formData.country_code === "US" || (formData.zip_code && /\d/u.test(formData.zip_code)), {
    message: "Please add a valid postal code (must contain at least one number).",
    path: ["zip_code"],
  });

type TaxFormValues = z.infer<typeof taxFormSchema>;

export default function TaxPage() {
  const user = useCurrentUser();

  const { data } = useSuspenseQuery({
    queryKey: ["settings-tax"],
    queryFn: async () => {
      const response = await request({ accept: "json", method: "GET", url: settings_tax_path(), assertOk: true });
      const initialData = dataSchema.parse(await response.json());
      return initialData;
    },
  });

  const countryCodePrefix = `${data.country_code}-`;
  const countrySubdivisions = iso31662.filter((entry) => entry.code.startsWith(countryCodePrefix));

  const [taxInfoChanged, setTaxInfoChanged] = useState(false);
  const [isTaxInfoConfirmed, setIsTaxInfoConfirmed] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [taxIdChanged, setTaxIdChanged] = useState(false);
  const [taxIdStatus, setTaxIdStatus] = useState<z.infer<typeof dataSchema>["tax_id_status"]>(null);
  const [maskTaxId, setMaskTaxId] = useState(true);

  useEffect(() => {
    form.reset(data);
    setIsTaxInfoConfirmed(data.is_tax_information_confirmed);
    setTaxIdStatus(data.tax_id_status);
  }, [data]);

  const isForeign = useMemo(
    () => data.citizenship_country_code !== "US" && data.country_code !== "US",
    [data.citizenship_country_code, data.country_code],
  );

  const tinName = getTinName(data.business_entity);
  const taxIdPlaceholder = !isForeign ? (data.business_entity ? "XX-XXXXXXX" : "XXX-XX-XXXX") : undefined;
  const zipCodeLabel = data.country_code === "US" ? "ZIP code" : "Postal code";
  const stateLabel = data.country_code === "US" ? "State" : "Province";
  const countryOptions = [...countries].map(([value, label]) => ({ value, label }));

  const normalizedTaxId = (taxId: string | null) => {
    if (!taxId) return null;
    if (isForeign) return taxId.toUpperCase().replace(/[^A-Z0-9]/gu, "");
    return taxId.replace(/[^0-9]/gu, "");
  };

  const formatUSTaxId = (value: string) => {
    if (isForeign) return value;

    const digits = value.replace(/\D/gu, "");
    if (data.business_entity) {
      return digits.replace(/^(\d{2})(\d{0,7})/u, (_, p1: string, p2: string) => (p2 ? `${p1}-${p2}` : p1));
    }
    return digits.replace(/^(\d{3})(\d{0,2})(\d{0,4})/u, (_, p1: string, p2: string, p3: string) => {
      if (p3) return `${p1}-${p2}-${p3}`;
      if (p2) return `${p1}-${p2}`;
      return p1;
    });
  };

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      legal_name: data.legal_name,
      citizenship_country_code: data.citizenship_country_code,
      business_entity: data.business_entity,
      business_name: data.business_name ?? "",
      business_type: data.business_type,
      tax_classification: data.tax_classification,
      country_code: data.country_code,
      tax_id: data.tax_id ?? "",
      birth_date: data.birth_date ?? "",
      street_address: data.street_address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
    },
  });

  const router = useRouter();
  const trpcUtils = trpc.useUtils();
  const updateTaxSettings = trpc.users.updateTaxSettings.useMutation();
  const saveMutation = useMutation({
    mutationFn: async (signature: string) => {
      const validatedData = form.getValues();
      const mutationResult = await updateTaxSettings.mutateAsync({
        data: { ...validatedData, tax_id: normalizedTaxId(validatedData.tax_id), signature },
      });

      setIsTaxInfoConfirmed(true);
      setTaxInfoChanged(false);
      if (taxIdChanged) setTaxIdStatus(null);
      setTaxIdChanged(false);
      setShowCertificationModal(false);
      if (mutationResult.documentId) {
        await trpcUtils.documents.list.invalidate();
        router.push(`/documents?sign=${mutationResult.documentId}`);
      }
    },
  });

  const handleSave = (_values: TaxFormValues) => {
    setShowCertificationModal(true);
  };

  return (
    <SettingsLayout>
      <FormSection
        title="Tax information"
        description={`These details will be included in your ${
          user.roles.worker ? "invoices and " : ""
        }applicable tax forms.`}
        onSubmit={(e) => void form.handleSubmit(handleSave)(e)}
      >
        <Form {...form}>
          <CardContent className="grid gap-4">
            {!isTaxInfoConfirmed && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon />
                <AlertDescription>
                  Confirm your tax information to avoid delays on your payments or additional tax withholding.
                </AlertDescription>
              </Alert>
            )}

            {data.tax_id_status === "invalid" && (
              <Alert>
                <InformationCircleIcon />
                <AlertTitle>Review your tax information</AlertTitle>
                <AlertDescription>
                  Since there's a mismatch between the legal name and {tinName} you provided and your government
                  records, please note that your payments could experience a tax withholding rate of 24%. If you think
                  this may be due to a typo or recent changes to your name or legal entity, please update your
                  information.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="legal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full legal name (must match your ID)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full legal name" {...field} value={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Select
              value={data.citizenship_country_code}
              onChange={(value) => form.setValue("citizenship_country_code", value)}
              options={countryOptions}
              label="Country of citizenship"
            />

            <RadioButtons
              value={data.business_entity ? "business" : "individual"}
              onChange={(value) => form.setValue("business_entity", value === "business")}
              label="Type of entity"
              options={[
                { label: "Individual", value: "individual" },
                { label: "Business", value: "business" },
              ]}
            />

            {data.business_entity ? (
              <div className="grid auto-cols-fr grid-flow-col items-start gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="business-name">Business legal name</Label>
                  <Input
                    id="business-name"
                    value={data.business_name ?? ""}
                    onChange={(e) => form.setValue("business_name", e.target.value)}
                    placeholder="Enter business legal name"
                    className={form.formState.errors.business_name ? "border-red-500" : ""}
                  />
                  {!!form.formState.errors.business_name && (
                    <div className="text-destructive text-sm">{form.formState.errors.business_name.message}</div>
                  )}
                </div>

                {!isForeign ? (
                  <>
                    <Select
                      value={data.business_type?.toString() ?? ""}
                      onChange={(value) => form.setValue("business_type", +value)}
                      options={[
                        { label: "C corporation", value: BusinessType.CCorporation.toString() },
                        { label: "S corporation", value: BusinessType.SCorporation.toString() },
                        { label: "Partnership", value: BusinessType.Partnership.toString() },
                        { label: "LLC", value: BusinessType.LLC.toString() },
                      ]}
                      label="Type"
                      placeholder="Select business type"
                    />

                    {data.business_type === BusinessType.LLC && (
                      <Select
                        value={data.tax_classification?.toString() || ""}
                        onChange={(value) => form.setValue("tax_classification", +value)}
                        options={[
                          { label: "C corporation", value: TaxClassification.CCorporation.toString() },
                          { label: "S corporation", value: TaxClassification.SCorporation.toString() },
                          { label: "Partnership", value: TaxClassification.Partnership.toString() },
                        ]}
                        label="Tax classification"
                        placeholder="Select tax classification"
                      />
                    )}
                  </>
                ) : null}
              </div>
            ) : null}

            <Select
              value={data.country_code}
              onChange={(value) => form.setValue("country_code", value)}
              options={countryOptions}
              label={`Country of ${data.business_entity ? "incorporation" : "residence"}`}
            />

            <div className="grid items-start gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="flex justify-between gap-2">
                  <Label htmlFor="tax-id">
                    {useMemo(() => (isForeign ? "Foreign tax ID" : `Tax ID (${tinName})`), [isForeign, tinName])}
                  </Label>
                  {!isForeign && data.tax_id && !taxIdChanged ? (
                    <>
                      {taxIdStatus === "verified" && <Status variant="success">VERIFIED</Status>}
                      {taxIdStatus === "invalid" && <Status variant="critical">INVALID</Status>}
                      {!taxIdStatus && <Status variant="primary">VERIFYING</Status>}
                    </>
                  ) : null}
                </div>
                <div className="relative">
                  <Input
                    id="tax-id"
                    value={formatUSTaxId(data.tax_id ?? "")}
                    type={maskTaxId ? "password" : "text"}
                    onChange={(e) => {
                      form.setValue("tax_id", normalizedTaxId(e.target.value));
                      setTaxIdChanged(true);
                    }}
                    placeholder={taxIdPlaceholder}
                    className={form.formState.errors.tax_id ? "border-red-500 pr-10" : "pr-10"}
                    autoComplete="flexile-tax-id"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Button
                      variant="link"
                      className="h-full p-0"
                      onPointerDown={() => setMaskTaxId(false)}
                      onPointerUp={() => setMaskTaxId(true)}
                      onPointerLeave={() => setMaskTaxId(true)}
                      onTouchStart={() => setMaskTaxId(false)}
                      onTouchEnd={() => setMaskTaxId(true)}
                      onTouchCancel={() => setMaskTaxId(true)}
                    >
                      {maskTaxId ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
                {!!form.formState.errors.tax_id && (
                  <div className="text-destructive text-sm">{form.formState.errors.tax_id.message}</div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="birth-date">{`Date of ${data.business_entity ? "incorporation" : "birth"} (optional)`}</Label>
                <Input
                  id="birth-date"
                  value={data.birth_date ?? ""}
                  onChange={(e) => form.setValue("birth_date", e.target.value)}
                  type="date"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="street-address">Residential address (street name, number, apartment)</Label>
              <Input
                id="street-address"
                value={data.street_address}
                onChange={(e) => form.setValue("street_address", e.target.value)}
                placeholder="Enter address"
                className={form.formState.errors.street_address ? "border-red-500" : ""}
              />
              {!!form.formState.errors.street_address && (
                <div className="text-destructive text-sm">{form.formState.errors.street_address.message}</div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => form.setValue("city", e.target.value)}
                placeholder="Enter city"
                className={form.formState.errors.city ? "border-red-500" : ""}
              />
              {!!form.formState.errors.city && (
                <div className="text-destructive text-sm">{form.formState.errors.city.message}</div>
              )}
            </div>

            <div className="grid items-start gap-3 md:grid-cols-2">
              <Select
                value={data.state}
                onChange={(value) => form.setValue("state", value)}
                options={countrySubdivisions.map((entry) => ({
                  value: entry.code.slice(countryCodePrefix.length),
                  label: entry.name,
                }))}
                label={stateLabel}
              />

              <div className="grid gap-2">
                <Label htmlFor="zip-code">{zipCodeLabel}</Label>
                <Input
                  id="zip-code"
                  value={data.zip_code}
                  onChange={(e) => form.setValue("zip_code", e.target.value)}
                  placeholder={`Enter ${zipCodeLabel.toLowerCase()}`}
                  className={form.formState.errors.zip_code ? "border-red-500" : ""}
                />
                {!!form.formState.errors.zip_code && (
                  <div className="text-destructive text-sm">{form.formState.errors.zip_code.message}</div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-wrap gap-4">
            <Button disabled={!taxInfoChanged && isTaxInfoConfirmed} type="submit">
              Save changes
            </Button>

            {user.roles.worker ? (
              <div>
                Changes to your tax information may trigger{" "}
                {data.contractor_for_companies.length === 1 ? "a new contract" : "new contracts"} with{" "}
                {data.contractor_for_companies.join(", ")}
              </div>
            ) : null}
          </CardFooter>

          <LegalCertificationModal
            open={showCertificationModal}
            onClose={() => setShowCertificationModal(false)}
            legalName={data.legal_name}
            isForeignUser={isForeign}
            isBusiness={data.business_entity}
            mutation={saveMutation}
          />
        </Form>
      </FormSection>
    </SettingsLayout>
  );
}
