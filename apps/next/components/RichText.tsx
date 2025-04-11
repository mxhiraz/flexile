import React from "react";
import { RichText as ShadcnRichText, Editor as ShadcnEditor } from "@/components/ui/richtext";
import type { Content } from "@tiptap/core";

const RichText = ({ content }: { content: Content }) => {
  return <ShadcnRichText content={content} />;
};

export const Editor = ({
  label,
  value,
  invalid,
  onChange,
  className,
}: {
  label?: string;
  value: string | null;
  invalid?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) => {
  return (
    <ShadcnEditor
      label={label}
      value={value}
      invalid={invalid}
      onChange={onChange}
      className={className}
    />
  );
};

export default RichText;
