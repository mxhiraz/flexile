"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { cn } from "../../utils"; // Use relative path
import { Button } from "./button"; // Use relative path
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"; // Use relative path
import { Popover, PopoverContent, PopoverTrigger } from "./popover"; // Use relative path

type ComboboxOption = {
  value: string;
  label: string;
};

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      searchPlaceholder = "Search...",
      emptyPlaceholder = "Nothing found.",
      className,
      popoverClassName,
      disabled = false,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {value ? options.find((option) => option.value === value)?.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverClassName)}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue); // Allow deselect by selecting again
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

Combobox.displayName = "Combobox";

export { Combobox };
