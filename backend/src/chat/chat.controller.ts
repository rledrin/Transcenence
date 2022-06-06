import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ChannelService } from "./channel.service";

@Controller("chat")
export class ChatController {
	constructor(private readonly channelService: ChannelService) {}

	@Get("channel")
	async getChannels() {
		return await this.channelService.getChannels();
	}

	@Get("channel/:channelId")
	async getChannelsId(@Param("channelId") channelId: string) {
		return await this.channelService.getChannelId(channelId);
	}

	@Get("channel/:ownerId/dm/:userId")
	async createDm(
		@Param("ownerId", ParseIntPipe) ownerId: number,
		@Param("userId", ParseIntPipe) userId: number
	) {
		return await this.channelService.createDm(ownerId, userId);
	}
}
