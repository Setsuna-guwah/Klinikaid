import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function RagLoading() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-96 bg-slate-200 dark:bg-slate-800 rounded mt-2 animate-pulse" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="h-10 w-full md:max-w-md bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="flex w-full md:w-auto gap-3">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 dark:border-slate-800/80 p-4">
              <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
