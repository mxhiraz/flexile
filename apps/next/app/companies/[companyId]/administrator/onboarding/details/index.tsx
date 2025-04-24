"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ComboBox from "@/components/ComboBox";
import { MutationStatusButton } from "@/components/MutationButton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/global";
import { usStates } from "@/models";
import { request } from "@/utils/request";
import { company_administrator_onboarding_path, details_company_administrator_onboarding_path } from "@/utils/routes";

const formSchema = z.object({
  legal_name: z.string().refine((val) => /\S+\s+\S+/u.test(val), {
    message: "This doesn't look like a complete full name",
  }),
  company: z.object({
    name: z.string().min(1, "This field is required"),
    street_address: z.string().min(1, "This field is required"),
    city: z.string().min(1, "This field is required"),
    state: z.string().min(1, "This field is required"),
    zip_code: z.string().regex(/^\d{5}(?:-\d{4})?$/u, { message: "Enter a valid ZIP code" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const CompanyDetails = () => {
  const user = useCurrentUser();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: ["administratorOnboardingDetails", user.currentCompanyId],
    queryFn: async () => {
      const response = await request({
        url: details_company_administrator_onboarding_path(user.currentCompanyId || "_"),
        method: "GET",
        accept: "json",
        assertOk: true,
      });
      return z
        .object({
          company: z.object({
            name: z.string().nullable(),
            street_address: z.string().nullable(),
            city: z.string().nullable(),
            state: z.string().nullable(),
            zip_code: z.string().nullable(),
          }),
          states: z.array(z.tuple([z.string(), z.string()])),
          legal_name: z.string().nullable(),
          on_success_redirect_path: z.string(),
        })
        .parse(await response.json());
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legal_name: data.legal_name || "",
      company: {
        name: data.company.name || "",
        street_address: data.company.street_address || "",
        city: data.company.city || "",
        state: data.company.state || "",
        zip_code: data.company.zip_code || "",
      },
    },
  });

  const submit = useMutation({
    mutationFn: async (values: FormValues) => {
      await request({
        method: "PATCH",
        accept: "json",
        url: company_administrator_onboarding_path(user.currentCompanyId || "_"),
        assertOk: true,
        jsonData: values,
      });

      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const onSubmit = form.handleSubmit((values) => submit.mutate(values));

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <FormField
          control={form.control}
          name="legal_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="legal-name">Your full legal name</FormLabel>
              <FormControl>
                <Input id="legal-name" {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="company-name">Your company's legal name</FormLabel>
              <FormControl>
                <Input id="company-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company.street_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="street-address">Street address, apt number</FormLabel>
              <FormControl>
                <Input id="street-address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <FormField
            control={form.control}
            name="company.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="city">City</FormLabel>
                <FormControl>
                  <Input id="city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="state">State</FormLabel>
                <FormControl>
                  <ComboBox
                    id="state"
                    {...field}
                    placeholder="Choose State"
                    options={usStates.map(({ name, code }) => ({ value: code, label: name }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company.zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="zip-code">ZIP code</FormLabel>
                <FormControl>
                  <Input id="zip-code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="text-xs">Flexile is only available for companies based in the United States.</div>

        <MutationStatusButton mutation={submit} idleVariant="primary" type="submit" loadingText="Saving...">
          Continue
        </MutationStatusButton>
      </form>
    </Form>
  );
};
