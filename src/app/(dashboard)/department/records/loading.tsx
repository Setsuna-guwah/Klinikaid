import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Queue Column (Left / 1 span) */}
        <div className="space-y-4 lg:col-span-1">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex justify-between pt-2">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* History Column (Right / 2 spans) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="p-4 flex space-x-4 border-t border-slate-100 dark:border-slate-800">
                {[1, 2, 3, 4, 5].map((col) => (
                  <div key={col} className="h-4 flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
