import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  createCommentBodySchema,
  createPostBodySchema,
  feedReportBodySchema,
  listFeedQuerySchema,
} from "@dorham/shared";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser, OptionalUser } from "../../common/current-user";
import { ZodPipe } from "../../common/zod-pipe";
import { FeedService } from "./feed.service";

@ApiTags("feed")
@Controller("feed")
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query(new ZodPipe(listFeedQuerySchema)) query: ReturnType<typeof listFeedQuerySchema.parse>,
    @OptionalUser() user?: { id: string },
  ) {
    return this.feed.list(query, user?.id);
  }

  @Get(":id/comments")
  @UseGuards(OptionalJwtAuthGuard)
  comments(@Param("id") id: string, @OptionalUser() user?: { id: string }) {
    return this.feed.comments(id, user?.id);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param("id") id: string, @OptionalUser() user?: { id: string }) {
    return this.feed.get(id, user?.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(createPostBodySchema)) body: ReturnType<typeof createPostBodySchema.parse>,
  ) {
    return this.feed.create(user.id, body);
  }

  @Post(":id/comments")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  comment(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(createCommentBodySchema)) body: ReturnType<typeof createCommentBodySchema.parse>,
  ) {
    return this.feed.comment(id, user.id, body);
  }

  @Post(":id/report")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async report(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(feedReportBodySchema)) body: ReturnType<typeof feedReportBodySchema.parse>,
  ) {
    return { data: await this.feed.report(id, user.id, body) };
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: "MEMBER" | "HOST" | "MODERATOR" | "ADMIN" },
  ) {
    return { data: await this.feed.remove(id, user) };
  }
}
