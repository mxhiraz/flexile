import * as React from "react"
import { cn } from "../../utils"

export interface RadioButtonsProps<T extends string | number> {
  options: { label: string; value: T; description?: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string | undefined;
  invalid?: boolean | undefined;
  disabled?: boolean | undefined;
  help?: string | undefined;
  className?: string | undefined;
}

function RadioButtons<T extends string | number>({
  options,
  value,
  onChange,
  label,
  invalid,
  disabled,
  help,
  className,
}: RadioButtonsProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    for (const input of ref.current?.querySelectorAll("input") ?? []) {
      input.setCustomValidity(invalid ? (help ?? "Please double-check your choice.") : "");
    }
  }, [invalid, help]);

  return (
    <fieldset className={cn("group", className)}>
      {label ? <legend className="mb-2">{label}</legend> : null}
      <div ref={ref} role="radiogroup" className="grid auto-cols-fr gap-2 md:grid-flow-col">
        {options.map((option) => (
          <label
            key={option.label}
            className={cn(
              "flex cursor-pointer items-center gap-2 p-3 rounded-md border border-black shadow-sm",
              "focus-within:ring-2 focus-within:ring-gray-200 focus-within:ring-offset-1",
              invalid && "border-red",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className={cn("size-5 outline-hidden", invalid && "accent-red")}
            />
            {option.description ? (
              <div>
                <div className="font-medium">{option.label}</div>
                <span className="text-gray-500">{option.description}</span>
              </div>
            ) : (
              option.label
            )}
          </label>
        ))}
      </div>
      {help ? <div className={cn("mt-2 text-xs text-gray-500", invalid && "text-red")}>{help}</div> : null}
    </fieldset>
  );
}

export { RadioButtons };
