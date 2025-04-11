import React from "react";
import { RangeInput as ShadcnRangeInput } from "@/components/ui/rangeinput";

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
    <ShadcnRangeInput
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
