import { Channel } from "src/chat/entities/channel.entity";
import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToMany,
	JoinTable,
	BaseEntity,
	OneToMany,
} from "typeorm";
import { UserStatus } from "../../interfaces/user-status.enum";

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ unique: true, nullable: true })
	ft_id: number;

	@Column("text", { default: "" })
	username: string;

	@Column("text", { default: "empty" })
	picture: string;

	@Column("text", { default: "" })
	mail: string;

	@Column("boolean", { default: false })
	dfa: boolean;

	@Column("int", { default: 1000 })
	elo: number;

	@Column("int", { default: 0 })
	win: number;

	@Column("int", { default: 0 })
	lose: number;

	@Column("text", { default: "" })
	ball: string;

	@Column("text", { default: "" })
	map: string;

	@Column("text", { default: UserStatus.ONLINE })
	status: UserStatus;

	@OneToMany(() => Channel, (channel) => channel.owner)
	channel_owned: Channel[];

	@ManyToMany(() => User, (user) => user.friends)
	@JoinTable({
		name: "user-friend",
		joinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
	})
	friends: User[];

	@ManyToMany(() => User, (user) => user.blocked)
	@JoinTable({
		name: "user-blocked",
		joinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
	})
	blocked: User[];

	@ManyToMany((type) => Channel, (channel) => channel.users)
	channels: Channel[];

	@Column("int", { default: 101 })
	lvl: number;
}
