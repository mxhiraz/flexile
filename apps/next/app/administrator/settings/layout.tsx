"use client";

import MainLayout from "@/components/layouts/Main";
import Tabs, { type TabLink } from "@/components/Tabs";
import { type Route } from "next";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const links: TabLink[] = [
    { label: "Company settings", route: "/administrator/settings" as Route<string> },
    { label: "Billing", route: "/administrator/settings/billing" as Route<string> },
    { label: "Company details", route: "/administrator/settings/details" as Route<string> },
    { label: "Equity", route: "/administrator/settings/equity" as Route<string> },
  ];

  return (
    <MainLayout title="Company account">
      <Tabs links={links} />
      {children}
    </MainLayout>
  );
};

export default SettingsLayout;
