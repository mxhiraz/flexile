import type { TabLink } from "@/components/Tabs";
import { type Company, type CurrentUser } from "@/models/user";

export const navLinks = (user: CurrentUser, _company: Company): TabLink[] => {
  const isAdmin = user.activeRole === "administrator";
  const isLawyer = user.activeRole === "lawyer";
  const isInvestor = user.activeRole === "contractorOrInvestor" && "investor" in user.roles;
  const links: (TabLink | null)[] = [
    isAdmin || isLawyer || isInvestor ? { label: "Rounds", route: "/equity/financing_rounds" } : null,
    isAdmin || isLawyer || isInvestor ? { label: "Cap table", route: "/equity/cap_table" } : null,
    isAdmin || isLawyer ? { label: "Option pools", route: "/equity/option_pools" } : null,
    isAdmin || isLawyer || (isInvestor && user.roles.investor?.hasGrants)
      ? { label: "Options", route: "/equity/grants" }
      : null,
    isInvestor && user.roles.investor?.hasShares ? { label: "Shares", route: "/equity/shares" } : null,
    isInvestor && user.roles.investor?.hasConvertibles
      ? { label: "Convertibles", route: "/equity/convertibles" }
      : null,
    isInvestor
      ? { label: "Dividends", route: "/equity/dividends" }
      : isAdmin || isLawyer
        ? { label: "Dividends", route: "/equity/dividend_rounds" }
        : null,
    isAdmin || isInvestor ? { label: "Tender offers", route: "/equity/tender_offers" } : null,
  ];
  return links.filter((link) => !!link);
};
