import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createVenueReviewBodySchema, listVenuesQuerySchema, submitVenueBodySchema } from "@dorham/shared";
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

  @Get(":id")
  get(@Param("id") id: string) {
    return this.venues.get(id);
  }
}
