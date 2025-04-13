import * as React from "react";
import { Slider } from "@/components/ui/slider";

const RangeInput = ({
  min,
  max,
  unit = "",
  value,
  onChange,
  label,
  id,
  ariaLabel,
  invalid,
  className,
}: {
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
}) => {
  return (
    <Slider
      min={min}
      max={max}
      unit={unit}
      value={value}
      onChange={onChange}
      label={label}
      id={id}
      ariaLabel={ariaLabel}
      invalid={invalid}
      className={className}
    />
  );
};

export default RangeInput;
