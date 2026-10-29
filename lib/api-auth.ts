import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/auth-guards";

export function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 401,
      },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 403,
      },
    );
  }

  return null;
}