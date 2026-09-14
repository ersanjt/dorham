import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  createVenueHangPlanBodySchema,
  createVenueReviewBodySchema,
  listCityHangPlansQuerySchema,
  listVenuesQuerySchema,
  patchVenueMenuBodySchema,
  submitVenueBodySchema,
  submitVenuePhotoBodySchema,
  venueCheckInBodySchema,
} from "@dorham/shared";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user";
import { ZodPipe } from "../../common/zod-pipe";
import { VenuesService } from "./venues.service";

@ApiTags("venues")
@Controller("venues")
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get()
  list(@Query(new ZodPipe(listVenuesQuerySchema)) query: ReturnType<typeof listVenuesQuerySchema.parse>) {
    return this.venues.list(query);
  }

  @Get("hang-plans")
  cityHangPlans(
    @Query(new ZodPipe(listCityHangPlansQuerySchema)) query: ReturnType<typeof listCityHangPlansQuerySchema.parse>,
  ) {
    return this.venues.listCityHangPlans(query.city, query.limit);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  submit(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(submitVenueBodySchema)) body: ReturnType<typeof submitVenueBodySchema.parse>,
  ) {
    return this.venues.submit(user.id, body);
  }

  @Get(":id/reviews")
  reviews(@Param("id") id: string) {
    return this.venues.reviews(id);
  }

  @Post(":id/reviews")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addReview(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(createVenueReviewBodySchema)) body: ReturnType<typeof createVenueReviewBodySchema.parse>,
  ) {
    return this.venues.addReview(id, user.id, body);
  }

  @Post(":id/photos")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addPhoto(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(submitVenuePhotoBodySchema)) body: ReturnType<typeof submitVenuePhotoBodySchema.parse>,
  ) {
    return this.venues.submitPhoto(id, user.id, body);
  }

  @Get(":id/plans")
  plans(@Param("id") id: string) {
    return this.venues.listHangPlans(id);
  }

  @Post(":id/plans")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createPlan(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(createVenueHangPlanBodySchema)) body: ReturnType<typeof createVenueHangPlanBodySchema.parse>,
  ) {
    return this.venues.createHangPlan(id, user.id, body);
  }

  @Delete("plans/:planId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancelPlan(@Param("planId") planId: string, @CurrentUser() user: { id: string }) {
    return this.venues.cancelHangPlan(planId, user.id);
  }

  @Post(":id/claim")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  claim(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.venues.claimOwner(id, user.id);
  }

  @Post(":id/visits")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestVisit(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.venues.requestVisit(id, user.id);
  }

  @Post(":id/checkin")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkIn(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body(new ZodPipe(venueCheckInBodySchema)) body: ReturnType<typeof venueCheckInBodySchema.parse>,
  ) {
    return this.venues.checkInVisit(id, user, body);
  }

  @Patch(":id/menu")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  patchMenu(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body(new ZodPipe(patchVenueMenuBodySchema)) body: ReturnType<typeof patchVenueMenuBodySchema.parse>,
  ) {
    return this.venues.patchMenu(id, user, body);
  }

  @Get(":id/door")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  door(@Param("id") id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.venues.door(id, user);
  }

  @Get(":id/visits")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  visits(@Param("id") id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.venues.listVisits(id, user);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.venues.get(id);
  }
}
