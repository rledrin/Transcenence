import { User } from "src/user/entities/user.entity";
import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinTable,
	JoinColumn,
	ManyToMany,
	BaseEntity,
	OneToMany,
} from "typeorm";
import { BannedUser } from "./bannedUser.entity";
import { MutedUser } from "./mutedUser.entity";

@Entity()
export class Channel extends BaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("text", { default: "" })
	channelname: string;

	@Column("boolean", { default: false })
	private: boolean;

	@Column("text", { default: "" })
	password: string;

	@Column("boolean", { default: false })
	dm: boolean;

	@ManyToOne(() => User, (user) => user.channel_owned, {
		cascade: true,
		nullable: true,
	})
	@JoinColumn({ name: "owner_id", referencedColumnName: "ft_id" })
	owner: User;

	@ManyToMany(() => User, { cascade: true })
	@JoinTable({
		name: "channel-admin",
		joinColumn: {
			name: "channel_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
	})
	admins: User[];

	@OneToMany(() => MutedUser, (mutedUser) => mutedUser.channel)
	muted: MutedUser[];

	@OneToMany(() => BannedUser, (bannedUser) => bannedUser.channel, {
		eager: true,
	})
	banned: BannedUser[];

	@ManyToMany((type) => User, (user) => user.channels, { cascade: true })
	@JoinTable({
		name: "channel-user",
		joinColumn: {
			name: "channel_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "user_id",
			referencedColumnName: "id",
		},
	})
	users: User[];
}
