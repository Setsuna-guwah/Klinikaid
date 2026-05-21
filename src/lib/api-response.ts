import { NextResponse } from "next/server";

/**
 * Standard Success API Response Helper.
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message: message || "Operation completed successfully",
      data,
    },
    { status }
  );
}

/**
 * Standard Error API Response Helper.
 * Sanitizes errors and returns generic message structures to clients (Rule 7).
 */
export function errorResponse(message: string, status = 400, details?: unknown) {
  // If in production, prevent leaking deep database/runtime logs (Rule 7)
  const isDev = process.env.NODE_ENV === "development";
  
  if (details) {
    console.error(`API Error Response [${status}]: ${message}`, details);
  } else {
    console.error(`API Error Response [${status}]: ${message}`);
  }

  return NextResponse.json(
    {
      success: false,
      message,
      ...(isDev && details ? { debug_details: details } : {}),
    },
    { status }
  );
}
