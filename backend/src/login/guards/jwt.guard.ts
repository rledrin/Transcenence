import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class CheckJwtGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req: Request = context.switchToHttp().getRequest();
		if (req.cookies.token) return true;
		else return false;
	}
}
