"use client";

import { SignOutButton } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, LogOut, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from "@/global";
import defaultCompanyLogo from "@/images/default-company-logo.svg";
import { useCompanySwitcher } from "@/lib/useCompanySwitcher";
import { hasSubItems, type NavLinkInfo, useNavLinks } from "@/lib/useNavLinks";
import { cn } from "@/utils/index";

// Constants
const NAV_PRIORITIES: Record<string, number> = {
  Invoices: 1,
  People: 2,
  Documents: 3,
  Equity: 4,
  Updates: 5,
  Expenses: 6,
  Roles: 7,
  Settings: 8,
};

const DEFAULT_PRIORITY = 99;
const MAX_VISIBLE_ITEMS = 4;

// Types
interface NavItem extends NavLinkInfo {
  priority: number;
}

type SheetView = "main" | "submenu" | "companies";

interface NavigationState {
  view: SheetView;
  selectedItem?: NavItem | undefined;
}

// Reusable Components
interface NavIconProps {
  icon: React.ElementType;
  label: string;
  badge?: number;
  isActive?: boolean;
  className?: string;
}

const NavIcon: React.FC<NavIconProps> = ({ icon: Icon, label, badge, isActive, className }) => (
  <div
    className={cn(
      "flex h-full flex-col items-center justify-center p-2 pt-3",
      "text-muted-foreground transition-all duration-200",
      "hover:text-foreground",
      "group relative",
      isActive && "text-primary",
      className,
    )}
  >
    <Icon className={cn("mb-1 h-5 w-5 transition-transform duration-200")} />
    <span className="text-xs font-normal">{label}</span>
    {badge && badge > 0 ? (
      <span className="absolute top-2 right-1/2 flex h-3.5 w-3.5 translate-x-4 -translate-y-1 rounded-full border-3 border-white bg-blue-500" />
    ) : null}
  </div>
);

interface NavSheetProps {
  trigger: React.ReactNode;
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBack?: () => void;
  children: React.ReactNode;
}

// Portal overlay component
const SheetOverlay: React.FC<{ open: boolean }> = ({ open }) =>
  ReactDOM.createPortal(
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-35 bg-black/50 transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0",
      )}
      aria-hidden="true"
    />,
    document.getElementById("sidebar-wrapper") ?? document.body,
  );

const NavSheet: React.FC<NavSheetProps> = ({ trigger, title, open, onOpenChange, onBack, children }) => (
  <>
    <SheetOverlay open={!!open} />
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="bottom-14 z-50 rounded-t-2xl not-print:border-t-0">
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2">
            {onBack ? (
              <button
                onClick={onBack}
                className="hover:bg-accent -ml-2 rounded-md p-1 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            <span>{title}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  </>
);

// Navigation Sheet Items
interface SheetNavItemProps {
  item: NavItem;
  onClick?: () => void;
  showChevron?: boolean;
  pathname?: string;
}

const SheetNavItem: React.FC<SheetNavItemProps> = ({ item, onClick, showChevron, pathname }) => {
  const isActive = pathname === item.href || item.isActive;

  if (item.href && !showChevron) {
    return (
      <Link
        href={item.href}
        className={cn(
          "hover:bg-accent flex items-center px-6 py-4 transition-colors",
          "gap-3 rounded-md py-3",
          isActive && "bg-accent text-accent-foreground font-medium",
        )}
        onClick={onClick}
      >
        <item.icon className="h-5 w-5" />
        <span className="font-normal">{item.label}</span>
        {item.badge ? (
          <Badge className="ml-auto bg-blue-500 text-white">{item.badge > 10 ? "10+" : item.badge}</Badge>
        ) : null}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-6 py-3 text-left transition-colors"
    >
      <item.icon className="h-5 w-5" />
      <span className="font-normal">{item.label}</span>
      {showChevron ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
    </button>
  );
};

// Submenu Navigation
interface NavWithSubmenuProps {
  item: NavItem & { subItems: NonNullable<NavItem["subItems"]> };
}

const NavWithSubmenu: React.FC<NavWithSubmenuProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <NavSheet
      trigger={
        <button
          aria-label={`${item.label} menu`}
          aria-current={item.isActive || isOpen ? "page" : undefined}
          className="w-full"
        >
          <NavIcon {...item} isActive={item.isActive || isOpen} />
        </button>
      }
      title={item.label}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="flex flex-col gap-1">
        {item.subItems.map((subItem) => (
          <Link
            key={subItem.label}
            href={{ pathname: subItem.route }}
            onClick={() => setIsOpen(false)}
            className={cn(
              "hover:bg-accent flex items-center px-6 py-4 transition-colors",
              pathname === subItem.route && "bg-accent text-accent-foreground font-medium",
            )}
          >
            <span className="font-normal">{subItem.label}</span>
          </Link>
        ))}
      </div>
    </NavSheet>
  );
};

// Company Switcher
interface CompanySwitcherProps {
  onSelect: () => void;
}

const CompanySwitcher = ({ onSelect }: CompanySwitcherProps) => {
  const user = useCurrentUser();
  const { switchCompany } = useCompanySwitcher();

  const handleCompanySwitch = async (companyId: string) => {
    if (user.currentCompanyId !== companyId) {
      await switchCompany(companyId);
    }
    onSelect();
  };

  return user.companies.map((company) => (
    <button
      key={company.id}
      onClick={() => void handleCompanySwitch(company.id)}
      className={cn(
        "hover:bg-accent flex w-full items-center gap-3 px-6 py-3 text-left transition-colors",
        company.id === user.currentCompanyId && "bg-accent text-accent-foreground font-medium",
      )}
      aria-label={`Switch to ${company.name}`}
      aria-current={company.id === user.currentCompanyId ? "true" : undefined}
    >
      <Image src={company.logo_url || defaultCompanyLogo} width={20} height={20} className="rounded-xs" alt="" />
      <span className="line-clamp-1 flex-1 text-left font-normal">{company.name}</span>
    </button>
  ));
};

// Overflow Menu
interface OverflowMenuProps {
  items: NavItem[];
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({ items }) => {
  const user = useCurrentUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [navState, setNavState] = useState<NavigationState>({ view: "main" });

  const handleNavigation = (view: SheetView, item?: NavItem) => {
    setNavState({ view, selectedItem: item });
  };

  const handleBack = () => {
    setNavState({ view: "main" });
  };

  const handleClose = () => {
    setNavState({ view: "main" });
    setIsOpen(false);
  };

  const currentCompany = useMemo(
    () => user.companies.find((c) => c.id === user.currentCompanyId),
    [user.companies, user.currentCompanyId],
  );

  const title =
    navState.view === "companies"
      ? "Companies"
      : navState.view === "submenu"
        ? navState.selectedItem?.label || "Submenu"
        : "More";

  return (
    <NavSheet
      trigger={
        <button aria-label="More" className="w-full">
          <NavIcon icon={MoreHorizontal} label="More" isActive={isOpen} />
        </button>
      }
      title={title}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setNavState({ view: "main" });
      }}
      {...(navState.view !== "main" && { onBack: handleBack })}
    >
      <div className="relative overflow-hidden">
        {/* Main menu */}
        <div
          className={cn(
            "transition-transform duration-200 ease-in-out",
            navState.view === "main" ? "translate-x-0 opacity-100" : "absolute inset-0 -translate-x-full opacity-0",
          )}
        >
          {user.companies.length > 0 && (
            <button
              onClick={() => handleNavigation("companies")}
              className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-6 py-3 text-left transition-colors"
              aria-label="Switch company"
            >
              <Image
                src={currentCompany?.logo_url || defaultCompanyLogo}
                width={20}
                height={20}
                className="rounded-xs object-contain"
                alt="company logo"
              />
              <span className="font-normal">{currentCompany?.name || "Select Company"}</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </button>
          )}

          {items.map((item) => {
            const itemClick = item.subItems
              ? () => handleNavigation("submenu", item)
              : item.href
                ? handleClose
                : undefined;

            return (
              <SheetNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                {...(itemClick && { onClick: itemClick })}
                showChevron={!!item.subItems}
              />
            );
          })}

          <SignOutButton>
            <button
              className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-6 py-3 text-left transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-normal">Log out</span>
            </button>
          </SignOutButton>
        </div>

        {/* Submenu */}
        <div
          className={cn(
            "transition-transform duration-200 ease-in-out",
            navState.view === "submenu" ? "translate-x-0 opacity-100" : "absolute inset-0 translate-x-full opacity-0",
          )}
        >
          {navState.selectedItem?.subItems?.map((subItem) => (
            <Link
              key={subItem.label}
              href={{ pathname: subItem.route }}
              onClick={handleClose}
              className={cn(
                "hover:bg-accent flex items-center px-6 py-4 transition-colors",
                pathname === subItem.route && "bg-accent text-accent-foreground font-medium",
              )}
            >
              <span className="font-normal">{subItem.label}</span>
            </Link>
          ))}
        </div>

        {/* Companies */}
        <div
          className={cn(
            "transition-transform duration-200 ease-in-out",
            navState.view === "companies" ? "translate-x-0" : "absolute inset-0 translate-x-full",
            navState.view !== "companies" && "invisible",
          )}
        >
          <CompanySwitcher onSelect={handleClose} />
        </div>
      </div>
    </NavSheet>
  );
};

// Main Component
export function MobileBottomNav() {
  const allNavLinks = useNavLinks();

  const { mainItems, overflowItems } = useMemo(() => {
    const prioritizedItems: NavItem[] = allNavLinks.map((link) => ({
      ...link,
      priority: NAV_PRIORITIES[link.label] ?? DEFAULT_PRIORITY,
    }));

    const sorted = prioritizedItems.sort((a, b) => a.priority - b.priority);

    return {
      mainItems: sorted.slice(0, Math.min(MAX_VISIBLE_ITEMS, sorted.length)),
      overflowItems: sorted.slice(MAX_VISIBLE_ITEMS),
    };
  }, [allNavLinks]);

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="bg-background border-border fixed right-0 bottom-0 left-0 z-60 h-15 border-t"
    >
      <ul role="list" className="flex items-center justify-around">
        {mainItems.map((item) => (
          <li key={item.label} className="flex-1">
            {hasSubItems(item) ? (
              <NavWithSubmenu item={item} />
            ) : (
              <Link href={item.href}>
                <NavIcon {...item} />
              </Link>
            )}
          </li>
        ))}
        <li className="flex-1">
          <OverflowMenu items={overflowItems} />
        </li>
      </ul>
    </nav>
  );
}
