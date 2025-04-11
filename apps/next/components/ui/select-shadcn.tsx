import * as React from "react"
import { cn } from "../../utils"

export type Option = Readonly<{ label: string; value: string }>;

export interface SelectProps {
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
  ref?: React.ForwardedRef<HTMLSelectElement> | undefined;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, className, label, ariaLabel, disabled = false, help, invalid = false, options, placeholder, value, onChange }, ref) => {
    const uid = React.useId();
    const selectRef = React.useRef<HTMLSelectElement>(null);

    React.useEffect(() => {
      if (selectRef.current) {
        selectRef.current.setCustomValidity(invalid ? (help ?? "Please select a valid option.") : "");
      }
    }, [invalid, help]);

    return (
      <div className={cn("group grid gap-2", className)}>
        {label ? (
          <label htmlFor={id ?? uid} className="cursor-pointer">
            {label}
          </label>
        ) : null}
        <select
          id={id ?? uid}
          ref={(element) => {
            selectRef.current = element;
            if (ref) {
              if (typeof ref === 'function') {
                ref(element);
              } else {
                ref.current = element;
              }
            }
          }}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-black bg-white px-3 py-2 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1",
            invalid && "border-red",
            disabled && "bg-gray-100 opacity-50"
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option, index) => (
            <option key={index} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {help ? <div className={cn("text-xs text-gray-500", invalid && "text-red")}>{help}</div> : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
