import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { Game } from "./entities/game.entity";
import { Room, State, Vec2 } from "./interfaces/room.interface";
import { RoomService } from "./room.service";

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PongService {
	constructor(
		@Inject(forwardRef(() => RoomService)) private roomService: RoomService
	) {}

	velocity = (speed: number, radian: number): Vec2 => {
		return { x: Math.cos(radian) * speed, y: Math.sin(radian) * speed };
	};

	updateBall(x: number, y: number, radian: number, room: Room): void {
		room.ball.position.x = x;
		room.ball.position.y = y;
		room.ball.velocity = this.velocity((room.ball.speed *= 1.05), radian);
		this.roomService.emit(room, "ball", room.ball.position);
	}

	resetBall(room: Room, left?: boolean): void {
		let radian = 0;
		// let radian = Math.PI / 2 - Math.PI / 4;
		if (left) radian += Math.PI;
		room.ball.speed = room.normal_ball_speed;
		this.updateBall(50, 50, radian, room);
	}

	async update(room: Room): Promise<any> {
		this.roomService.emit(room, "player", {
			p1: room.players[0].position.y,
			p2: room.players[1].position.y,
		});
		if (room.state !== State.INGAME) return;
		const next = {
			x: room.ball.position.x + room.ball.velocity.x,
			y: room.ball.position.y + room.ball.velocity.y,
		};
		// sides + score
		if (next.x - room.ball.radius < -1 || next.x + room.ball.radius > 101) {
			if (next.x > room.ball.radius) {
				++room.players[0].score;
			} else {
				++room.players[1].score;
			}

			this.roomService.emit(room, "score", {
				p1: room.players[0].score,
				p2: room.players[1].score,
			});

			for (const player of room.players) {
				if (player.score === room.maxScore) {
					return this.roomService.stopGame(room, player);
				}
			}

			this.resetBall(room, next.x + room.ball.radius > 100);
			room.state = State.GOAL;
			await sleep(1500);
			room.state = State.INGAME;
		}
		// player 1
		if (
			next.y >= room.players[0].position.y - room.players[0].heightFromCenter &&
			next.y <= room.players[0].position.y + room.players[0].heightFromCenter
		) {
			if (next.x - room.ball.radius < 1.5) {
				if (next.y > room.players[0].position.y) {
					const l = next.y - room.players[0].position.y;
					const perc = l / room.players[0].heightFromCenter;
					room.ball.velocity.y = perc;
				} else {
					const l = room.players[0].position.y - next.y;
					const perc = l / room.players[0].heightFromCenter;
					room.ball.velocity.y = perc * -1;
				}
				room.ball.velocity.x *= -1;
				if (room.ball.speed < 2) room.ball.speed += 0.2;
			}
		}
		//player 2
		if (
			next.y >= room.players[1].position.y - room.players[1].heightFromCenter &&
			next.y <= room.players[1].position.y + room.players[1].heightFromCenter
		) {
			if (next.x + room.ball.radius > 98.5) {
				if (next.y > room.players[1].position.y) {
					const l = next.y - room.players[1].position.y;
					const perc = l / room.players[1].heightFromCenter;
					room.ball.velocity.y = perc;
				} else {
					const l = room.players[1].position.y - next.y;
					const perc = l / room.players[1].heightFromCenter;
					room.ball.velocity.y = perc * -1;
				}
				room.ball.velocity.x *= -1;
				if (room.ball.speed < 2) room.ball.speed += 0.2;
			}
		}
		//floor & top
		if (next.y - room.ball.radius < 0 || next.y + room.ball.radius > 100) {
			room.ball.velocity.y *= -1;
		}
		//normal behavior
		room.ball.position.x += room.ball.velocity.x * room.ball.speed;
		room.ball.position.y += room.ball.velocity.y * room.ball.speed;
		this.roomService.emit(room, "ball", room.ball.position);
	}

	async getGames() {
		const games = await Game.find({
			relations: ["winner", "looser"],
		});

		return games;
	}

	// async getGamesByFtId(ft_id: number) {
	// 	const games = await User.find({ ft_id: ft_id });
	// 	console.log(games);
	// 	return games;
	// }

	async getGameById(id: string) {
		const game = await Game.findOne({ id });

		return game;
	}

	async createGame(
		winner_ft_id: number,
		winner_score: number,
		looser_ft_id: number,
		loser_score: number
	) {
		const winner_data = await User.findOne({ ft_id: winner_ft_id });
		const looser_data = await User.findOne({ ft_id: looser_ft_id });

		let newGame = new Game();
		newGame.winner = winner_data;
		newGame.winner_score = winner_score;
		newGame.looser = looser_data;
		newGame.looser_score = loser_score;

		await newGame.save();

		return newGame;
	}
}
