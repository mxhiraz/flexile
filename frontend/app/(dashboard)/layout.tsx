"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { ChevronRight, ChevronsUpDown, LogOut, MessageCircleQuestion, Settings, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { GettingStarted } from "@/components/GettingStarted";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { NavBadge } from "@/components/navigation/NavBadge";
import { SupportBadge } from "@/components/Support";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import { useCurrentCompany, useCurrentUser } from "@/global";
import defaultCompanyLogo from "@/images/default-company-logo.svg";
import { switchCompany } from "@/lib/companySwitcher";
import { hasSubItems, type NavLinkInfo, useNavLinks } from "@/lib/useNavLinks";
import { cn } from "@/utils";
import { useIsMobile } from "@/utils/use-mobile";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const isMobile = useIsMobile();
  const company = useCurrentCompany();
  const pathname = usePathname();
  const router = useRouter();
  const [showTryEquity, setShowTryEquity] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const canShowTryEquity = user.roles.administrator && !company.equityEnabled;

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" mobileSidebar={<MobileBottomNav />}>
        <SidebarHeader>
          {user.companies.length > 1 ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" className="text-base" aria-label="Switch company">
                      <CompanyName />
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
          ) : (
            <div className="flex items-center gap-2 p-2">
              <CompanyName />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          {user.currentCompanyId ? (
            <SidebarGroup>
              <SidebarGroupContent>
                <NavLinks />
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {company.checklistItems?.length > 0 ? <GettingStarted /> : null}
              {canShowTryEquity && showTryEquity ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <div
                      className="group relative flex cursor-pointer items-center justify-between"
                      onClick={() => router.push("/settings/administrator/equity")}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="size-4" />
                        <span>Try equity</span>
                      </span>
                      {hovered ? (
                        <button
                          type="button"
                          aria-label="Dismiss try equity"
                          className="hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTryEquity(false);
                          }}
                          tabIndex={0}
                        >
                          <X className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
                        </button>
                      ) : null}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              <NavItem
                route="/support"
                isActive={pathname.startsWith("/support")}
                icon={MessageCircleQuestion}
                label="Support center"
                badge={<SupportBadge />}
              />
              <SidebarMenuItem>
                <SignOutButton>
                  <SidebarMenuButton className="cursor-pointer">
                    <LogOut className="size-6" />
                    <span>Log out</span>
                  </SidebarMenuButton>
                </SignOutButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col not-print:h-screen not-print:overflow-hidden">
          <main className={cn("flex flex-1 flex-col pb-4 not-print:overflow-y-auto", isMobile && "pb-20")}>
            <div className="flex flex-col gap-4">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const NavLinks = () => {
  const pathname = usePathname();
  const navLinks = useNavLinks();

  return (
    <SidebarMenu>
      {navLinks.map((link) => {
        if (hasSubItems(link)) {
          return (
            <Collapsible
              key={link.label}
              open={link.isOpen || false}
              onOpenChange={link.onToggle || (() => undefined)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    {link.icon ? <link.icon /> : null}
                    <span>{link.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {link.subItems.map((subLink) => (
                      <SidebarMenuSubItem key={subLink.route}>
                        <SidebarMenuSubButton asChild isActive={pathname === subLink.route}>
                          <Link href={{ pathname: subLink.route }}>{subLink.label}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return link.route ? <NavItem key={link.label} {...link} /> : null;
      })}
      <NavItem route="/settings" label="Settings" icon={Settings} isActive={pathname.startsWith("/settings")} />
    </SidebarMenu>
  );
};

const NavItem = ({
  label,
  className,
  route,
  icon,
  filledIcon,
  isActive,
  badge,
}: NavLinkInfo & {
  className?: string;
  filledIcon?: React.ComponentType;
}) => {
  const Icon = isActive && filledIcon ? filledIcon : icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive ?? false} className={className}>
        <Link href={{ pathname: route }}>
          {Icon ? <Icon /> : null}
          <span>{label}</span>
          {typeof badge === "number" ? badge > 0 ? <NavBadge count={badge} /> : null : badge}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const CompanyName = () => {
  const user = useCurrentUser();
  const companyName = user.companies.find((c) => c.id === user.currentCompanyId)?.name ?? "Personal";
  
  return (
    <div className="flex items-center gap-2">
      <Image src={defaultCompanyLogo} width={24} height={24} className="rounded" alt="" />
      <span className="font-medium">{companyName}</span>
    </div>
  );
};