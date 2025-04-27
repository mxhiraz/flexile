import type { TabLink } from "@/components/Tabs";
import { type Company, type CurrentUser } from "@/models/user";
import { type Route } from "next";

export const navLinks = (user: CurrentUser, company: Company): TabLink[] => {
  const isAdmin = user.activeRole === "administrator";
  const isLawyer = user.activeRole === "lawyer";
  const isInvestor = user.activeRole === "contractorOrInvestor" && "investor" in user.roles;
  const links: (TabLink | null)[] = [
    company.flags.includes("equity") && (isAdmin || isLawyer || isInvestor)
      ? { label: "Rounds", route: "/equity/financing_rounds" as Route<string> }
      : null,
    company.flags.includes("equity") && (isAdmin || isLawyer || isInvestor)
      ? { label: "Cap table", route: "/equity/cap_table" as Route<string> }
      : null,
    company.flags.includes("equity") && (isAdmin || isLawyer)
      ? { label: "Option pools", route: "/equity/option_pools" as Route<string> }
      : null,
    company.flags.includes("equity") && (isAdmin || isLawyer || (isInvestor && user.roles.investor?.hasGrants))
      ? { label: "Options", route: "/equity/grants" as Route<string> }
      : null,
    isInvestor && user.roles.investor?.hasShares ? { label: "Shares", route: "/equity/shares" as Route<string> } : null,
    isInvestor && user.roles.investor?.hasConvertibles
      ? { label: "Convertibles", route: "/equity/convertibles" as Route<string> }
      : null,
    isInvestor
      ? { label: "Dividends", route: "/equity/dividends" as Route<string> }
      : isAdmin || isLawyer
        ? { label: "Dividends", route: "/equity/dividend_rounds" as Route<string> }
        : null,
    company.flags.includes("equity") && (isAdmin || isInvestor)
      ? { label: "Buybacks", route: "/equity/tender_offers" as Route<string> }
      : null,
  ];
  return links.filter((link) => !!link);
};
