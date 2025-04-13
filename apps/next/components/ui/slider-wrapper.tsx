import * as React from "react";
import { Slider } from "./slider";

export interface SliderProps {
  min?: number;
  max?: number;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  id?: string;
  ariaLabel?: string;
  invalid?: boolean;
  className?: string;
}

export function Slider({
  min = 0,
  max = 100,
  unit = "",
  value,
  onChange,
  label,
  id,
  ariaLabel,
  invalid,
  className,
}: SliderProps) {
  const handleChange = React.useCallback(
    (newValue: number[]) => {
      if (newValue.length > 0) {
        onChange(newValue[0]);
      }
    },
    [onChange]
  );

  return (
    <div className="group grid gap-2">
      {label ? (
        <label className="cursor-pointer" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="grid grid-cols-[1fr_6rem] gap-4">
        <div className="grid">
          <Slider
            id={id}
            aria-label={ariaLabel}
            min={min}
            max={max}
            value={[value]}
            onValueChange={handleChange}
            className={className}
          />
          <div className="col-span-2 flex justify-between">
            {min != null && (
              <div aria-hidden="true" className="text-xs">
                {min.toLocaleString()}
                {unit !== "%" && "\u00A0"}
                {unit}
              </div>
            )}
            {max != null && (
              <div aria-hidden="true" className="text-right text-xs">
                {max.toLocaleString()}
                {unit !== "%" && "\u00A0"}
                {unit}
              </div>
            )}
          </div>
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-hidden="true"
          className={`rounded-md border border-black p-2 shadow-sm ${invalid ? "border-red" : ""}`}
          min={min}
          max={max}
          step="1"
        />
      </div>
    </div>
  );
}
