import { Module } from "@nestjs/common";
import { LoginModule } from "./login/login.module";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { DatabaseModule } from "./database/database.module";
import { ChatModule } from "./chat/chat.module";
import { AppGateway } from "./app.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Channel } from "./chat/entities/channel.entity";
import { User } from "./user/entities/user.entity";
import { RoomService } from "./Pong/room.service";
import { PongService } from "./Pong/pong.service";
import { ChannelService } from "./chat/channel.service";
import { DoubleAuthService } from "./2FA/doubleAuth.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Channel, User]),
		ConfigModule.forRoot({
			envFilePath: ".env",
		}),
		LoginModule,
		UserModule,
		DatabaseModule,
		ChatModule,
	],
	controllers: [],
	providers: [
		AppGateway,
		RoomService,
		PongService,
		ChannelService,
		DoubleAuthService,
	],
})
export class AppModule {}
