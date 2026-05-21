import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Stats Cards Skeletons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-md mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Skeleton */}
        <Card className="col-span-4 border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded-md mt-1" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-end justify-between px-6 pb-6">
            <div className="w-[12%] h-[40%] bg-slate-200 dark:bg-slate-800 rounded-t-md" />
            <div className="w-[12%] h-[75%] bg-slate-200 dark:bg-slate-800 rounded-t-md" />
            <div className="w-[12%] h-[55%] bg-slate-200 dark:bg-slate-800 rounded-t-md" />
            <div className="w-[12%] h-[90%] bg-slate-200 dark:bg-slate-800 rounded-t-md" />
          </CardContent>
        </Card>

        {/* Recent Events Skeleton */}
        <Card className="col-span-3 border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded-md mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
