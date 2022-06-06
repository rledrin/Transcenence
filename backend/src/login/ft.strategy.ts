import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile, VerifyCallback } from "passport-42";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/user/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, "42") {
	constructor(
		private jwtService: JwtService,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>
	) {
		super({
			clientID: process.env.FORTYTWO_CLIENT_ID,
			clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
			callbackURL: "/login/42/return",
			passReqToCallback: true,
		});
	}

	async validate(
		request: { session: { accessToken: string } },
		accessToken: string,
		refreshToken: string,
		profile: Profile,
		cb: VerifyCallback
	): Promise<any> {
		request.session.accessToken = accessToken;
		// console.log("accessToken", accessToken, "refreshToken", refreshToken);
		// In this example, the user's 42 profile is supplied as the user
		// record.  In a production-quality application, the 42 profile should
		// be associated with a user record in the application's database, which
		// allows for account linking and authentication with other identity
		// providers.
		return cb(null, profile);
	}

	async login(user: Profile): Promise<string> {
		const payload: JwtPayload = {
			username: user.username,
			id: user.id,
			picture: user.photos[0].value,
			mail: user.emails[0].value,
		};

		const db_user = await this.userRepository.findOne({
			where: { ft_id: payload.id },
		});

		if (!db_user) {
			let u = this.userRepository.create();
			u.ft_id = payload.id;
			u.username = payload.username;
			u.picture = payload.picture;
			u.mail = payload.mail;
			await this.userRepository.save(u);
		}

		return this.jwtService.sign(payload);
	}

	async Tmplogin(id: any): Promise<string> {
		const db_user = await this.userRepository.findOne({
			where: { id },
		});
		const payload: JwtPayload = {
			username: db_user.username,
			id: db_user.ft_id,
			picture: db_user.picture,
			mail: db_user.mail,
		};

		return this.jwtService.sign(payload);
	}
}
