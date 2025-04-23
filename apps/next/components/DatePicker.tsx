"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useId } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils";

export function DatePicker({
  value,
  onChange,
  id,
  invalid,
}: {
  value: Date | null | undefined;
  onChange: (date: Date) => void;
  id?: string;
  invalid?: boolean;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          variant="outline"
          className={cn(
            "w-auto justify-start text-left font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive ring-destructive/20 dark:ring-destructive/40 focus-visible:ring-[3px]",
          )}
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
