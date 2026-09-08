import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import multipart from "@fastify/multipart";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { attachRequestId } from "./common/request-id";
import { loadEnv } from "./config/env";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, logger: env.NODE_ENV !== "test" }),
  );

  await app.register(multipart as never, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });
  app.setGlobalPrefix("v1");
  app.useGlobalFilters(new HttpExceptionFilter());
  const allowlist = env.CORS_ORIGINS.split(",").map((s) => s.trim());
  app.enableCors({
    origin: env.NODE_ENV === "production" ? allowlist : true,
    credentials: true,
  });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onRequest", (req, reply, done) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("permissions-policy", "geolocation=(), camera=(), microphone=()");
    attachRequestId(req, reply, done);
  });

  fastify.get("/", async (_req, reply) => {
    reply.send({
      data: {
        service: "dorham-api",
        health: "/v1/health",
        web: env.APP_URL,
      },
    });
  });

  if (env.NODE_ENV !== "production") {
    const docs = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Dorham API")
        .setDescription("Community first. Events first. Versioned public API.")
        .setVersion("1.0.0")
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup("v1/docs", app, docs);
  }

  await app.listen(env.API_PORT, "0.0.0.0");
}

bootstrap();
