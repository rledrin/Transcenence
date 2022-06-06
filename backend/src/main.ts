import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import * as session from "express-session";
import * as passport from "passport";
import { ConfigService } from "@nestjs/config";
// import cookieParser from "cookie-parser";

var cookieParser = require("cookie-parser");

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// app.enableCors();
	const configService: ConfigService = app.get(ConfigService);
	app.enableCors({
		origin: process.env.FRONT_URL + ":" + process.env.FRONT_PORT,
		credentials: true,
	});

	app.use(
		session({ resave: false, saveUninitialized: false, secret: "!Kiwi" })
	);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(cookieParser());

	await app.listen(3000);
}
bootstrap();
