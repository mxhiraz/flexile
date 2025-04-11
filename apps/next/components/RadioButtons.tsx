import React from "react";
import { RadioButtons as ShadcnRadioButtons } from "@/components/ui/radiobuttons";

function RadioButtons<T extends string | number>({
  options,
  value,
  onChange,
  label,
  invalid,
  disabled,
  help,
  className,
}: {
  options: { label: string; value: T; description?: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  invalid?: boolean;
  disabled?: boolean;
  help?: string | undefined;
  className?: string;
}) {
  return (
    <ShadcnRadioButtons
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      invalid={invalid}
      disabled={disabled}
      help={help}
      className={className}
    />
  );
}

export default RadioButtons;
