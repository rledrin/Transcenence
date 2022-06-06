import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "src/user/entities/user.entity";
import { Channel } from "src/chat/entities/channel.entity";
import { Game } from "src/Pong/entities/game.entity";
import { MutedUser } from "src/chat/entities/mutedUser.entity";
import { BannedUser } from "src/chat/entities/bannedUser.entity";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: () => ({
				type: process.env.DATABASE_TYPE as "aurora-data-api",
				host: process.env.DATABASE_HOST,
				port: Number(process.env.DATABASE_PORT),
				username: process.env.DATABASE_USERNAME,
				password: process.env.DATABASE_PASSWORD,
				database: process.env.DATABASE_NAME,
				entities: [User, Channel, Game, MutedUser, BannedUser],
				synchronize: true, //false for production, else destroy/recreate data in the db
			}),
		}),
	],
})
export class DatabaseModule {}
