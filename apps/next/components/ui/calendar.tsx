import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: cn("relative flex flex-col sm:flex-row gap-4", classNames?.months),
        month: cn("w-full", classNames?.month),
        month_caption: cn("relative mx-10 mb-1 flex h-9 items-center justify-center z-20", classNames?.month_caption),
        caption_label: cn("text-sm font-medium", classNames?.caption_label),
        nav: cn("absolute top-0 flex w-full justify-between z-10", classNames?.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 text-muted-foreground/80 hover:text-foreground p-0",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 text-muted-foreground/80 hover:text-foreground p-0",
          classNames?.button_next,
        ),
        month_grid: cn("w-full border-collapse space-x-1", classNames?.month_grid),
        weekday: cn("size-9 p-0 text-xs font-medium text-muted-foreground/80"),
        day: cn("group size-9 px-0 py-px text-sm", classNames?.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 hover:not-in-data-selected:bg-accent group-data-selected:bg-primary hover:not-in-data-selected:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:text-foreground/30 group-data-selected:group-data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-accent group-[.range-middle]:group-data-selected:text-foreground",
          classNames?.day_button,
        ),
        range_start: "range-start",
        range_end: "range-end",
        range_middle: "range-middle",
        today:
          "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
        outside: "text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground",
        hidden: "invisible",
        week_number: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
      }}
      components={{
        Chevron: ({
          orientation,
          className,
          size,
          disabled,
          ...restProps
        }: {
          orientation?: "left" | "right" | "up" | "down";
          className?: string;
          size?: number;
          disabled?: boolean;
        }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", className)} {...restProps} />;
        },
        ...userComponents,
      }}
      {...props}
    />
  );
}

export { Calendar };
