import * as React from "react"
import { cn } from "../../utils"

export interface ColorPickerProps {
  label?: string | undefined;
  value: string | null;
  onChange: (value: string) => void;
  className?: string | undefined;
  help?: React.ReactNode | undefined;
  invalid?: boolean | undefined;
  id?: string | undefined;
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, label, value, onChange, help, invalid, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="group grid gap-2">
        {label ? (
          <label className="cursor-pointer" htmlFor={id}>
            {label}
          </label>
        ) : null}
        <div className={cn(
          "relative size-12 overflow-hidden rounded-full border border-black shadow-sm",
          invalid && "border-red",
          className
        )}>
          <input
            id={id}
            type="color"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-1/2 size-auto cursor-pointer"
            ref={ref}
            {...props}
          />
        </div>
        {help ? <div className={cn("text-xs text-gray-500", invalid && "text-red")}>{help}</div> : null}
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
