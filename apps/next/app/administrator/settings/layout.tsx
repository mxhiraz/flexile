"use client";

import MainLayout from "@/components/layouts/Main";
import Tabs, { type TabLink } from "@/components/Tabs";
import { type Route } from "next";

const SETTINGS: Route<string> = "/administrator/settings";
const BILLING: Route<string> = "/administrator/settings/billing";
const DETAILS: Route<string> = "/administrator/settings/details";
const EQUITY: Route<string> = "/administrator/settings/equity";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const links: TabLink[] = [
    { label: "Company settings", route: SETTINGS },
    { label: "Billing", route: BILLING },
    { label: "Company details", route: DETAILS },
    { label: "Equity", route: EQUITY },
  ];

  return (
    <MainLayout title="Company account">
      <Tabs links={links} />
      {children}
    </MainLayout>
  );
};

export default SettingsLayout;
