"use client";

import {
  BriefcaseIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  UserIcon,
  UsersIcon,
  ArrowPathIcon, 
  ArrowRightStartOnRectangleIcon 
} from "@heroicons/react/24/outline";
import {
  BriefcaseIcon as SolidBriefcaseIcon,
  ChartPieIcon as SolidChartPieIcon,
  Cog6ToothIcon as SolidCog6ToothIcon,
  CurrencyDollarIcon as SolidCurrencyDollarIcon,
  DocumentDuplicateIcon as SolidDocumentDuplicateIcon,
  DocumentTextIcon as SolidDocumentTextIcon,
  MegaphoneIcon as SolidMegaphoneIcon,
  UserIcon as SolidUserIcon,
  UsersIcon as SolidUsersIcon,
} from "@heroicons/react/24/solid";
import { ChevronsUpDown } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentCompany, useCurrentUser, useUserStore } from "@/global";
import { navLinks as equityNavLinks } from "@/app/equity";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import defaultCompanyLogo from "@/images/default-company-logo.svg";
import logo from "@/images/flexile-logo.svg";
import { trpc } from "@/trpc/client";
import { request } from "@/utils/request";
import { company_switch_path } from "@/utils/routes";
import { capitalize } from "lodash-es";
import { type Company } from "@/models/user";
import { useQueryClient } from "@tanstack/react-query";

type CompanyAccessRole = "administrator" | "worker" | "investor" | "lawyer";

export function AppSidebar() {
  const user = useCurrentUser();

  const [openCompanyId, setOpenCompanyId] = useState(user.currentCompanyId);
  useEffect(() => setOpenCompanyId(user.currentCompanyId), [user.currentCompanyId]);
  const openCompany = user.companies.find((company) => company.id === openCompanyId);
  const pathname = usePathname();

  const switchCompany = useSwitchCompanyOrRole();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        {user.companies.length > 1 && openCompany ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="text-base" aria-label="Switch company">
                    <CompanyName company={openCompany} />
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(radix-dropdown-menu-trigger-width)" align="start">
                  {user.companies.map((company) => (
                    <DropdownMenuItem
                      key={company.id}
                      onSelect={() => {
                        if (user.currentCompanyId !== company.id) void switchCompany(company.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Image
                        src={company.logo_url || defaultCompanyLogo}
                        width={20}
                        height={20}
                        className="rounded-xs"
                        alt=""
                      />
                      <span className="line-clamp-1">{company.name}</span>
                      {company.id === user.currentCompanyId && (
                        <div className="ml-auto size-2 rounded-full bg-blue-500"></div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : openCompany ? (
          <div className="flex items-center gap-2 p-2">
            <CompanyName company={openCompany} />
          </div>
        ) : (
          <Image src={logo} className="invert" alt="Flexile" />
        )}
      </SidebarHeader>
      <SidebarContent>
        {openCompany ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinks company={openCompany} />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {!user.companies.length && (
                <NavLink
                  href="/company_invitations"
                  icon={BriefcaseIcon}
                  filledIcon={SolidBriefcaseIcon}
                  active={pathname.startsWith("/company_invitations")}
                >
                  Invite companies
                </NavLink>
              )}
              <NavLink
                href="/settings"
                icon={UserIcon}
                filledIcon={SolidUserIcon}
                active={pathname.startsWith("/settings")}
              >
                Account
              </NavLink>
              <SidebarMenuItem>
                <SignOutButton>
                  <SidebarMenuButton className="cursor-pointer">
                    <ArrowRightStartOnRectangleIcon className="size-6" />
                    <span>Log out</span>
                  </SidebarMenuButton>
                </SignOutButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const CompanyName = ({ company }: { company: Company }) => (
  <>
    <div className="relative size-8">
      <Image src={company.logo_url || defaultCompanyLogo} fill className="rounded-xs" alt="" />
    </div>
    <div>
      <span className="line-clamp-1 font-bold" title={company.name ?? ""}>
        {company.name}
      </span>
      {company.selected_access_role && company.other_access_roles.length > 0 ? (
        <div className="text-xs">{capitalize(company.selected_access_role)}</div>
      ) : null}
    </div>
  </>
);

const useSwitchCompanyOrRole = () => {
  const queryClient = useQueryClient();
  return async (companyId: string, accessRole?: CompanyAccessRole) => {
    useUserStore.setState((state) => ({ ...state, pending: true }));
    await request({
      method: "POST",
      url: company_switch_path(companyId, { access_role: accessRole }),
      accept: "json",
    });
    await queryClient.resetQueries({ queryKey: ["currentUser"] });
    useUserStore.setState((state) => ({ ...state, pending: false }));
  };
};

const NavLinks = ({ company }: { company: Company }) => {
  const user = useCurrentUser();
  const pathname = usePathname();
  const active = user.currentCompanyId === company.id;
  const routes = new Set(
    company.routes.flatMap((route) => [route.label, ...(route.subLinks?.map((subLink) => subLink.label) || [])]),
  );
  const updatesPath = company.routes.find((route) => route.label === "Updates")?.name;
  const isRole = (...roles: (typeof user.activeRole)[]) => roles.includes(user.activeRole);
  const equityNavLink = equityNavLinks(user, company)[0];

  return (
    <SidebarMenu>
      {updatesPath ? (
        <NavLink
          href="/updates/company"
          icon={MegaphoneIcon}
          filledIcon={SolidMegaphoneIcon}
          active={!!active && pathname.startsWith("/updates")}
        >
          Updates
        </NavLink>
      ) : null}
      {routes.has("Invoices") && (
        <InvoicesNavLink
          companyId={company.id}
          active={!!active && pathname.startsWith("/invoices")}
          isAdmin={isRole("administrator")}
        />
      )}
      {routes.has("Expenses") && (
        <NavLink
          href={`/companies/${company.id}/expenses`}
          icon={CurrencyDollarIcon}
          filledIcon={SolidCurrencyDollarIcon}
          active={!!active && pathname.startsWith(`/companies/${company.id}/expenses`)}
        >
          Expenses
        </NavLink>
      )}
      {routes.has("Documents") && (
        <NavLink
          href="/documents"
          icon={DocumentDuplicateIcon}
          filledIcon={SolidDocumentDuplicateIcon}
          active={!!active && (pathname.startsWith("/documents") || pathname.startsWith("/document_templates"))}
        >
          Documents
        </NavLink>
      )}
      {routes.has("People") && (
        <NavLink
          href="/people"
          icon={UsersIcon}
          filledIcon={SolidUsersIcon}
          active={!!active && (pathname.startsWith("/people") || pathname.includes("/investor_entities/"))}
        >
          People
        </NavLink>
      )}
      {routes.has("Roles") && (
        <NavLink
          href="/roles"
          icon={BriefcaseIcon}
          filledIcon={SolidBriefcaseIcon}
          active={!!active && pathname.startsWith("/roles")}
        >
          Roles
        </NavLink>
      )}
      {routes.has("Equity") && equityNavLink ? (
        <NavLink
          href={equityNavLink.route}
          icon={ChartPieIcon}
          filledIcon={SolidChartPieIcon}
          active={!!active && (pathname.startsWith("/equity") || pathname.includes("/equity_grants"))}
        >
          Equity
        </NavLink>
      ) : null}
      {routes.has("Settings") && (
        <NavLink
          href={isRole("administrator") ? `/administrator/settings` : `/settings/equity`}
          active={!!active && pathname.startsWith("/settings")}
          icon={Cog6ToothIcon}
          filledIcon={SolidCog6ToothIcon}
        >
          Settings
        </NavLink>
      )}
      {company.other_access_roles.map((accessRole) => (
        <SwitchRoleNavLink key={accessRole} accessRole={accessRole} companyId={company.id} />
      ))}
    </SidebarMenu>
  );
};

const NavLink = ({
  icon,
  filledIcon,
  children,
  className,
  href,
  active,
  badge,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  active?: boolean;
  icon: React.ComponentType;
  filledIcon?: React.ComponentType;
  badge?: number | undefined;
}) => {
  const Icon = active && filledIcon ? filledIcon : icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active ?? false} className={className}>
        <Link href={href}>
          <Icon />
          <span>{children}</span>
          {badge && badge > 0 ? (
            <Badge role="status" className="ml-auto h-4 w-auto min-w-4 bg-blue-500 px-1 text-xs text-white">
              {badge > 10 ? "10+" : badge}
            </Badge>
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

function InvoicesNavLink({ companyId, active, isAdmin }: { companyId: string; active: boolean; isAdmin: boolean }) {
  const { data, isLoading } = trpc.invoices.list.useQuery(
    {
      companyId,
      invoiceFilter: "actionable",
    },
    {
      refetchInterval: 30_000,
      enabled: isAdmin,
    },
  );

  return (
    <NavLink
      href="/invoices"
      icon={DocumentTextIcon}
      filledIcon={SolidDocumentTextIcon}
      active={active}
      badge={isAdmin && !isLoading ? data?.length : undefined}
    >
      Invoices
    </NavLink>
  );
}

function SwitchRoleNavLink({ accessRole, companyId }: { accessRole: CompanyAccessRole; companyId: string }) {
  const switchCompany = useSwitchCompanyOrRole();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => void switchCompany(companyId, accessRole)}>
        <ArrowPathIcon />
        <span>Use as {accessRole === "administrator" ? "admin" : accessRole}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
