import React from "react";
import { SelectWrapper } from "@/components/ui/select-wrapper";

export type Option = Readonly<{ label: string; value: string }>;

export default function Select({
  id,
  className,
  label,
  ariaLabel,
  disabled = false,
  help,
  invalid = false,
  options,
  placeholder,
  value,
  onChange,
  ref,
}: {
  id?: string;
  className?: string;
  label?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  help?: string | undefined;
  invalid?: boolean | undefined;
  options: readonly Option[];
  placeholder?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  ref?: React.RefObject<HTMLSelectElement | null>;
}) {
  return (
    <SelectWrapper
      id={id}
      className={className}
      label={label}
      ariaLabel={ariaLabel}
      disabled={disabled}
      help={help}
      invalid={invalid}
      options={options}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      ref={ref as React.ForwardedRef<HTMLSelectElement>}
    />
  );
}
