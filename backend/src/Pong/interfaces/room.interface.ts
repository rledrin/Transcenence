import { Socket } from "socket.io";

export interface Vec2 {
	x: number;
	y: number;
}

export interface Ball {
	position: Vec2;
	velocity: Vec2;
	radius: number;
	speed: number;
}

export enum State {
	WAITING,
	STARTING,
	COUNTDOWN,
	INGAME,
	GOAL,
	END,
}

export interface Player {
	socket: Socket;
	ft_id: number;
	position: Vec2;
	score: number;
	room: Room;
	heightFromCenter: number;
	player_speed: number;
}

export interface Room {
	code: string;
	state: State;
	ready: boolean;
	ball: Ball;
	players: Array<Player>;
	spectators: Array<Socket>;
	maxScore: number;
	normal_ball_speed: number;
}
