import type { TabLink } from "@/components/Tabs";
import { type Company, type CurrentUser } from "@/models/user";
import { type Route } from "next";

const ROUNDS: Route<string> = "/equity/financing_rounds";
const CAP_TABLE: Route<string> = "/equity/cap_table";
const OPTION_POOLS: Route<string> = "/equity/option_pools";
const GRANTS: Route<string> = "/equity/grants";
const SHARES: Route<string> = "/equity/shares";
const CONVERTIBLES: Route<string> = "/equity/convertibles";
const DIVIDENDS: Route<string> = "/equity/dividends";
const DIVIDEND_ROUNDS: Route<string> = "/equity/dividend_rounds";
const BUYBACKS: Route<string> = "/equity/tender_offers";

export const navLinks = (user: CurrentUser, company: Company): TabLink[] => {
  const isAdmin = user.activeRole === "administrator";
  const isLawyer = user.activeRole === "lawyer";
  const isInvestor = user.activeRole === "contractorOrInvestor" && "investor" in user.roles;

  const links: (TabLink | null)[] = [
    company.flags.includes("equity") && (isAdmin || isLawyer || isInvestor) ? { label: "Rounds", route: ROUNDS } : null,
    company.flags.includes("equity") && (isAdmin || isLawyer || isInvestor)
      ? { label: "Cap table", route: CAP_TABLE }
      : null,
    company.flags.includes("equity") && (isAdmin || isLawyer) ? { label: "Option pools", route: OPTION_POOLS } : null,
    company.flags.includes("equity") && (isAdmin || isLawyer || (isInvestor && user.roles.investor?.hasGrants))
      ? { label: "Options", route: GRANTS }
      : null,
    isInvestor && user.roles.investor?.hasShares ? { label: "Shares", route: SHARES } : null,
    isInvestor && user.roles.investor?.hasConvertibles ? { label: "Convertibles", route: CONVERTIBLES } : null,
    isInvestor
      ? { label: "Dividends", route: DIVIDENDS }
      : isAdmin || isLawyer
        ? { label: "Dividends", route: DIVIDEND_ROUNDS }
        : null,
    company.flags.includes("equity") && (isAdmin || isInvestor) ? { label: "Buybacks", route: BUYBACKS } : null,
  ];
  return links.filter((link) => !!link);
};
