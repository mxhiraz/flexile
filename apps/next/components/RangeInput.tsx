import React from "react";
import { SliderWrapper } from "@/components/ui/slider-wrapper";

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
    <SliderWrapper
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
