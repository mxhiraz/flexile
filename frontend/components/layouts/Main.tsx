import { SignOutButton } from "@clerk/nextjs";
import { ChevronsUpDown, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/global";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { navLinks as equityNavLinks } from "@/app/equity";
import { GettingStarted } from "@/components/GettingStarted";
import { storageKeys } from "@/models/constants";

export default function MainLayout({
  children,
  title,
  subtitle,
  headerActions,
  subheader,
  footer,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  subheader?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const user = useCurrentUser();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      {isMobile ? (
        <MobileBottomNav />
      ) : (
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            {user.companies.length > 1 ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton size="lg" className="text-base" aria-label="Switch company">
                        <CompanySwitcherHeader />
                        <ChevronsUpDown className="ml-auto" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(radix-dropdown-menu-trigger-width)" align="start">
                      <CompanySwitcherList className="p-1" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {user.currentCompanyId && (user.roles.administrator || user.roles.worker) ? (
          <SidebarGroup className="mt-auto px-0 py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <GettingStarted />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col not-print:h-screen not-print:overflow-hidden">
          <main className={`flex flex-1 flex-col pb-4 not-print:overflow-y-auto ${isMobile ? "pb-20" : ""}`}>
            <div>
              <header className="px-3 py-2 md:px-4 md:py-4">
                <div className="grid gap-y-8">
                  <div className="grid items-center justify-between gap-3 md:flex">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        {!isMobile && <SidebarTrigger className="md:hidden" />}
                        <h1 className="text-sm font-bold">{title}</h1>
                      </div>
                      {subtitle}
                    </div>
                    {headerActions ? <div className="flex items-center gap-3 print:hidden">{headerActions}</div> : null}
                  </div>
                </div>
              </header>
              {subheader ? <div className="bg-gray-200/50">{subheader}</div> : null}
            </div>
            <div className="mx-3 flex flex-col gap-6">{children}</div>
          </main>
          {footer ? <div className="mt-auto">{footer}</div> : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const CompanyName = () => {
  const company = useCurrentCompany();
  return (
    <>
      {company.name ? (
        <Link href="/settings" className="relative size-6">
          <Image src={company.logo_url || defaultCompanyLogo} fill className="rounded-sm" alt="" />
        </Link>
      ) : null}
      <div>
        <span className="line-clamp-1 text-sm font-bold" title={company.name ?? ""}>
          {company.name}
        </span>
      </div>
    </>
  );
};

const NavLinks = () => {
  const pathname = usePathname();
  const routes = new Set(
    company.routes.flatMap((route) => [route.label, ...(route.subLinks?.map((subLink) => subLink.label) || [])]),
  );
  const { data: invoicesData } = trpc.invoices.list.useQuery(
    user.currentCompanyId && user.roles.administrator
      ? { companyId: user.currentCompanyId, status: ["received", "approved", "failed"] }
      : skipToken,
    { refetchInterval: 30_000 },
  );
  const isInvoiceActionable = useIsActionable();
  const { data: documentsData } = trpc.documents.list.useQuery(
    user.currentCompanyId && user.id
      ? { companyId: user.currentCompanyId, userId: user.id, signable: true }
      : skipToken,
    { refetchInterval: 30_000 },
  );
  const updatesPath = company.routes.find((route) => route.label === "Updates")?.name;
  const equityLinks = equityNavLinks(user, company);

  const [isOpen, setIsOpen] = React.useState(() => localStorage.getItem(storageKeys.EQUITY_MENU_STATE) === "open");

  return (
    <SidebarMenu>
      {updatesPath ? (
        <NavLink href="/updates/company" icon={Rss} filledIcon={Rss} active={pathname.startsWith("/updates")}>
          Updates
        </NavLink>
      ) : null}
      {routes.has("Invoices") && (
        <NavLink
          href="/invoices"
          icon={ReceiptIcon}
          active={pathname.startsWith("/invoices")}
          badge={invoicesData?.filter(isInvoiceActionable).length}
        >
          Invoices
        </NavLink>
      )}
      {routes.has("Expenses") && (
        <NavLink
          href={`/companies/${company.id}/expenses`}
          icon={CircleDollarSign}
          active={pathname.startsWith(`/companies/${company.id}/expenses`)}
        >
          Expenses
        </NavLink>
      )}
      {routes.has("Documents") && (
        <NavLink
          href="/documents"
          icon={Files}
          active={pathname.startsWith("/documents") || pathname.startsWith("/document_templates")}
          badge={documentsData?.length}
        >
          Documents
        </NavLink>
      )}
      {routes.has("People") && (
        <NavLink
          href="/people"
          icon={Users}
          active={pathname.startsWith("/people") || pathname.includes("/investor_entities/")}
        >
          People
        </NavLink>
      )}
      {routes.has("Roles") && (
        <NavLink href="/roles" icon={BookUser} active={pathname.startsWith("/roles")}>
          Roles
        </NavLink>
      )}
      {routes.has("Equity") && equityLinks.length > 0 && (
        <Collapsible
          open={isOpen}
          onOpenChange={(state) => {
            setIsOpen(state);
            localStorage.setItem(storageKeys.EQUITY_MENU_STATE, state ? "open" : "closed");
          }}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton closeOnMobileClick={false}>
                <ChartPie />
                <span>Equity</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {equityLinks.map((link) => (
                  <SidebarMenuSubItem key={link.route}>
                    <SidebarMenuSubButton asChild isActive={pathname === link.route}>
                      <Link href={link.route}>{link.label}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )}
      <NavLink href="/settings" active={pathname.startsWith("/settings")} icon={Settings}>
        Settings
      </NavLink>
    </SidebarMenu>
  );
};

interface CollapsibleNavLinkProps {
  link: NavLinkInfo & { subItems: NonNullable<NavLinkInfo["subItems"]> };
  pathname: string;
}

const CollapsibleNavLink = ({ link, pathname }: CollapsibleNavLinkProps) => {
  const Icon = link.icon;
  const storageKey = `${link.label.toLowerCase().replace(/\s+/gu, "-")}-menu-state`;

  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "open";
  });

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(state) => {
        setIsOpen(state);
        localStorage.setItem(storageKey, state ? "open" : "closed");
      }}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <Icon />
            <span>{link.label}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {link.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.route}>
                <SidebarMenuSubButton asChild isActive={pathname === subItem.route}>
                  <Link href={{ pathname: subItem.route }}>{subItem.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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
  href: string | { pathname: string };
  active?: boolean;
  icon: React.ComponentType;
  filledIcon?: React.ComponentType;
  badge?: number | undefined;
}) => {
  const Icon = active && filledIcon ? filledIcon : icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active ?? false} className={className}>
        <Link href={typeof href === "string" ? { pathname: href } : href}>
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
