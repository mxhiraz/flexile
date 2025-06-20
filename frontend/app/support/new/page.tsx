"use client";

import React from "react";
import MainLayout from "@/components/layouts/Main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewSupportTicketPage() {
  return (
    <MainLayout title="New support ticket">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Create new support ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              This feature will be implemented to create new support tickets via API.
            </p>
            <Button asChild variant="outline">
              <Link href="/support">Back to support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
