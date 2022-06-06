import {
	Controller,
	Get,
	UseGuards,
	Request,
	Res,
	Param,
} from "@nestjs/common";
import { FtOauthGuard } from "./guards/ft-oauth.guard";
import { FtStrategy } from "./ft.strategy";
import { Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

@Controller("login")
export class LoginController {
	constructor(
		private ftstrategy: FtStrategy,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>
	) {}
	@Get("42")
	@UseGuards(FtOauthGuard)
	ftAuth() {
		return;
	}

	@Get("42/return")
	@UseGuards(FtOauthGuard)
	async ftAuthCallback(@Request() req, @Res() response: Response) {
		const token = await this.ftstrategy.login(req.user);
		const url = new URL(`${req.protocol}:${req.hostname}`);
		const user = await this.userRepository.findOne({ ft_id: req.user.id });
		const pathname = user.dfa ? "2FA" : "Profile";
		url.port = process.env.FRONT_PORT;
		url.pathname = pathname;
		url.searchParams.set("code", token);

		response.status(302).redirect(url.href);
	}

	@Get("42/tmp/:id")
	async ft(@Request() req, @Res() response: Response, @Param("id") id) {
		const token = await this.ftstrategy.Tmplogin(id);
		const url = new URL(`${req.protocol}:${req.hostname}`);
		// url.port = process.env.FRONT_PORT;
		// url.pathname = "Profile";
		// url.searchParams.set("code", token);

		response.status(200).json({ token: token });
	}
}
