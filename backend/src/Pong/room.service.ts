import {
	ConsoleLogger,
	HttpException,
	HttpStatus,
	Injectable,
} from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { UserStatus } from "src/interfaces/user-status.enum";
import { User } from "src/user/entities/user.entity";
import { Player, Room, State } from "./interfaces/room.interface";
import { PongService } from "./pong.service";

@Injectable()
export class RoomService {
	constructor(private readonly pongService: PongService) {}

	rooms: Map<string, Room> = new Map();
	queue: Array<Player> = [];
	spectatorQueue: Array<Socket> = [];
	server: Server;

	createRoom(code: string = null): Room {
		while (!code) {
			const length = 10;
			const generated = Math.floor(
				Math.random() * Math.pow(16, length)
			).toString(16);
			if (!this.rooms.has(generated)) code = generated;
		}

		const room: Room = {
			code,
			state: State.WAITING,
			players: [],
			spectators: [],
			ball: {
				position: { x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				speed: 0.8,
				radius: 1.5,
			},
			ready: false,
			normal_ball_speed: 0.8,
			maxScore: 3,
		};
		this.rooms.set(code, room);
		return room;
	}

	getRoom(code: string): Room {
		return this.rooms.get(code);
	}

	removeRoom(code: string) {
		this.rooms.delete(code);
	}

	getPlayer(ft_id: number): Player {
		for (const room of this.rooms.values()) {
			for (const player of room.players) {
				if (player.ft_id == ft_id) {
					return player;
				}
			}
		}
		return this.queue.find((player) => player.ft_id == ft_id);
	}

	getSpectator(clientId: string): Socket {
		for (const room of this.rooms.values()) {
			for (const spectator of room.spectators) {
				if (spectator.id === clientId) {
					return spectator;
				}
			}
		}
		return this.spectatorQueue.find((spectator) => spectator.id === clientId);
	}

	getRoomForSpectators(spec: Socket): Room {
		const rooms = Array.from(this.rooms.values());
		const room = rooms.find((room) =>
			room.spectators.find((spectator) => spectator === spec)
		);

		return room;
	}

	emit(room: Room, event: string, ...args: any): void {
		for (const player of room.players) {
			player.socket.emit(event, ...args);
		}
		if (room.spectators && room.spectators.length > 0) {
			for (const spectator of room.spectators) {
				spectator.emit(event, ...args);
			}
		}
	}

	emitSpectator(room: Room, event: string, ...args: any): void {
		if (room.spectators && room.spectators.length > 0) {
			for (const spectator of room.spectators) {
				spectator.emit(event, ...args);
			}
		}
	}

	async removeSocket(player?: Player, spectator?: Socket): Promise<any> {
		if (this.queue.indexOf(player) !== -1) {
			return this.queue.splice(this.queue.indexOf(player), 1);
		}

		if (this.spectatorQueue.indexOf(spectator) !== -1) {
			return this.spectatorQueue.splice(
				this.spectatorQueue.indexOf(spectator),
				1
			);
		}

		for (const room of this.rooms.values()) {
			if (
				room.spectators &&
				spectator &&
				room.spectators.indexOf(spectator) !== -1
			) {
				console.log("spectator removed");
				console.log("room.spectators", room.spectators);
				room.spectators = room.spectators.filter(
					(spec) => spec.id !== spectator.id
				);
				console.log("room.spectators", room.spectators);
				return room;
			}

			for (const p of room.players) {
				if (player.ft_id === p.ft_id) {
					await this.stopGame(
						room,
						room.players.find((player1) => player1.ft_id !== player.ft_id)
					);
					room.players.splice(room.players.indexOf(player), 1);
					break;
				}
			}
			if (!room.players.length) {
				return this.rooms.delete(room.code);
			}
		}
	}

	addQueue(player: Player): void {
		for (const p of this.queue) {
			if (player.ft_id === p.ft_id) {
				return;
			}
		}
		if (this.getPlayer(player.ft_id)) {
			return;
		}

		this.queue.push(player);
		if (this.queue.length < 2) {
			return;
		}

		const room: Room = this.createRoom();
		while (this.queue.length && room.players.length < 2)
			this.joinRoom(room, this.queue.shift());
	}

	async joinRoom(
		room: Room,
		player?: Player,
		spectator?: Socket
	): Promise<void> {
		if (room.state == State.WAITING && player !== undefined) {
			player.room = room;
			room.players.push(player);

			if (room.players.length == 2) {
				room.state = State.STARTING;
				room.players.map((p) => {
					p.socket.emit("gameFound");
				});
			}
		} else {
			if (spectator) {
				room.spectators.push(spectator);
				spectator.emit("gameFound");
			}
		}
	}

	async startGame(room: Room, server: Server): Promise<void> {
		this.server = server;
		if (room.state !== State.STARTING && room.state !== State.COUNTDOWN) {
			return;
		}
		room.state = State.COUNTDOWN;
		if (!room.ready) {
			room.ready = true;
			return;
		}

		const p1 = await User.findOne({ ft_id: room.players[0].ft_id });
		const p2 = await User.findOne({ ft_id: room.players[1].ft_id });
		p1.status = UserStatus.INGAME;
		p2.status = UserStatus.INGAME;
		await p1.save();
		await p2.save();

		this.server.emit("status", { ft_id: p1.ft_id, status: p1.status });
		this.server.emit("status", { ft_id: p2.ft_id, status: p2.status });

		this.emit(room, "countdown", 3);
		await setTimeout(() => {
			this.emit(room, "countdown", 2);
		}, 1000);
		await setTimeout(() => {
			this.emit(room, "countdown", 1);
		}, 2000);
		await setTimeout(() => {
			this.emit(room, "ready");
		}, 3000);
	}

	startCalc(room: Room): void {
		if (room.state != State.COUNTDOWN) {
			return;
		}
		if (this.spectatorQueue.length > 0) {
			room.spectators.push(...this.spectatorQueue);
			this.spectatorQueue = [];
			this.emitSpectator(room, "gameFound");
		}

		this.pongService.resetBall(room);
		room.state = State.INGAME;
		let intervale = setInterval(() => {
			this.pongService.update(room);
			if (room.state === State.END) {
				clearInterval(intervale);
			}
		}, 1000 / 60);
	}

	async stopGame(room: Room, player: Player): Promise<void> {
		if (!player || room.state === State.END) {
			return;
		}
		room.state = State.END;

		if (room.players.length == 2) {
			const looser = room.players.find(
				(player1) => player1.ft_id != player.ft_id
			);
			const winner = player;

			const winner_user = await User.findOne({ ft_id: winner.ft_id });
			const looser_user = await User.findOne({ ft_id: looser.ft_id });

			winner_user.lvl += 20;
			looser_user.lvl += 10;

			winner_user.elo += 5;
			looser_user.elo -= 5;

			winner_user.win++;
			looser_user.lose++;

			winner_user.status = UserStatus.ONLINE;
			looser_user.status = UserStatus.ONLINE;

			await winner_user.save();
			await looser_user.save();

			this.server.emit("status", {
				ft_id: winner_user.ft_id,
				status: winner_user.status,
			});
			this.server.emit("status", {
				ft_id: looser_user.ft_id,
				status: looser_user.status,
			});

			this.pongService.createGame(
				winner.ft_id,
				winner.score,
				looser.ft_id,
				looser.score
			);

			winner.socket.emit("win");
			looser.socket.emit("lose");
		} else {
			player.socket.emit("win");
		}
		this.emitSpectator(room, "stop");
		this.removeRoom(room.code);
	}

	async findRoomToSpectate(spectator: Socket) {
		let roomToJoin;
		for (const room of this.rooms.values()) {
			if (room.state === State.INGAME) {
				roomToJoin = room;
			}
		}
		if (roomToJoin) {
			this.joinRoom(roomToJoin, undefined, spectator);
		} else {
			this.spectatorQueue.push(spectator);
		}
	}
}
