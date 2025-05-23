"use client";

import { SignOutButton } from "@clerk/nextjs";
import { CheckIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/global";
import SimpleLayout from "@/app/components/simple-layout";

const logoSrc = "/images/flexile-logo.svg";

export default function OnboardingLayout({
  children,
  steps,
  stepIndex,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  steps?: string[];
  stepIndex?: number;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  const user = useCurrentUser();

  const [childProps, setChildProps] = useState({
    steps: steps || [],
    stepIndex: stepIndex || 0,
    title: title || "",
    subtitle: subtitle || "",
  });

  useEffect(() => {
    if (React.isValidElement(children)) {
      setChildProps({
        steps: steps || [],
        stepIndex: stepIndex || 0,
        title: title || "",
        subtitle: subtitle || "",
      });
    }
  }, [children, steps, stepIndex, title, subtitle]);

  return (
    <div className="flex h-screen flex-col">
      <header className="grid w-full items-center justify-center bg-black p-6 text-white md:grid-cols-[1fr_auto_1fr]">
        <Link
          href="https://flexile.com/"
          className={`hidden text-4xl invert md:block ${childProps.steps.length === 0 ? "col-start-2" : ""}`}
        >
          <Image src={logoSrc} alt="Flexile" />
        </Link>
        {childProps.steps.length > 0 && (
          <ol className="flex list-none justify-center gap-2">
            {childProps.steps.map((name, index) => (
              <li key={name} className="flex items-center gap-2">
                <Badge variant={index <= childProps.stepIndex ? "default" : "outline"}>
                  {index < childProps.stepIndex ? <CheckIcon className="h-4 w-4" /> : <span>{index + 1}</span>}
                </Badge>
                <span className="name hidden md:inline">{name}</span>
                {index < childProps.steps.length - 1 && <span className="text-xs">----</span>}
              </li>
            ))}
          </ol>
        )}
        <div className="hidden justify-self-end text-sm md:block">
          Signing up as {user.email}.{" "}
          <SignOutButton>
            <Button variant="link" className="text-white">
              Logout
            </Button>
          </SignOutButton>
        </div>
      </header>
      <SimpleLayout hideHeader title={childProps.title} subtitle={childProps.subtitle}>
        {children}
      </SimpleLayout>
    </div>
  );
}
