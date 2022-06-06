import styles from "../../css/Chat.module.css";
import Avatar from "react-avatar";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Form from "react-bootstrap/Form";
import {
	SportsEsports,
	Block,
	AdminPanelSettings,
	VolumeOff,
	AccountCircle,
} from "@mui/icons-material";

import { useNavigate } from "react-router";
import { useContext, useEffect, useState } from "react";
import { context } from "../../App";

interface Props {
	myMessages: any;
	channelSelected: string;
	channelInfo: any;
	userInfo: any;
}

export default function messages(props: Props) {
	return (
		<div id={styles.message}>
			{Item(
				props.myMessages,
				props.channelSelected,
				props.channelInfo,
				props.userInfo
			)}
		</div>
	);
}

function Item(
	dataMessages: any,
	channelSelected: any,
	channelInfo: any,
	userInfo: any
) {
	const [modalProfile, setModalProfile] = useState(false);
	const [modalDuel, setModalDuel] = useState(false);
	const [showDropdownMute, setShowDropdownMute] = useState(false);
	const [showDropdownBan, setShowDropdownBan] = useState(false);
	const [valueTimeMute, setValueTimeMute] = useState(0);
	const [valueTimeBan, setValueTimeBan] = useState(0);
	const [booleanButtonMakeAdmin, setBooleanButtonMakeAdmin] = useState(true);
	const [user, setUser] = useState<any>();
	const [admins, setAdmins] = useState<any>();

	const ws = useContext(context);

	const navigate = useNavigate();
	// const user_id = 1;
	const user_id = userInfo.ft_id;

	useEffect(() => {
		ws.on("cancelDuelProposal", (data: any) => {
			setModalDuel(false);
		});
		ws.on("gameFound", (data: any) => {
			navigate("/TheGame");
		});
		ws.on("getChannelAdmin", (data: any) => {
			setAdmins(data.admins);
		});
	}, []);

	useEffect(() => {
		if (!user || !user.ft_id) return;
		if (admins && admins.find((x: any) => x.ft_id === user.ft_id)) {
			setBooleanButtonMakeAdmin(false);
		} else if (admins && !admins.find((x: any) => x.ft_id === user.ft_id)) {
			setBooleanButtonMakeAdmin(true);
		}
	}, [user, admins]);

	useEffect(() => {
		if (channelSelected) {
			ws.emit("getChannelAdmin", {
				channelId: channelInfo.id,
			});
		}
	}, [channelSelected]);

	let msg: any = [];
	return (
		<>
			{dataMessages.map((value: any, index: any) => {
				if (
					value.channelId !== channelSelected ||
					msg.find((x: any) => {
						return (
							x.date === value.date &&
							value.message === x.message &&
							value.user.ft_id === x.user.ft_id
						);
					})
				) {
					return;
				}
				msg.push(value);
				return (
					<div style={{ marginTop: "5%" }} key={index}>
						{value.user.ft_id !== user_id && (
							<div className={styles.chatAvatar}>
								<Avatar
									style={{ cursor: "pointer" }}
									className={styles.chatAvatar}
									name={value.user.username}
									size="25pt"
									round="30px"
									src={value.user.picture}
									onClick={() => {
										setUser(value.user);
										ws.emit("getChannelAdmin", {
											channelId: channelInfo.id,
										});
										setModalProfile(true);
									}}
								/>
							</div>
						)}
						<div
							style={{
								display: "flex",
								flexDirection: "column-reverse",
							}}
						>
							<span
								className={styles.singleMessage}
								style={{
									backgroundColor:
										value.user.ft_id === user_id ? "lightGreen" : "lightBlue",
									alignSelf:
										value.user.ft_id === user_id ? "flex-end" : "flex-start",
									borderRadius: "20px",
									padding: "5px 15px",
									maxWidth: "75%",
								}}
							>
								{userInfo.blocked.find(
									(bl: any) => bl.ft_id === value.user.ft_id
								)
									? "This user is blocked !"
									: value.message}
							</span>
						</div>
					</div>
				);
			})}
			{modalProfile && (
				<div>
					<Modal
						open={modalProfile}
						onClose={() => {
							setUser(undefined);
							setModalProfile(false);
						}}
					>
						<Box className={styles.boxModalProfile}>
							<Avatar
								style={{ margin: "2% 0 0 2%" }}
								className={styles.chatAvatar}
								name={user.username}
								size="7vw"
								round="5vh"
								src={user.picture}
							/>
							<div
								style={{
									margin: "-6% 0 0 20%",
									fontSize: "3vw",
								}}
							>
								{user.username}
							</div>
							<br />
							<Stack
								className={styles.boxButtonsOwner}
								spacing={15}
								direction="row"
							>
								{admins.find((e: any) => {
									return e.ft_id === userInfo.ft_id;
								}) && (
									<>
										<Button
											variant="contained"
											color={!booleanButtonMakeAdmin ? "error" : "success"}
											endIcon={<AdminPanelSettings />}
											onClick={() => {
												if (booleanButtonMakeAdmin) {
													ws.emit("makeAdmin", {
														user_id: user.ft_id,
														channel_id: channelSelected,
													});
												} else {
													ws.emit("removeAdmin", {
														user_id: user.ft_id,
														channel_id: channelSelected,
													});
												}

												setBooleanButtonMakeAdmin(!booleanButtonMakeAdmin);
											}}
										>
											{!booleanButtonMakeAdmin ? "Remove Admin" : "Make Admin"}
										</Button>
										<Button
											title="Mute"
											variant="contained"
											color="error"
											endIcon={<VolumeOff />}
											onClick={() => {
												if (!showDropdownMute) {
													setValueTimeMute(0);
												}
												setShowDropdownMute(!showDropdownMute);
											}}
										>
											Mute
										</Button>
										{showDropdownMute && (
											<Form.Control
												type="number"
												placeholder="Time staying banned (in seconds)"
												onChange={(e) =>
													setValueTimeMute(Number(e.target.value))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														ws.emit("mute", {
															user_id: user.ft_id,
															channel_id: channelSelected,
															endOfMute: new Date(
																new Date().getTime() + valueTimeMute * 1000
															),
														});
													}
												}}
												value={valueTimeMute}
												className={styles.dropdownButtonMute}
											/>
										)}
										<Button
											variant="contained"
											color="error"
											endIcon={<Block />}
											onClick={() => {
												if (!showDropdownBan) {
													setValueTimeBan(0);
												}
												setShowDropdownBan(!showDropdownBan);
											}}
										>
											Ban
										</Button>
										{showDropdownBan && (
											<Form.Control
												type="number"
												placeholder="Time staying banned (in seconds)"
												onChange={(e) =>
													setValueTimeBan(Number(e.target.value))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														ws.emit("ban", {
															user_id: user.ft_id,
															channel_id: channelSelected,
															endOfBan: new Date(
																new Date().getTime() + valueTimeBan * 1000
															),
														});
													}
												}}
												value={valueTimeBan}
												className={styles.dropdownButtonBan}
											/>
										)}
									</>
								)}
							</Stack>

							<Stack className={styles.boxButtons} spacing={15} direction="row">
								<Button
									variant="contained"
									onClick={() => {
										navigate("/Profile/" + user.ft_id);
									}}
									endIcon={<AccountCircle />}
								>
									Go to Profile
								</Button>
								<Button
									variant="contained"
									endIcon={<SportsEsports />}
									onClick={() => {
										ws.emit("duelProposal", {
											opponent_ft_id: user.ft_id,
											opponent_username: user.username,
										});
										setModalDuel(true);
									}}
								>
									Duel
								</Button>
								{modalDuel && (
									<div>
										<Modal
											open={modalDuel}
											onClose={(event, reason) => {
												if (reason && reason == "backdropClick") return;
												setModalDuel(false);
											}}
											disableEscapeKeyDown={true}
										>
											<Box className={styles.boxModalDuel}>
												<div className={styles.loader}></div>
												<div style={{ margin: "3% 0 0 35%" }}>
													Waiting for your opponent to accept ...
												</div>
												<Button
													style={{ margin: "5% 0 0 45%" }}
													variant="contained"
													color="error"
													onClick={() => {
														ws.emit("cancelDuelProposal");
														setModalDuel(false);
													}}
													endIcon={<Block />}
												>
													Cancel
												</Button>
											</Box>
										</Modal>
									</div>
								)}
							</Stack>
						</Box>
					</Modal>
				</div>
			)}
		</>
	);
}
