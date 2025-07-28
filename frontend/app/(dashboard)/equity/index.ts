import type { TabLink } from "@/components/Tabs";
import { type Company, type CurrentUser } from "@/models/user";
import type { Route } from "next";

export const navLinks = (user: CurrentUser, company: Company): TabLink[] => {
  const isAdmin = !!user.roles.administrator;
  const isLawyer = !!user.roles.lawyer;
  const isInvestor = !!user.roles.investor;
  const links: (TabLink | null)[] = [
    company.flags.includes("cap_table") && (isAdmin || isLawyer || isInvestor)
      ? { label: "Investors", route: "/equity/investors" as Route }
      : null,
    company.flags.includes("equity_grants") && (isAdmin || isLawyer)
      ? { label: "Option pools", route: "/equity/option_pools" as Route }
      : null,
    company.flags.includes("equity_grants") && (isAdmin || isLawyer)
      ? { label: "Equity grants", route: "/equity/grants" as Route }
      : null,
    company.flags.includes("equity_grants") && isInvestor && user.roles.investor?.hasGrants
      ? { label: "Options", route: "/equity/options" as Route }
      : null,
    isInvestor && user.roles.investor?.hasShares ? { label: "Shares", route: "/equity/shares" as Route } : null,
    isInvestor && user.roles.investor?.hasConvertibles
      ? { label: "Convertibles", route: "/equity/convertibles" as Route }
      : null,
    isInvestor
      ? { label: "Dividends", route: "/equity/dividends" as Route }
      : company.flags.includes("dividends") && (isAdmin || isLawyer)
        ? { label: "Dividends", route: "/equity/dividend_rounds" as Route }
        : null,
    company.flags.includes("tender_offers") && (isAdmin || isInvestor)
      ? { label: "Buybacks", route: "/equity/tender_offers" as Route }
      : null,
  ];
  return links.filter((link) => !!link);
};
