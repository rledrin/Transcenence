import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Channel } from "src/chat/entities/channel.entity";
import { jwtConstants } from "src/login/constant";
import { User } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
	imports: [
		JwtModule.register({
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "1d" },
		}),
		TypeOrmModule.forFeature([User, Channel]),
	],
	controllers: [UserController],
	providers: [UserService],
})
export class UserModule {}
