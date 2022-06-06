import { Injectable } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { Channel } from "./entities/channel.entity";

@Injectable()
export class ChannelService {
	async getChannels() {
		const channels = await Channel.find({ relations: ["admins"] });
		let c = [];
		channels.forEach((channel) => {
			c.push({
				id: channel.id,
				channelname: channel.channelname,
				dm: channel.dm,
				private: channel.private,
				admins: channel.admins,
			});
		});
		return c;
	}

	getChannelId(id: string) {
		return Channel.findOne({ id });
	}

	async createDm(owner_ft_id: number, user_ft_id: number) {
		const owner = await User.findOne({ ft_id: owner_ft_id });
		const user = await User.findOne({ ft_id: user_ft_id });

		const channel = new Channel();
		const alreadyExists = await Channel.findOne({
			dm: true,
			channelname: `Dm ${owner.username}-${user.username}`,
		});
		const alreadyExists2 = await Channel.findOne({
			dm: true,
			channelname: `Dm ${user.username}-${owner.username}`,
		});
		if (alreadyExists || alreadyExists2) {
			return;
		}
		channel.owner = owner;
		channel.users = [owner, user];
		channel.dm = true;

		channel.channelname = `Dm ${owner.username}-${user.username}`;

		return await channel.save();
	}
}
