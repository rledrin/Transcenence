import { User } from "src/user/entities/user.entity";
import {
	BaseEntity,
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Channel } from "./channel.entity";

@Entity()
export class BannedUser extends BaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "timestamp" })
	endOfBan: Date;

	@ManyToOne(() => User, { onDelete: "CASCADE" })
	@JoinColumn()
	user: User;

	@ManyToOne(() => Channel, { onDelete: "CASCADE" })
	@JoinColumn()
	channel: Channel;
}
