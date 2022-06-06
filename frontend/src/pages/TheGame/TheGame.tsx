import styles from "../../css/TheGame.module.css";
import * as React from "react";
import Modal from "@mui/material/Modal";
import "animate.css";
import ProgressBar from "react-animated-progress-bar";
import { PieChart } from "react-minimal-pie-chart";
import { context } from "../../App";
import { useNavigate } from "react-router";

export default function TheGame() {
	const navigate = useNavigate();
	const [open, setOpen] = React.useState(false);
	const handleClose = () => {
		setOpen(false);
		navigate("/Profile");
	};
	const [open1, setOpen1] = React.useState(false);
	const handleClose1 = () => {
		setOpen1(false);
		navigate("/Profile");
	};
	const [open2, setOpen2] = React.useState(false);
	const [numberCountdown, setNumberCountdown] = React.useState(3);

	const [userInfo, setUserInfo] = React.useState<any>({
		lvl: 101,
		win: 1,
		lose: 1,
	});
	const [lvl, setLvl] = React.useState(0);

	const [usernames, setUsernames] = React.useState({ p1: "", p2: "" });
	const [score, setScore] = React.useState({ p1: 0, p2: 0 });
	const flagReadyOnetimeOnly = React.useRef<any>({ ini: 1 });
	const roomCode = React.useRef("");

	const ws = React.useContext(context);

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

	const getLevel = async () => {
		const myData = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/me/",
			{
				credentials: "include",
			}
		);
		const data = await myData.json();
		setLvl(data.lvl);
	};

	React.useEffect(() => {
		console.log(lvl);
	}, [lvl]);

	React.useEffect(() => {
		if (flagReadyOnetimeOnly.current.ini) {
			var up = false;
			var down = false;
			const timeout = setTimeout(() => {
				navigate("/Profile");
			}, 300);
			const intervale = setInterval(() => {
				if (up) {
					ws.emit("move", { room: roomCode.current, direction: -1 });
				} else if (down) {
					ws.emit("move", { room: roomCode.current, direction: 1 });
				}
			}, 1000 / 60);
			ws.emit("ready");
			ws.on(
				"room",
				(data: { code: string; p1Username: string; p2Username: string }) => {
					clearTimeout(timeout);
					roomCode.current = data.code;
					setUsernames({ p1: data.p1Username, p2: data.p2Username });
				}
			);
			ws.on("score", (data: { p1: number; p2: number }) => {
				setScore({ p1: data.p1, p2: data.p2 });
				document
					.getElementById("containerGame")
					?.classList.toggle(styles.clignoter);

				setTimeout(() => {
					document
						.getElementById("containerGame")
						?.classList.toggle(styles.clignoter);
				}, 1500);
			});
			ws.on("ball", (data: { x: number; y: number }) => {
				const ball = document.getElementById("ball");
				if (ball) {
					ball.style.top = data.y + "%";
					ball.style.left = data.x + "%";
				}
			});
			ws.on("win", (data: any) => {
				clearInterval(intervale);
				setOpen(true);
				getUserInfo();
				getLevel();
			});
			ws.on("lose", (data: any) => {
				clearInterval(intervale);
				setOpen1(true);
				getUserInfo();
				getLevel();
			});
			ws.on("stop", (data: any) => {
				clearInterval(intervale);
				navigate("/PlayGame");
			});
			ws.on("ready", (data: any) => {
				setOpen2(false);
				ws.emit("start");
			});
			ws.on("player", (data: { p1: number; p2: number }) => {
				const p1 = document.getElementById("leftPaddle");
				const p2 = document.getElementById("rightPaddle");
				if (p1) {
					p1.style.top = data.p1 + "%";
				}
				if (p2) {
					p2.style.top = data.p2 + "%";
				}
			});
			ws.on("countdown", (data: number) => {
				setOpen2(true);
				setNumberCountdown(data);
			});
			document.addEventListener("keydown", (e) => {
				if (e.key === "ArrowUp") {
					up = true;
				} else if (e.key === "ArrowDown") {
					down = true;
				}
			});
			document.addEventListener("keyup", (e) => {
				if (e.key === "ArrowUp") {
					up = false;
				} else if (e.key === "ArrowDown") {
					down = false;
				}
			});

			getUserInfo();
			flagReadyOnetimeOnly.current = {};
		}
	}, []);

	return (
		<div className={styles.page}>
			<Modal open={open} onClose={handleClose}>
				<div className={styles.endscreen}>
					<div
						className={`${styles.endscreenMessage} animate__animated animate__zoomInUp`}
						style={{ color: "gold" }}
					>
						Victory !
					</div>
					<div className={styles.endscreenStats}>
						<div className={styles.stats}>STATS</div>
						{lvl !== 0 && (
							<>
								<div className={styles.level}>
									<ProgressBar
										// trackWidth="0.5vh"
										width="100%"
										height="3vh"
										rect
										fontColor="white"
										percentage={(lvl % 100).toString()}
										rectPadding="0.1vh"
										rectBorderRadius="2vh"
										trackPathColor="transparent"
										bgColor="#333333"
										trackBorderColor="white"
									/>
								</div>
								<div className={styles.fromlevel}>
									From Level {Math.floor(lvl / 100) + 1}
								</div>
							</>
						)}
						<div className={styles.ratioWinLoose}>
							<PieChart
								lineWidth={60}
								label={({ dataEntry }) =>
									Math.round(dataEntry.percentage) + "%"
								}
								labelPosition={100 - 60 / 2}
								labelStyle={{
									fill: "#fff",
									opacity: 0.75,
									pointerEvents: "none",
								}}
								data={[
									{ title: "Win", value: userInfo.win, color: "green" },
									{ title: "Lose", value: userInfo.lose, color: "red" },
								]}
							/>
						</div>
						<div className={styles.ratioWinLoosePhrase}>
							{" <= Ratio Win/Loose "}
						</div>
					</div>
				</div>
			</Modal>
			<Modal open={open1} onClose={handleClose1}>
				<div className={styles.endscreen}>
					<div
						className={`${styles.endscreenMessage} animate__animated animate__hinge ${styles.defeat}`}
						style={{ color: "red" }}
					>
						Defeat ...
					</div>
					<div className={styles.endscreenStats}>
						<div className={styles.stats}>STATS</div>
						{lvl !== 0 && (
							<>
								<div className={styles.level}>
									<ProgressBar
										// trackWidth="0.5vh"
										width="100%"
										height="3vh"
										rect
										fontColor="white"
										percentage={(lvl % 100).toString()}
										rectPadding="0.1vh"
										rectBorderRadius="2vh"
										trackPathColor="transparent"
										bgColor="#333333"
										trackBorderColor="white"
									/>
								</div>
								<div className={styles.fromlevel}>
									From Level {Math.floor(lvl / 100) + 1}
								</div>
							</>
						)}
						<div className={styles.ratioWinLoose}>
							<PieChart
								lineWidth={60}
								label={({ dataEntry }) =>
									Math.round(dataEntry.percentage) + "%"
								}
								labelPosition={100 - 60 / 2}
								labelStyle={{
									fill: "#fff",
									opacity: 0.75,
									pointerEvents: "none",
								}}
								data={[
									{ title: "Win", value: userInfo.win, color: "green" },
									{ title: "Lose", value: userInfo.lose, color: "red" },
								]}
							/>
						</div>
						<div className={styles.ratioWinLoosePhrase}>
							{" <= Ratio Win/Loose "}
						</div>
					</div>
				</div>
			</Modal>
			<Modal disableEscapeKeyDown open={open2}>
				<div className={styles.endscreen}>
					<div className={styles.endscreenCountdown}>{numberCountdown}</div>
				</div>
			</Modal>
			{userInfo && (
				<div
					className={styles.containerGame}
					id="containerGame"
					style={{
						backgroundImage: "url(" + userInfo.map + ")",
					}}
				>
					<div className={styles.score}>
						<div id="leftScore">{score.p1}</div>
						<div id="rightScore">{score.p2}</div>
					</div>
					<div className={`${styles.names} ${styles.leftName}`}>
						{usernames.p1}
					</div>
					<div className={`${styles.names} ${styles.rightName}`}>
						{usernames.p2}
					</div>
					<div
						id="ball"
						className={styles.ball}
						style={{ content: "url(" + userInfo.ball + ")" }}
					/>
					<div
						id="leftPaddle"
						className={`${styles.paddle} ${styles.leftPaddle}`}
					></div>
					<div
						id="rightPaddle"
						className={`${styles.paddle} ${styles.rightPaddle}`}
					></div>
				</div>
			)}
		</div>
	);
}
