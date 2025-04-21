import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        months: cn("flex flex-col sm:flex-row gap-2", classNames?.months),
        month: cn("flex flex-col gap-4", classNames?.month),
        month_caption: cn("flex justify-center pt-1 relative items-center w-full", classNames?.month_caption),
        caption_label: cn("text-sm font-medium", classNames?.caption_label),
        nav: cn("flex items-center gap-1", classNames?.nav),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          classNames?.button_next,
        ),
        month_grid: cn("w-full border-collapse space-x-1", classNames?.month_grid),
        weekdays: cn("flex", classNames?.weekdays),
        weekday: cn("text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]", classNames?.weekday),
        week: cn("flex w-full mt-2", classNames?.week),
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
          classNames?.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
          classNames?.day_button,
        ),
        range_start: cn(
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
          classNames?.range_start,
        ),
        range_end: cn(
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
          classNames?.range_end,
        ),
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.selected,
        ),
        today: cn("bg-accent text-accent-foreground", classNames?.today),
        outside: cn("day-outside text-muted-foreground aria-selected:text-muted-foreground", classNames?.outside),
        disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
        range_middle: cn("aria-selected:bg-accent aria-selected:text-accent-foreground", classNames?.range_middle),
        hidden: cn("invisible", classNames?.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...restProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", restProps.className)} {...restProps} />;
        },
        ...userComponents,
      }}
      {...props}
    />
  );
}

export { Calendar };
