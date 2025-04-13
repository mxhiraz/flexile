import * as React from "react";
import { ColorPicker as ShadcnColorPicker } from "@/components/ui/colorpicker";

interface ColorPickerProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <ShadcnColorPicker
      label={label}
      value={value}
      onChange={onChange}
    />
  );
}
