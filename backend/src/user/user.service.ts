import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";

@Injectable()
export class UserService {
	async getAllUsers(): Promise<User[]> {
		return User.find();
	}

	async getUser(id: number): Promise<User> {
		let user: any = await User.findOne(
			{ ft_id: id },
			{ relations: ["channels", "friends", "blocked"] }
		);

		if (user.channels) {
			user.channels = user.channels.map((channel, index) => {
				return {
					id: channel.id,
					channelname: channel.channelname,
					dm: channel.dm,
					private: channel.private,
					admins: channel.admins,
				};
			});
		} else {
			user.channels = [];
		}

		return user;
	}

	async addFriend(id: number, friendId: number): Promise<User> {
		const user = await User.findOne({ ft_id: id }, { relations: ["friends"] });
		const friend = await User.findOne({ ft_id: friendId });
		user.friends.push(friend);
		await user.save();
		return user;
	}

	async removeFriend(id: number, friendId: number): Promise<User> {
		const user = await User.findOne({ ft_id: id }, { relations: ["friends"] });
		const friend = await User.findOne({ ft_id: friendId });
		user.friends = user.friends.filter((f) => f.id !== friend.id);
		await user.save();
		return user;
	}

	async blockUser(id: number, blockedId: number): Promise<User> {
		const user = await User.findOne({ ft_id: id }, { relations: ["blocked"] });
		const blocked = await User.findOne({ ft_id: blockedId });
		user.blocked.push(blocked);
		await user.save();
		return user;
	}

	async unblockUser(id: number, unblockedId: number): Promise<User> {
		const user = await User.findOne({ ft_id: id }, { relations: ["blocked"] });
		const blocked = await User.findOne({ ft_id: unblockedId });
		user.blocked = user.blocked.filter(
			(blockedUser) => blockedUser.id !== blocked.id
		);
		await user.save();
		return user;
	}

	async setElo(id: number, elo: number): Promise<User> {
		const user = await User.findOne({ ft_id: id });
		user.elo = elo;
		await user.save();
		return user;
	}

	async setUsername(id: number, username: string): Promise<any> {
		const checkUserName = await User.findOne({ username });
		if (checkUserName) {
			return { success: false };
		}
		const user = await User.findOne({ ft_id: id });
		user.username = username;
		await user.save();
		return { success: true };
	}

	async setPicture(id: number, link: string): Promise<User> {
		const user = await User.findOne({ ft_id: id });
		user.picture = link;
		await user.save();
		return user;
	}

	async setBall(id: number, link: string): Promise<User> {
		const user = await User.findOne({ ft_id: id });
		user.ball = link;
		await user.save();
		return user;
	}

	async setMap(id: number, link: string): Promise<User> {
		const user = await User.findOne({ ft_id: id });
		user.map = link;
		await user.save();
		return user;
	}
}
