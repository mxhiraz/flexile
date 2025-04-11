import * as React from "react"
import { cn } from "../../utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

export type Option = Readonly<{ label: string; value: string }>;

export interface SelectWrapperProps {
  id?: string | undefined;
  className?: string | undefined;
  label?: React.ReactNode | undefined;
  ariaLabel?: string | undefined;
  disabled?: boolean | undefined;
  help?: string | undefined;
  invalid?: boolean | undefined;
  options: readonly Option[];
  placeholder?: string | undefined;
  value: string | null | undefined;
  onChange: (value: string) => void;
}

const SelectWrapper = React.forwardRef<HTMLSelectElement, SelectWrapperProps>(
  ({ id, className, label, ariaLabel, disabled = false, help, invalid = false, options, placeholder, value, onChange }, ref) => {
    const uid = React.useId();
    
    React.useEffect(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.setCustomValidity(invalid ? (help ?? "Please select a valid option.") : "");
      }
    }, [invalid, help, ref]);

    return (
      <div className={cn("group grid gap-2", className)}>
        {label ? (
          <label htmlFor={id ?? uid} className="cursor-pointer">
            {label}
          </label>
        ) : null}
        <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger 
            id={id ?? uid}
            aria-label={ariaLabel}
            className={cn(
              "flex h-10 w-full rounded-md border border-black bg-white px-3 py-2 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1",
              invalid && "border-red",
              disabled && "bg-gray-100 opacity-50"
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => (
              <SelectItem key={index} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {help ? <div className={cn("text-xs text-gray-500", invalid && "text-red")}>{help}</div> : null}
      </div>
    );
  }
);

SelectWrapper.displayName = "SelectWrapper";

export { SelectWrapper };
