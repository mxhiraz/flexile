import React, { useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { cn } from "../utils";

export type ShadcnInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "onChange" | "value"
> & {
  label?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  help?: React.ReactNode;
  invalid?: boolean | undefined;
  ref?: React.RefObject<HTMLInputElement | null>;
  onChange?: (text: string) => void;
  value?: string | null;
};

const ShadcnInput = ({
  id,
  className,
  label,
  prefix,
  suffix,
  help,
  invalid,
  value,
  onChange,
  ref,
  ...props
}: ShadcnInputProps) => {
  const inputId = id ?? React.useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      invalid
        ? typeof help === "string"
          ? help
          : value
            ? "This doesn't look correct."
            : "This field is required."
        : "",
    );
  }, [invalid, help, value]);

  return (
    <div className="group grid gap-2">
      {label || props.children ? (
        <label htmlFor={inputId} className="cursor-pointer">
          {label || props.children}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-md border bg-white",
          "focus-within:border-gray-200 focus-within:shadow-sm",
          invalid && "border-red",
          props.disabled && "bg-gray-100 opacity-50",
          className
        )}
      >
        {prefix ? <div className="ml-2 flex items-center text-gray-600">{prefix}</div> : null}
        <Input
          id={inputId}
          ref={(e: HTMLInputElement) => {
            inputRef.current = e;
            if (ref) ref.current = e;
          }}
          type={props.type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-full w-0 flex-1 border-0 bg-transparent p-2 focus:outline-hidden focus:ring-0 focus:shadow-none"
          {...props}
        />
        {suffix ? <div className="mr-2 flex items-center text-gray-600">{suffix}</div> : null}
      </div>
      {help ? <div className={cn("text-xs text-gray-500", invalid && "text-red")}>{help}</div> : null}
    </div>
  );
};

export default ShadcnInput;
