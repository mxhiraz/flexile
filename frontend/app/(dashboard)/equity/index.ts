import type { TabLink } from "@/components/Tabs";
import { type Company, type CurrentUser } from "@/models/user";

export const navLinks = (user: CurrentUser, company: Company): TabLink[] => {
  const isAdmin = !!user.roles.administrator;
  const isLawyer = !!user.roles.lawyer;
  const isInvestor = !!user.roles.investor;
  const links: (TabLink | null)[] = [
    company.flags.includes("cap_table") && (isAdmin || isLawyer || isInvestor)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Investors", route: "/equity/investors" as any }
      : null,
    company.flags.includes("equity_grants") && (isAdmin || isLawyer)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Option pools", route: "/equity/option_pools" as any }
      : null,
    company.flags.includes("equity_grants") && (isAdmin || isLawyer)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Equity grants", route: "/equity/grants" as any }
      : null,
    company.flags.includes("equity_grants") && isInvestor && user.roles.investor?.hasGrants
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Options", route: "/equity/options" as any }
      : null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
    isInvestor && user.roles.investor?.hasShares ? { label: "Shares", route: "/equity/shares" as any } : null,
    isInvestor && user.roles.investor?.hasConvertibles
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Convertibles", route: "/equity/convertibles" as any }
      : null,
    isInvestor
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Dividends", route: "/equity/dividends" as any }
      : company.flags.includes("dividends") && (isAdmin || isLawyer)
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
        ? { label: "Dividends", route: "/equity/dividend_rounds" as any }
        : null,
    company.flags.includes("tender_offers") && (isAdmin || isInvestor)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TabLink requires Route type but we have string literals
      ? { label: "Buybacks", route: "/equity/tender_offers" as any }
      : null,
  ];
  return links.filter((link) => !!link);
};
