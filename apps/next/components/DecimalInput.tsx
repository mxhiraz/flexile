import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const MAXIMUM_FRACTION_DIGITS_ALLOWED_BY_SPEC = 100;

const DecimalInput = ({
  value,
  onChange,
  onBlur,
  onFocus,
  maximumFractionDigits = MAXIMUM_FRACTION_DIGITS_ALLOWED_BY_SPEC,
  minimumFractionDigits,
  ...props
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onFocus" | "onBlur" | "inputMode">) => {
  const formatValue = (num: number | null) =>
    num?.toLocaleString(undefined, {
      maximumFractionDigits,
      minimumFractionDigits,
      useGrouping: false,
    }) ?? "";

  const [input, setInput] = useState(formatValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInput(formatValue(value));
    }
  }, [value, isFocused, formatValue]);

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  return (
    <Input
      value={input}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const newInput = e.target.value.replace(/[^\d.]/gu, "");
        const parsed = parseFloat(newInput);

        setInput(newInput);
        onChange(isNaN(parsed) ? null : parsed);
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      inputMode="decimal"
      {...props}
    />
  );
};

export default DecimalInput;
