"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils";

export function DatePicker({
  value,
  onChange,
  invalid,
  className,
  ...props
}: {
  value: Date | null | undefined;
  onChange: (date: Date) => void;
  invalid?: boolean;
} & Omit<ComponentProps<typeof Button>, "value" | "onChange">) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start text-left font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive ring-destructive/20 dark:ring-destructive/40 focus-visible:ring-[3px]",
            className,
          )}
          {...props}
        >
          <CalendarIcon className="opacity-60" size={20} />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
