import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface SupportTableSkeletonProps {
  rows?: number;
}

export function SupportTableSkeleton({ rows = 5 }: SupportTableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={index} className="py-2">
          <TableCell>
            <Skeleton className="h-4 w-[200px]" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[60px] rounded-sm" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-[20px] ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
