import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Request,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { identity } from "rxjs";
import { Game } from "src/Pong/entities/game.entity";
import { PongService } from "src/Pong/pong.service";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService
	) {}

	@Get("me")
	getMyData(@Request() req): Promise<User> {
		const token: any = this.jwtService.decode(req.cookies.token);

		return this.userService.getUser(token.id);
	}

	@Get("/")
	getAllUsers(): Promise<User[]> {
		return this.userService.getAllUsers();
	}

	@Get("/:id")
	getUser(@Param("id", ParseIntPipe) id: number): Promise<User> {
		return this.userService.getUser(id);
	}

	@Get("/:id/addFriend/:friendId")
	addFriend(
		@Param("id", ParseIntPipe) id: number,
		@Param("friendId", ParseIntPipe) friendId: number
	): Promise<User> {
		return this.userService.addFriend(id, friendId);
	}

	@Get("/:id/removeFriend/:friendId")
	removeFriend(
		@Param("id", ParseIntPipe) id: number,
		@Param("friendId", ParseIntPipe) friendId: number
	): Promise<User> {
		return this.userService.removeFriend(id, friendId);
	}

	@Get("/:id/blockUser/:userId")
	blockUser(
		@Param("id", ParseIntPipe) id: number,
		@Param("userId", ParseIntPipe) userId: number
	): Promise<User> {
		return this.userService.blockUser(id, userId);
	}

	@Get("/:id/unblockUser/:userId")
	unblockUser(
		@Param("id", ParseIntPipe) id: number,
		@Param("userId", ParseIntPipe) userId: number
	): Promise<User> {
		return this.userService.unblockUser(id, userId);
	}

	@Get("/:id/setElo/:elo")
	setElo(
		@Param("id", ParseIntPipe) id: number,
		@Param("elo", ParseIntPipe) elo: number
	): Promise<User> {
		return this.userService.setElo(id, elo);
	}

	@Post("/:id/setUsername/:username")
	setUsername(@Param("id") id, @Param("username") username): Promise<User> {
		return this.userService.setUsername(Number(id), username);
	}

	@Post("/:id/setPicture")
	setPicture(@Param("id") id, @Body() body: any): Promise<User> {
		return this.userService.setPicture(id, body.link);
	}

	@Post("/:id/setBall")
	setBall(@Param("id") id, @Body() body: any): Promise<User> {
		return this.userService.setBall(id, body.link);
	}

	@Post("/:id/setMap")
	setMap(@Param("id") id, @Body() body: any): Promise<User> {
		return this.userService.setMap(id, body.link);
	}

	@Get("/:id/getHistory")
	async getHistory(@Param("id", ParseIntPipe) id: number) {
		const games = await Game.find({
			relations: ["winner", "looser"],
			where: [{ winner: { ft_id: id } }, { looser: { ft_id: id } }],
		});

		return games;
	}
}
