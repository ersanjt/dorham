import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";

export function assertNotDeleted(status: UserStatus) {
  if (status === "DELETED") {
    throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "Sign in required." });
  }
}

export function assertNotSuspended(status: UserStatus) {
  if (status === "SUSPENDED") {
    throw new ForbiddenException({
      code: "AUTH_ACCOUNT_SUSPENDED",
      message: "This account is suspended.",
    });
  }
}

export function assertActive(status: UserStatus) {
  assertNotDeleted(status);
  assertNotSuspended(status);
  if (status === "PAUSED") {
    throw new ForbiddenException({
      code: "AUTH_ACCOUNT_PAUSED",
      message: "This account is paused.",
    });
  }
}
