import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { moderateVenueContentBodySchema, setUserRoleBodySchema } from "@dorham/shared";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user";
import { Roles, RolesGuard } from "../../common/roles";
import { ZodPipe } from "../../common/zod-pipe";
import { AdminService } from "./admin.service";
import { VenuesService } from "../venues/venues.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("MODERATOR", "ADMIN")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly venues: VenuesService,
  ) {}

  @Get("reports")
  reports() {
    return this.admin.listReports();
  }

  @Post("reports/:kind/:id/resolve")
  resolve(
    @CurrentUser() user: { id: string },
    @Param("kind") kind: string,
    @Param("id") id: string,
  ) {
    const k = kind === "feed" ? "feed" : "people";
    return this.admin.resolveReport(k, id, user.id).then((data) => ({ data }));
  }

  @Get("venues/pending")
  pendingVenues() {
    return this.venues.listPending();
  }

  @Get("venues/reviews/pending")
  pendingReviews() {
    return this.venues.listPendingReviews();
  }

  @Get("venues/photos/pending")
  pendingPhotos() {
    return this.venues.listPendingPhotos();
  }

  @Post("venues/reviews/:id/review")
  moderateReview(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body(new ZodPipe(moderateVenueContentBodySchema)) body: ReturnType<typeof moderateVenueContentBodySchema.parse>,
  ) {
    return this.venues.moderateReview(id, user.id, body);
  }

  @Post("venues/photos/:id/review")
  moderatePhoto(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body(new ZodPipe(moderateVenueContentBodySchema)) body: ReturnType<typeof moderateVenueContentBodySchema.parse>,
  ) {
    return this.venues.moderatePhoto(id, user.id, body);
  }

  @Post("venues/:id/publish")
  publishVenue(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.venues.publish(id, user.id);
  }

  @Post("users/:id/role")
  @Roles("ADMIN")
  setRole(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body(new ZodPipe(setUserRoleBodySchema)) body: ReturnType<typeof setUserRoleBodySchema.parse>,
  ) {
    return this.admin.setRole(user.id, id, body).then((data) => ({ data }));
  }
}
