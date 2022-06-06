import styles from "../css/PlayGame.module.css";
import Button from "../components/Button";
import { useContext, useEffect, useState } from "react";
import { useStopwatch } from "react-timer-hook";

import Pong from "../image/Pong.png";
import { context } from "../App";
import { useNavigate } from "react-router";
import {
	Stack,
	Button as ButtonMui,
	Divider,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@mui/material";

export default function PlayGame() {
	const ws = useContext(context);
	const { seconds, minutes, start, reset } = useStopwatch({ autoStart: false });
	const [booleanButton, setBooleanButton] = useState(true);
	const [booleanButton2, setBooleanButton2] = useState(true);
	const [ball, setBall] = useState("");
	const [map, setMap] = useState("");
	const [ballUrl, setBallUrl] = useState("");
	const [mapUrl, setMapUrl] = useState("");
	const [userInfo, setUserInfo] = useState<any>();
	const navigate = useNavigate();

	const getUserInfo = async () => {
		const myData = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/me/",
			{
				credentials: "include",
			}
		);
		setUserInfo(await myData.json());
	};

	useEffect(() => {
		ws.on("gameFound", () => {
			navigate("/TheGame");
		});

		getUserInfo();
	}, []);

	useEffect(() => {
		if (userInfo) {
			setBallUrl(userInfo.ball);
			setMapUrl(userInfo.map);
		}
	}, [userInfo]);

	return (
		<>
			<div className={styles.Pong}>
				<img src={Pong} alt="" />
			</div>
			<div className={styles.game}>
				<div className={styles.Buttons}>
					<Button
						id={styles.queueUpButton}
						onClick={() => {
							if (booleanButton2) {
								if (booleanButton) {
									start();
									const queueTimer = document.getElementById(styles.timer);
									if (queueTimer) {
										queueTimer.style.opacity = "1";
									}
								} else {
									reset();
									const queueTimer = document.getElementById(styles.timer);
									if (queueTimer) {
										queueTimer.style.opacity = "0";
									}
								}
								if (booleanButton) {
									ws.emit("queue");
								} else {
									ws.emit("removeSocket");
								}

								setBooleanButton(!booleanButton);
							}
						}}
						text={booleanButton ? "Queue Up" : "Leave Queue"}
					/>
					<Button
						onClick={() => {
							if (booleanButton) {
								if (booleanButton2) {
									start();
									const queueTimer = document.getElementById(styles.timer);
									if (queueTimer) {
										queueTimer.style.opacity = "1";
									}
								} else {
									reset();
									const queueTimer = document.getElementById(styles.timer);
									if (queueTimer) {
										queueTimer.style.opacity = "0";
									}
								}
								if (booleanButton2) {
									ws.emit("queueSpectate");
								} else {
									ws.emit("removeSocket", { spectate: true });
								}
								setBooleanButton2(!booleanButton2);
							}
						}}
						text={booleanButton2 ? "Spectate" : "Cancel"}
					/>
				</div>
				<div>
					<div id={styles.timer}>
						<span>{minutes}</span> : <span>{seconds}</span>
					</div>
				</div>
				<div className={styles.customization}>
					<Stack spacing={6} className={styles.stackButton}>
						<h1
							style={{
								fontSize: "1.5vw",
								fontWeight: "Bold",
								textDecoration: "underline overline",
								alignSelf: "center",
							}}
						>
							Customize
						</h1>
						<FormControl
							style={{ backgroundColor: "darkgrey", borderRadius: "0.2vw" }}
							fullWidth
						>
							<InputLabel>Ball Type</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								value={ball}
								label="Ball Type"
								onChange={(e) => {
									setBall(e.target.value);
								}}
							>
								<MenuItem
									value={ball}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setBall",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://www.pngmart.com/files/21/Football-PNG-Isolated-HD.png",
												}),
											}
										);
										getUserInfo();
									}}
								>
									FootBall
								</MenuItem>
								<MenuItem
									value={ball}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setBall",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://cdn.pixabay.com/photo/2019/11/05/21/32/ball-4604616_1280.png",
												}),
											}
										);
										getUserInfo();
									}}
								>
									VolleyBall
								</MenuItem>
								<MenuItem
									value={ball}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setBall",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Basketball_Clipart.svg/768px-Basketball_Clipart.svg.png",
												}),
											}
										);
										getUserInfo();
									}}
								>
									BasketBall
								</MenuItem>
								<MenuItem
									value={ball}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setBall",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "",
												}),
											}
										);
										getUserInfo();
									}}
								>
									Normal
								</MenuItem>
							</Select>
							<div
								id="ball"
								style={{
									content: "url(" + ballUrl + ")",
								}}
								className={styles.ball}
							></div>
						</FormControl>
						<FormControl
							style={{ backgroundColor: "darkgrey", borderRadius: "0.2vw" }}
							fullWidth
						>
							<InputLabel>Map Style</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								value={map}
								label="Map Type"
								onChange={(e) => {
									setMap(e.target.value);
								}}
							>
								<MenuItem
									value={map}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setMap",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://imgs.search.brave.com/kpKdEplHVzxISeFCc8sdntHirpex89lf-l2CwNciQro/rs:fit:1200:675:1/g:ce/aHR0cDovL3d3dy5j/b25jZXB0ZHJhdy5j/b20vSG93LVRvLUd1/aWRlL3BpY3R1cmUv/U3BvcnQtQmFza2V0/YmFsbC1jb3VydC1j/b2xvci1UZW1wbGF0/ZS5wbmc",
												}),
											}
										);
										getUserInfo();
									}}
								>
									BasketBall
								</MenuItem>
								<MenuItem
									value={map}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setMap",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://media1.thehungryjpeg.com/thumbs2/ori_3607477_n0uvrq0vuyn9ppdsdlr6u18hddmgbm3tkdur2w2u_sea-beach-landscape-cartoon-summer-sunny-day-ocean-view-horizontal-p.jpg",
												}),
											}
										);
										getUserInfo();
									}}
								>
									Beach
								</MenuItem>
								<MenuItem
									value={map}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setMap",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "https://imgs.search.brave.com/sFDGCuAEpBaFWOMKRSaFMxJC1o7TSjWjjf5RDidUZ34/rs:fit:852:480:1/g:ce/aHR0cHM6Ly9hazYu/cGljZG4ubmV0L3No/dXR0ZXJzdG9jay92/aWRlb3MvMTQyMjc5/MTYvdGh1bWIvMS5q/cGc",
												}),
											}
										);
										getUserInfo();
									}}
								>
									SynthWave
								</MenuItem>
								<MenuItem
									value={map}
									onClick={async () => {
										await fetch(
											process.env.REACT_APP_BACK_URL +
												":" +
												process.env.REACT_APP_BACK_PORT +
												"/user/" +
												(await userInfo.ft_id) +
												"/setMap",
											{
												headers: { "Content-Type": "application/json" },
												method: "POST",
												body: JSON.stringify({
													link: "",
												}),
											}
										);
										getUserInfo();
									}}
								>
									Normal
								</MenuItem>
							</Select>
							<div
								id="map"
								style={{
									content: "url(" + mapUrl + ")",
								}}
								className={styles.map}
							></div>
						</FormControl>
					</Stack>
				</div>
			</div>
		</>
	);
}
