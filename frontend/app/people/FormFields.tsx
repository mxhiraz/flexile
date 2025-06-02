import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PayRateType, trpc } from "@/trpc/client";
import { useFormContext, useFieldArray } from "react-hook-form";
import RadioButtons from "@/components/RadioButtons";
import NumberInput from "@/components/NumberInput";
import { useUserStore } from "@/global";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { skipToken } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

export default function FormFields() {
  const form = useFormContext();
  const companyId = useUserStore((state) => state.user?.currentCompanyId);
  const { data: workers } = trpc.contractors.list.useQuery(companyId ? { companyId, excludeAlumni: true } : skipToken);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payRates",
  });

  const uniqueRoles = workers ? Array.from(new Set(workers.map((worker) => worker.role))).sort() : [];
  const roleRegex = new RegExp(`${form.watch("role")}`, "iu");

  const addPayRate = () => {
    append({
      type: PayRateType.Hourly,
      amount: 0,
      currency: "usd",
    });
  };

  const getPayRateSuffix = (type: PayRateType) => {
    switch (type) {
      case PayRateType.ProjectBased:
        return "/ project";
      case PayRateType.Salary:
        return "/ year";
      case PayRateType.Hourly:
      default:
        return "/ hour";
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Command shouldFilter={false} value={uniqueRoles.find((role) => roleRegex.test(role)) ?? ""}>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Input {...field} type="text" />
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  className="p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <CommandList>
                    <CommandGroup>
                      {uniqueRoles.map((option) => (
                        <CommandItem key={option} value={option} onSelect={(e) => field.onChange(e)}>
                          {option}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </PopoverContent>
              </Popover>
            </Command>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel>Pay rates</FormLabel>
          <Button type="button" variant="outline" size="small" onClick={addPayRate}>
            <Plus className="mr-2 size-4" />
            Add pay rate
          </Button>
        </div>

        {fields.map((field, index) => {
          const payRateType = PayRateType.Hourly;
          return (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Pay rate {index + 1}</h4>
                {fields.length > 1 && (
                  <Button type="button" variant="outline" size="small" onClick={() => remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`payRates.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioButtons
                        {...field}
                        options={[
                          { label: "Hourly", value: PayRateType.Hourly } as const,
                          { label: "Project-based", value: PayRateType.ProjectBased } as const,
                          { label: "Salary", value: PayRateType.Salary } as const,
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid items-start gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`payRates.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value == null ? null : field.value / 100}
                          onChange={(value) => field.onChange(value == null ? null : value * 100)}
                          placeholder="0"
                          prefix="$"
                          suffix={getPayRateSuffix(payRateType)}
                          decimal
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`payRates.${index}.currency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="usd" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <FormField
        control={form.control}
        name="hoursPerWeek"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Average hours per week</FormLabel>
            <FormControl>
              <NumberInput {...field} suffix="/ week" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
