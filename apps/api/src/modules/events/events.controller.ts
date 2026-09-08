import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { checkInBodySchema, createEventBodySchema, listEventsQuerySchema } from "@dorham/shared";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser, OptionalUser } from "../../common/current-user";
import { Roles, RolesGuard } from "../../common/roles";
import { ZodPipe } from "../../common/zod-pipe";
import { EventsService } from "./events.service";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query(new ZodPipe(listEventsQuerySchema)) query: ReturnType<typeof listEventsQuerySchema.parse>) {
    return this.events.list(query);
  }

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: { id: string }) {
    return this.events.mine(user.id);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param("id") id: string, @OptionalUser() user?: { id: string }) {
    return this.events.get(id, user?.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("HOST", "MODERATOR", "ADMIN")
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(createEventBodySchema)) body: ReturnType<typeof createEventBodySchema.parse>,
  ) {
    return this.events.create(user.id, body);
  }

  @Post(":id/rsvp")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  rsvp(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.events.rsvp(id, user.id);
  }

  @Delete(":id/rsvp")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancel(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.events.cancelRsvp(id, user.id);
  }

  @Get(":id/guests")
  @UseGuards(OptionalJwtAuthGuard)
  guests(@Param("id") id: string, @OptionalUser() user?: { id: string }) {
    return this.events.guests(id, user?.id);
  }

  @Get(":id/door")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  door(@Param("id") id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.events.door(id, user);
  }

  @Post(":id/checkin")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkIn(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body(new ZodPipe(checkInBodySchema)) body: ReturnType<typeof checkInBodySchema.parse>,
  ) {
    return this.events.checkIn(id, user, body);
  }
}
