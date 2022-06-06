import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
const nodemailer = require("nodemailer");

@Injectable()
export class DoubleAuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>
	) {}

	transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true, // true for 465, false for other ports
		auth: {
			user: process.env.MAIL,
			pass: process.env.PASS,
		},
	});

	async sendEmail(ft_id: number, code: string) {
		const user = await this.userRepository.findOne({ ft_id });
		if (!user || !user.mail || !user.dfa) {
			return;
		}

		let info = await this.transporter.sendMail({
			from: '"Transcendence Pong" <' + process.env.MAIL+ ">", // sender address
			to: user.mail, // list of receivers
			subject: "Pong Authentification code: " + code, // Subject line
			text: "Code: " + code, // plain text body
			html: "<h2>Code: </h2><h1>" + code + "</h1>", // html body
		});

		// console.log("info: %s", info);

		// console.log("Message sent: %s", info.messageId);
		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

		// Preview only available when sending through an Ethereal account
		// console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
		// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
	}
}
