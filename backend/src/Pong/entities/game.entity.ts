import { User } from "src/user/entities/user.entity";
import {
	BaseEntity,
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Game extends BaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => User, {
		cascade: true,
		nullable: false,
	})
	@JoinColumn({ name: "winner_id", referencedColumnName: "ft_id" })
	winner: User;

	@Column("int", { default: 0 })
	winner_score: number;

	@ManyToOne(() => User, {
		cascade: true,
		nullable: false,
	})
	@JoinColumn({ name: "looser_id", referencedColumnName: "ft_id" })
	looser: User;

	@Column("int", { default: 0 })
	looser_score: number;
}
