import { BadRequestException, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { uploadMediaQuerySchema } from "@dorham/shared";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser, OptionalUser, type AuthUser } from "../../common/current-user";
import { ZodPipe } from "../../common/zod-pipe";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { MediaService } from "./media.service";

type MultipartRequest = {
  file: () => Promise<{ mimetype: string; file: NodeJS.ReadableStream } | undefined>;
};

type BinaryReply = {
  header: (name: string, value: string) => BinaryReply;
  send: (payload: Buffer) => void;
};

@ApiTags("media")
@Controller("media")
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseGuards(JwtAuthGuard)
  async upload(
    @CurrentUser() user: { id: string },
    @Query(new ZodPipe(uploadMediaQuerySchema)) query: ReturnType<typeof uploadMediaQuerySchema.parse>,
    @Req() req: MultipartRequest,
  ) {
    const account = await this.prisma.user.findUnique({ where: { id: user.id }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const file = await req.file();
    if (!file) {
      throw new BadRequestException({
        code: "MEDIA_INVALID",
        message: "Attach a photo as multipart field `file`.",
      });
    }
    const data = await this.media.createFromUpload({
      userId: user.id,
      kind: query.kind,
      mime: file.mimetype,
      stream: file.file,
    });
    return { data };
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async get(
    @Param("id") id: string,
    @Query("exp") exp: string | undefined,
    @Query("sig") sig: string | undefined,
    @OptionalUser() viewer: AuthUser | undefined,
    @Res() reply: BinaryReply,
  ) {
    const file = await this.media.openSigned(id, exp, sig, viewer);
    reply
      .header("content-type", file.mime)
      .header("cache-control", "private, max-age=60")
      .header("x-content-type-options", "nosniff")
      .send(file.data);
  }
}
