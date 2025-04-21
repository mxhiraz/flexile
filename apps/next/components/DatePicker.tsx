"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils";

export function DatePicker({
  selected,
  onSelect,
}: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-auto justify-start text-left font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="opacity-60" size={20} />
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={onSelect} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
