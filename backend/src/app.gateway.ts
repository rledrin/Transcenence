import {
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { Channel } from "./chat/entities/channel.entity";
import { MutedUser } from "./chat/entities/mutedUser.entity";
import { BannedUser } from "./chat/entities/bannedUser.entity";
import { Player } from "./Pong/interfaces/room.interface";
import { RoomService } from "./Pong/room.service";
import { ChannelService } from "./chat/channel.service";
import { User } from "./user/entities/user.entity";
import { UserStatus } from "./interfaces/user-status.enum";
import { DoubleAuthService } from "./2FA/doubleAuth.service";
const bcrypt = require("bcrypt");

@WebSocketGateway({
	cors: {
		origin: "*",
	},
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly roomService: RoomService,
		private readonly channelService: ChannelService,
		private readonly doubleAuthService: DoubleAuthService
	) {}

	@WebSocketServer()
	server: Server;

	private clientsId = new Map<Socket, number>();
	private clientsFt = new Map<number, Socket>();
	private dfaCode = new Map<number, string>();
	private duelRequestArray = new Array<{ sender: Socket; receiver: Socket }>();

	async handleConnection(client: Socket) {
		try {
			console.log("Client connected: ", client.id);
			console.log("Client ft_id: ", client.handshake.query.ft_id);

			const user = await User.findOne({
				ft_id: Number(client.handshake.query.ft_id),
			});
			if (user && user.status) {
				user.status = UserStatus.ONLINE;
				await user.save();

				this.clientsId.set(client, Number(client.handshake.query.ft_id));
				this.clientsFt.set(Number(client.handshake.query.ft_id), client);
				this.server.emit("status", { ft_id: user.ft_id, status: user.status });
			}
		} catch (error) {
			console.log("Error handleConnection: ", error);
		}
	}

	async handleDisconnect(client: Socket) {
		console.log("Client disconnected: ", client.id);
		const ft_id = this.clientsId.get(client);

		const someoneDisconnected = this.duelRequestArray.find((disconnected) => {
			if (disconnected.sender === client || disconnected.receiver === client) {
				return true;
			} else return false;
		});

		if (someoneDisconnected) {
			if (someoneDisconnected.receiver === client) {
				someoneDisconnected.sender.emit("cancelDuelProposal");
			} else if (someoneDisconnected.sender === client) {
				someoneDisconnected.receiver.emit("cancelDuelProposal");
			}
		}

		const player = this.roomService.getPlayer(ft_id);
		const spectator = this.roomService.getSpectator(client.id);
		if (player) {
			this.roomService.removeSocket(player);
		} else if (spectator) {
			this.roomService.removeSocket(undefined, client);
		}

		const user = await User.findOne({
			ft_id: ft_id,
		});
		if (user && user.status) {
			user.status = UserStatus.OFFLINE;
			await user.save();

			this.clientsId.delete(client);
			this.clientsFt.delete(ft_id);
			this.server.emit("status", { ft_id: user.ft_id, status: user.status });
		}
	}

	@SubscribeMessage("2FA")
	async change2FA(client: Socket, data: any): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id });
		if (user.dfa) {
			user.dfa = false;
			await user.save();
		} else {
			user.dfa = true;
			await user.save();
		}
	}

	@SubscribeMessage("ask2FA")
	async ask2FA(client: Socket): Promise<void> {
		const ft_id = this.clientsId.get(client);
		if (this.dfaCode.has(ft_id)) {
			this.dfaCode.delete(ft_id);
		}
		if (!(await User.findOne({ ft_id })).dfa) {
			client.emit("ask2FA", false);
			return;
		}
		const code = Math.floor(Math.random() * (9999 - 1000) + 1000).toString();
		this.dfaCode.set(ft_id, code);

		await this.doubleAuthService.sendEmail(ft_id, code);
		client.emit("ask2FA", true);
	}

	@SubscribeMessage("check2FA")
	async check2FA(client: Socket, data: { code: string }): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const code = this.dfaCode.get(ft_id);
		if (!code) {
			client.emit("check2FA", false);
			return;
		}
		if (code === data.code) {
			client.emit("check2FA", true);
		} else {
			client.emit("check2FA", false);
		}
	}

	async emitChannel(channel: any, event: string, data: any): Promise<void> {
		if (!channel.users) return;

		const sockets: any[] = Array.from(this.server.sockets.sockets.values());
		sockets.forEach((socket) => {
			if (
				channel.users.find((user) => user.ft_id === this.clientsId.get(socket))
			) {
				socket.emit(event, data);
			}
		});
	}

	@SubscribeMessage("text")
	async handleMessage(
		client: Socket,
		data: { channelId: string; message: string; date: Date }
	): Promise<void> {
		console.log("Message received from: ", client.id);
		console.log("Message received data: ", data);
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });

		const channel = await Channel.findOne(
			{
				id: data.channelId,
			},
			{ relations: ["users", "muted"] }
		);
		const mutedUser = await MutedUser.findOne({
			user: user,
			channel: channel,
		});

		if (mutedUser) {
			if (mutedUser.endOfMute.getTime() < Date.now()) {
				await mutedUser.remove();
			} else {
				return;
			}
		}

		if (channel && channel.users) {
			this.emitChannel(channel, "text", {
				message: data.message,
				user: user,
				date: data.date,
				channelId: data.channelId,
				admins: channel.admins,
			});
		}
	}

	@SubscribeMessage("joinChannel")
	async joinChannel(
		client: Socket,
		data: { channelId: string; password: string }
	): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const channel = await Channel.findOne(
			{
				id: data.channelId,
			},
			{ relations: ["users", "banned"] }
		);
		const bannedUser = await BannedUser.findOne(
			{
				user: user,
				channel: channel,
			},
			{ relations: ["user", "channel"] }
		);
		if (bannedUser) {
			if (bannedUser.endOfBan.getTime() < Date.now()) {
				await bannedUser.remove();
			} else {
				return;
			}
		}

		if (channel && channel.private) {
			if (!bcrypt.compareSync(data.password, channel.password)) {
				return;
			}
		}

		channel.users = [...channel.users, user];

		await channel.save();

		client.emit("myChannel", {
			add: true,
			channelname: channel.channelname,
			id: channel.id,
			private: channel.private,
			admins: channel.admins,
		});
	}

	@SubscribeMessage("createChannel")
	async createChannel(
		client: Socket,
		data: { channelname: string; password: string }
	): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		let channel = new Channel();
		channel.channelname = data.channelname;
		channel.owner = user;
		channel.admins = [user];
		channel.private = data.password ? true : false;
		if (data.password) {
			const saltRounds = 10;
			const salt = bcrypt.genSaltSync(saltRounds);
			channel.password = bcrypt.hashSync(data.password, salt);
		}

		channel.users = [user];

		await channel.save();

		client.emit("myChannel", {
			add: true,
			channelname: channel.channelname,
			id: channel.id,
			private: channel.private,
			admins: channel.admins,
		});

		const sockets: any[] = Array.from(this.server.sockets.sockets.values());
		sockets.forEach((socket) => {
			if (socket.id !== client.id) {
				socket.emit("searchChannel", {
					channelname: channel.channelname,
					id: channel.id,
					private: channel.private,
					dm: channel.dm,
					admins: channel.admins,
				});
			}
		});
	}

	@SubscribeMessage("leaveChannel")
	async leaveChannel(
		client: Socket,
		data: { channelId: string }
	): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const channel = await Channel.findOne(
			{
				id: data.channelId,
			},
			{ relations: ["users", "admins"] }
		);
		if (!channel) return;
		if (channel.owner && channel.owner === user) {
			channel.owner = null;
		}
		channel.users = channel.users.filter((u) => u.id !== user.id);
		channel.admins = channel.admins.filter((u) => u.id !== user.id);

		if (channel.users.length > 0 && !channel.dm) {
			client.emit("myChannel", {
				add: false,
				channelname: channel.channelname,
				id: channel.id,
				private: channel.private,
				dm: channel.dm,
				admins: channel.admins,
			});
			await channel.save();
		} else if (channel.users.length === 0 || channel.dm) {
			for (let u of channel.users) {
				const sock = this.clientsFt.get(u.ft_id);
				if (sock.id !== client.id) {
					sock.emit("myChannel", {
						add: false,
						channelname: channel.channelname,
						id: channel.id,
						private: channel.private,
						dm: channel.dm,
						admins: channel.admins,
					});
				}
			}
			this.server.emit("myChannel", {
				add: false,
				channelname: channel.channelname,
				id: channel.id,
				private: channel.private,
				dm: channel.dm,
				admins: channel.admins,
			});
			await Channel.delete({ id: channel.id });
		}
	}

	@SubscribeMessage("getChannelAdmin")
	async getChannelAdmin(
		client: Socket,
		data: { channelId: string }
	): Promise<void> {
		const channel = await Channel.findOne(
			{
				id: data.channelId,
			},
			{ relations: ["admins"] }
		);
		if (!channel) return;
		client.emit("getChannelAdmin", {
			admins: channel.admins,
		});
	}

	@SubscribeMessage("makeAdmin")
	async makeAdmin(client: Socket, data: any): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const userToMakeAdmin = await User.findOne({ ft_id: data.user_id });
		const uSocket = this.clientsFt.get(data.user_id);
		console.log("add, user: ", userToMakeAdmin.username);

		const channel = await Channel.findOne(
			{
				id: data.channel_id,
			},
			{ relations: ["admins"] }
		);
		if (!channel || !userToMakeAdmin || !user) return;
		if (
			channel.admins.find((u) => u.id === user.id) &&
			!channel.admins.find((u) => u.id === userToMakeAdmin.id)
		) {
			channel.admins.push(userToMakeAdmin);
			await channel.save();
			if (uSocket) {
				console.log("uSocket: ", channel.channelname);
				uSocket.emit("getChannelAdmin", {
					admins: channel.admins,
				});
			}
			console.log("user: ", userToMakeAdmin.username, " is now admin");
		}
	}

	@SubscribeMessage("removeAdmin")
	async removeAdmin(client: Socket, data: any): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const userToRemoveAdmin = await User.findOne({ ft_id: data.user_id });
		const uSocket = this.clientsFt.get(data.user_id);
		console.log("remove, user: ", userToRemoveAdmin.username);
		const channel = await Channel.findOne(
			{
				id: data.channel_id,
			},
			{ relations: ["admins"] }
		);
		if (!channel || !userToRemoveAdmin || !user) return;
		if (
			channel.admins.find((u) => u.id === user.id) &&
			channel.admins.find((u) => u.id === userToRemoveAdmin.id)
		) {
			channel.admins = channel.admins.filter(
				(u) => u.id !== userToRemoveAdmin.id
			);
			console.log(
				"user: ",
				userToRemoveAdmin.username,
				" is not admin anymore"
			);
			await channel.save();
			if (uSocket) {
				console.log("uSocket: ", channel.channelname);
				uSocket.emit("getChannelAdmin", {
					admins: channel.admins,
				});
			}
		}
	}

	@SubscribeMessage("mute")
	async mute(
		client: Socket,
		data: { endOfMute: Date; channel_id: string; user_id: number }
	): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const userToMute = await User.findOne({ ft_id: data.user_id });
		const uSocket = this.clientsFt.get(data.user_id);
		console.log("mute, user: ", userToMute.username);
		const channel = await Channel.findOne(
			{
				id: data.channel_id,
			},
			{ relations: ["users", "admins", "muted"] }
		);
		if (!channel || !userToMute || !user) return;
		if (
			channel.admins.find((u) => u.id === user.id) &&
			!channel.muted.find((u) => u.id === userToMute.id)
		) {
			const muted = new MutedUser();
			muted.user = userToMute;
			muted.endOfMute = new Date(data.endOfMute);
			muted.channel = channel;
			await muted.save();
			console.log(
				"user: ",
				userToMute.username,
				" is now muted until: ",
				muted.endOfMute
			);
		}
	}

	@SubscribeMessage("ban")
	async ban(
		client: Socket,
		data: { endOfBan: Date; channel_id: string; user_id: number }
	): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const user = await User.findOne({ ft_id: ft_id });
		const userToBan = await User.findOne({ ft_id: data.user_id });
		const uSocket = this.clientsFt.get(data.user_id);
		console.log("ban, user: ", userToBan.username);
		const channel = await Channel.findOne(
			{
				id: data.channel_id,
			},
			{ relations: ["users", "admins", "banned"] }
		);
		if (!channel || !userToBan || !user) return;
		if (
			channel.admins.find((u) => u.id === user.id) &&
			!channel.banned.find((u) => u.id === userToBan.id)
		) {
			const banned = new BannedUser();
			banned.user = userToBan;
			banned.endOfBan = new Date(data.endOfBan);
			banned.channel = channel;
			channel.banned.push(banned);
			await banned.save();
			channel.users = channel.users.filter((u) => u.id !== userToBan.id);
			channel.admins = channel.admins.filter((u) => u.id !== userToBan.id);
			if (channel.owner && channel.owner.ft_id === userToBan.ft_id) {
				channel.owner = null;
			}
			await channel.save();
			if (uSocket) {
				uSocket.emit("myChannel", {
					add: false,
					channelname: channel.channelname,
					id: channel.id,
					private: channel.private,
					dm: channel.dm,
					admins: channel.admins,
				});
			}
			console.log(
				"user: ",
				userToBan.username,
				" is now banned until: ",
				banned.endOfBan
			);
		}
	}

	@SubscribeMessage("createDm")
	async createDm(client: Socket, data: { ft_id: number }): Promise<void> {
		const ft_id = this.clientsId.get(client);
		const otherClient = this.clientsFt.get(data.ft_id);

		const channel = await this.channelService.createDm(ft_id, data.ft_id);
		if (!channel) {
			return;
		}
		client.emit("myChannel", {
			add: true,
			channelname: channel.channelname,
			id: channel.id,
			private: channel.private,
			admins: channel.admins,
		});
		otherClient?.emit("myChannel", {
			add: true,
			channelname: channel.channelname,
			id: channel.id,
			private: channel.private,
			admins: channel.admins,
		});
	}

	@SubscribeMessage("GetUserData")
	async getUserData(client: Socket): Promise<void> {
		const ft_id = this.clientsId.get(client);

		let user: any = await User.findOne(
			{ ft_id },
			{ relations: ["channels", "friends", "blocked"] }
		);

		user.channels = user.channels.map((channel, index) => {
			return {
				id: channel.id,
				channelname: channel.channelname,
				private: channel.private,
				dm: channel.dm,
				admins: channel.admins,
			};
		});

		client.emit("userData", user);
	}

	@SubscribeMessage("queue")
	joinQueue(client: Socket): void {
		console.log("Queue joined", client.id);
		const p: Player = {
			ft_id: this.clientsId.get(client),
			socket: client,
			score: 0,
			room: null,
			position: { x: 0, y: 50 },
			heightFromCenter: 8.1,
			player_speed: 0.9,
		};
		this.roomService.addQueue(p);
	}

	@SubscribeMessage("queueSpectate")
	async onQueueSpectate(client: Socket): Promise<void> {
		this.roomService.findRoomToSpectate(client);
	}

	@SubscribeMessage("removeSocket")
	removeSocket(client: Socket, data: any): void {
		const ft_id = this.clientsId.get(client);
		const player = this.roomService.getPlayer(ft_id);

		if (data && data.spectate) {
			this.roomService.removeSocket(undefined, client);
		} else {
			this.roomService.removeSocket(player);
		}
	}

	@SubscribeMessage("ready")
	async onReady(client: Socket): Promise<void> {
		const player: Player = this.roomService.getPlayer(
			this.clientsId.get(client)
		);
		let spec = false;
		let room = undefined;
		if (player && player.room) {
			room = player.room;
		} else {
			spec = true;
			room = this.roomService.getRoomForSpectators(client);
		}
		if (!room) {
			return;
		}
		const p1 = await User.findOne({
			ft_id: room.players[0].ft_id,
		});
		const p2 = await User.findOne({
			ft_id: room.players[1].ft_id,
		});
		let p1Username = "";
		let p2Username = "";
		if (p1) p1Username = p1.username;
		if (p2) p2Username = p2.username;
		if (spec) {
			client.emit("score", {
				p1: room.players[0].score,
				p2: room.players[1].score,
			});
		}
		client.emit("room", {
			code: room.code,
			p1Username: p1Username,
			p2Username: p2Username,
		});
		this.roomService.startGame(room, this.server);
	}

	@SubscribeMessage("start")
	onStart(client: Socket): void {
		const player: Player = this.roomService.getPlayer(
			this.clientsId.get(client)
		);
		if (!player || !player.room) {
			return;
		}
		this.roomService.startCalc(player.room);
	}

	@SubscribeMessage("move")
	onMove(client: Socket, data: { code: string; direction: number }): void {
		const player: Player = this.roomService.getPlayer(
			this.clientsId.get(client)
		);
		if (!player || !player.room) return;

		const pos = player.position.y;
		if (
			(player.position.y + player.heightFromCenter < 100 &&
				player.position.y - player.heightFromCenter > 0) ||
			(player.position.y + player.heightFromCenter > 100 &&
				data.direction === -1)
		) {
			player.position.y += player.player_speed * data.direction;
		} else if (
			(player.position.y - player.heightFromCenter > 0 &&
				player.position.y + player.heightFromCenter < 100) ||
			(player.position.y - player.heightFromCenter < 0 && data.direction === 1)
		) {
			player.position.y += player.player_speed * data.direction;
		}
	}

	@SubscribeMessage("duelProposal")
	async onDuelProposal(
		client: Socket,
		data: { opponent_ft_id: number; opponent_username: string }
	): Promise<void> {
		const receiver = this.clientsFt.get(data.opponent_ft_id);
		const sender = this.clientsId.get(client);

		if (!receiver || !sender) {
			return;
		}
		if (this.duelRequestArray.find((e) => e.receiver === receiver)) {
			client.emit("cancelDuelProposal");
			return;
		}
		this.duelRequestArray.push({ sender: client, receiver });

		const username = await (await User.findOne({ ft_id: sender })).username;

		receiver.emit("duelProposal", { username });
	}

	@SubscribeMessage("cancelDuelProposal")
	async onCancelDuelProposal(client: Socket): Promise<void> {
		const receiver = this.duelRequestArray.find((receiver) => {
			return receiver.sender === client || receiver.receiver === client;
		});
		this.duelRequestArray = this.duelRequestArray.filter(
			(e) => e.sender !== receiver.sender || e.receiver !== receiver.receiver
		);
		if (receiver && receiver.sender && receiver.sender === client) {
			receiver.receiver.emit("cancelDuelProposal");
		} else if (receiver && receiver.receiver && receiver.receiver === client) {
			receiver.sender.emit("cancelDuelProposal");
		}
	}

	@SubscribeMessage("acceptDuel")
	async onAcceptDuel(client: Socket): Promise<void> {
		const players = this.duelRequestArray.find((players) => {
			return players.sender === client || players.receiver === client;
		});
		if (players) {
			const roomCode = this.roomService.createRoom();
			const p1: Player = {
				ft_id: this.clientsId.get(players.sender),
				socket: players.sender,
				score: 0,
				room: null,
				position: { x: 0, y: 50 },
				heightFromCenter: 8.1,
				player_speed: 0.9,
			};
			const p2: Player = {
				ft_id: this.clientsId.get(players.receiver),
				socket: players.receiver,
				score: 0,
				room: null,
				position: { x: 0, y: 50 },
				heightFromCenter: 8.1,
				player_speed: 0.9,
			};
			this.roomService.joinRoom(roomCode, p1);
			this.roomService.joinRoom(roomCode, p2);
		}
	}
}
