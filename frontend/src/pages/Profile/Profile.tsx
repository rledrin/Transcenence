import { useContext, useEffect, useState } from "react";
import styles from "../../css/Profile.module.css";
import Button from "../../components/Button";
import TextField from "@mui/material/TextField";
import ButtonMui from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCirclePlus,
	faMessage,
	faBan,
} from "@fortawesome/free-solid-svg-icons";

import ProgressBar from "react-animated-progress-bar";
import { PieChart } from "react-minimal-pie-chart";

import Profiles from "./Users";
import { useNavigate, useParams } from "react-router";
import { context } from "../../App";
import { Link } from "react-router-dom";

interface OtherUser {
	ft_id: number;
	username: string;
	status: string;
	friend: boolean;
	blocked: boolean;
	picture: string;
}

interface User {
	ft_id: number;
	username: string;
	status: string;
	friends: any[];
	blocked: any[];
	picture: string;
	win: number;
	lose: number;
	currentLevel: number;
	nextLevel: number;
	levelProgress: number;
	elo: number;
}

export default function Profile() {
	const aVar: any = [{}];
	const [inputText, setInputText] = useState("");
	const [status, setStatus] = useState("");
	const [showButtonModifyProfile, setShowButtonModifyProfile] = useState(false);
	const [showModalModifyProfile, setShowModalModifyProfile] = useState(false);
	const [changeAvatarUrl, setChangeAvatarUrl] = useState("");
	const [changeProfileUsername, setChangeProfileUsername] = useState("");
	const [rank, setRank] = useState<any>();
	const ws = useContext(context);
	const navigate = useNavigate();

	const [myData, setMyData] = useState<User>({
		ft_id: 0,
		username: "",
		status: "",
		friends: [],
		blocked: [],
		picture: "",
		win: 0,
		lose: 0,
		currentLevel: 0,
		nextLevel: 1,
		levelProgress: 0,
		elo: 1000,
	});
	const [userData, setUserData] = useState<User>({
		ft_id: 0,
		username: "",
		status: "",
		friends: [],
		blocked: [],
		picture: "",
		win: 0,
		lose: 0,
		currentLevel: 0,
		nextLevel: 1,
		levelProgress: 0,
		elo: 1000,
	});

	const [history, setHistory] = useState<any>();

	const [users, setUsers] = useState(aVar);
	const [addFriend, setAddFriend] = useState(true);
	const [blockedUser, setBlockedUser] = useState(true);

	let inputHandler = (e: any) => {
		var lowerCase = e.target.value.toLowerCase();
		setInputText(lowerCase);
	};

	const getMyData = async () => {
		const rawData = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/me/",
			{
				credentials: "include",
			}
		);

		const data = await rawData.json();
		const user: User = {
			ft_id: data.ft_id,
			username: data.username,
			status: data.status,
			friends: data.friends,
			blocked: data.blocked,
			picture: data.picture,
			win: data.win,
			lose: data.lose,
			currentLevel: Math.floor(data.lvl / 100),
			nextLevel: Math.floor(data.lvl / 100 + 1),
			levelProgress: data.lvl % 100,
			elo: data.elo,
		};
		setMyData(user);
	};

	const filteredData = users.filter((el: any) => {
		if (el.ft_id !== myData.ft_id && el.ft_id !== userData.ft_id) {
			const friend = userData.friends
				? userData.friends.includes(el.ft_id)
				: false;
			const block = userData.blocked
				? userData.blocked.includes(el.ft_id)
				: false;
			let otherUser: OtherUser = {
				username: el.username,
				status: el.status,
				friend: friend,
				blocked: block,
				picture: el.picture,
				ft_id: el.ft_id,
			};
			if (inputText === "") {
				return otherUser;
			} else {
				if (el.username.toLowerCase().includes(inputText)) {
					return otherUser;
				}
			}
		}
	});

	const getData = async (id?: number) => {
		let link =
			process.env.REACT_APP_BACK_URL +
			":" +
			process.env.REACT_APP_BACK_PORT +
			"/user/";
		link += id ? id : "me";
		const rawData = await fetch(link, {
			credentials: "include",
		});

		const data = await rawData.json();
		const user: User = {
			ft_id: data.ft_id,
			username: data.username,
			status: data.status,
			friends: data.friends,
			blocked: data.blocked,
			picture: data.picture,
			win: data.win,
			lose: data.lose,
			currentLevel: Math.floor(data.lvl / 100),
			nextLevel: Math.floor(data.lvl / 100 + 1),
			levelProgress: data.lvl % 100,
			elo: data.elo,
		};
		setStatus(data.status);
		setUserData(user);
		link =
			process.env.REACT_APP_BACK_URL +
			":" +
			process.env.REACT_APP_BACK_PORT +
			"/user/";
		const rawData2 = await fetch(link, {
			credentials: "include", //this is what I need to tell the browser to include cookies
		});
		const data2 = await rawData2.json();
		setUsers(data2);
		getMyData();
	};

	const getRank = async () => {
		const rawData = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/",
			{
				credentials: "include",
			}
		);
		const data = await rawData.json();
		data.sort((a: { elo: number }, b: { elo: number }) => {
			return b.elo - a.elo;
		});
		data.forEach((item: any, indice: any) => {
			if (item.ft_id === userData.ft_id) {
				setRank(indice + 1);
			}
		});
	};

	useEffect(() => {
		if (sessionStorage.getItem("JustLoged")) {
			sessionStorage.removeItem("JustLoged");
		}
	}, []);

	const { id } = useParams();
	useEffect(() => {
		getData(Number(id));
	}, [id]);

	useEffect(() => {
		getRank();
		ws.on("status", (data: any) => {
			if (userData && userData.ft_id && data.ft_id === userData.ft_id) {
				setStatus(data.status);
			}
		});
	}, [userData]);

	useEffect(() => {
		setAddFriend(
			myData.friends && myData.friends.length > 0
				? !myData.friends.find((u: any) => u.ft_id === userData.ft_id)
				: true
		);
		setBlockedUser(
			myData.blocked && myData.blocked.length > 0
				? !myData.blocked.find((u: any) => u.ft_id === userData.ft_id)
				: true
		);
		if (userData && userData.ft_id) {
			const getHistory = async () => {
				const rawData = await fetch(
					process.env.REACT_APP_BACK_URL +
						":" +
						process.env.REACT_APP_BACK_PORT +
						"/user/" +
						userData.ft_id +
						"/getHistory"
				);
				const data = await rawData.json();
				data.reverse();
				setHistory(data);
			};
			getHistory();
		}
	}, [myData]);

	let color;
	if (status === "Online") color = "green";
	else if (status === "Offline") color = "red";
	else if (status === "InGame") color = "orange";

	return (
		<div className={styles.Container}>
			<div className={styles.Header}>
				<img
					onMouseEnter={() => {
						if (myData.ft_id === userData.ft_id) {
							setShowButtonModifyProfile(true);
						}
					}}
					onMouseLeave={() => setShowButtonModifyProfile(false)}
					src={userData.picture}
					alt="profile"
				/>
				{showButtonModifyProfile && (
					<ButtonMui
						variant="contained"
						className={styles.buttonModifyProfile}
						onMouseEnter={() => setShowButtonModifyProfile(true)}
						onMouseLeave={() => setShowButtonModifyProfile(false)}
						onClick={() => setShowModalModifyProfile(true)}
					>
						Modify Profile
					</ButtonMui>
				)}
				<Modal
					open={showModalModifyProfile}
					onClose={() => {
						setShowModalModifyProfile(false);
					}}
				>
					<Box className={styles.boxModalModifyProfile}>
						<Stack spacing={5} style={{ margin: "5% 0 0 22%" }}>
							<TextField
								label="Change profile picture with URL ..."
								variant="outlined"
								className={styles.textFieldModalModifyProfile}
								onChange={(e) => {
									setChangeAvatarUrl(e.target.value);
								}}
							/>
							<ButtonMui
								variant="contained"
								color="success"
								style={{ width: "10%", margin: "4% 0 0 30%" }}
								onClick={async () => {
									const rawData = await fetch(
										process.env.REACT_APP_BACK_URL +
											":" +
											process.env.REACT_APP_BACK_PORT +
											"/user/" +
											myData.ft_id +
											"/setPicture",
										{
											credentials: "include",
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ link: changeAvatarUrl }),
										}
									);
									getData();
								}}
							>
								Modify
							</ButtonMui>
							<TextField
								label="Change profile name ..."
								variant="outlined"
								className={styles.textFieldModalModifyProfile}
								onChange={(e) => {
									setChangeProfileUsername(e.target.value);
								}}
							/>
							<ButtonMui
								variant="contained"
								color="success"
								style={{ width: "10%", margin: "4% 0 0 30%" }}
								onClick={async () => {
									const rawData = await fetch(
										process.env.REACT_APP_BACK_URL +
											":" +
											process.env.REACT_APP_BACK_PORT +
											"/user/" +
											myData.ft_id +
											"/setUsername/" +
											changeProfileUsername,
										{
											credentials: "include",
											method: "POST",
										}
									);
									const data = await rawData.json();
									if (data && data.success === true) {
										getData();
									} else {
										alert("Username already taken");
									}
								}}
							>
								Modify
							</ButtonMui>
						</Stack>
					</Box>
				</Modal>
				<div className={styles.Infos}>
					<div>
						<h1>{userData.username}</h1>
						<div className={styles.Status}>
							<h2>Status: </h2>
							<h2 style={{ color: color }}>{status}</h2>
						</div>
					</div>
				</div>
				<div className={styles.Stats}>
					<div className={styles.Rank}>
						<h2>
							Rank: {rank} {rank === 1 ? "er " : "ème"}
						</h2>
					</div>

					<div className={styles.Divider} />

					<div className={styles.LevelProgress}>
						{userData && userData.levelProgress && (
							<ProgressBar
								className={styles.Level}
								width="15vw"
								height="2vh"
								rect
								fontColor="gray"
								percentage={userData.levelProgress.toString()}
								rectPadding="0"
								rectBorderRadius="20px"
								trackPathColor="transparent"
								bgColor="#333333"
								trackBorderColor="grey"
							/>
						)}
						<div className={styles.fromLevel}>
							From Level : {userData.nextLevel}
						</div>
					</div>

					<div className={styles.Divider2} />

					<div className={styles.Ratio}>
						<PieChart
							lineWidth={60}
							label={({ dataEntry }) => Math.round(dataEntry.percentage) + "%"}
							labelPosition={100 - 60 / 2}
							labelStyle={{
								fill: "#fff",
								opacity: 0.75,
								pointerEvents: "none",
							}}
							data={[
								{ title: "Win", value: userData.win, color: "green" },
								{ title: "Lose", value: userData.lose, color: "red" },
							]}
						/>
					</div>
				</div>
			</div>
			<div className={styles.BodyContent}>
				{id && (
					<div className={styles.Buttons}>
						<div>
							<Button
								text={addFriend ? " Add user" : " Remove user"}
								onClick={() => {
									const addOrRemove = addFriend
										? "/addFriend/"
										: "/removeFriend/";
									fetch(
										process.env.REACT_APP_BACK_URL +
											":" +
											process.env.REACT_APP_BACK_PORT +
											"/user/" +
											myData.ft_id +
											addOrRemove +
											id,
										{
											credentials: "include",
										}
									);
									setAddFriend(!addFriend);
								}}
							>
								<FontAwesomeIcon icon={faCirclePlus} />
							</Button>
						</div>
						<div>
							<Button
								text="Chat"
								onClick={() => {
									ws.emit("createDm", { ft_id: userData.ft_id });
									navigate("/Chat");
								}}
							>
								<FontAwesomeIcon icon={faMessage} />
							</Button>
						</div>
						<div>
							<Button
								text={blockedUser ? " Block user" : " Unblock user"}
								onClick={() => {
									const blockOrUnblock = blockedUser
										? "/blockUser/"
										: "/unblockUser/";
									fetch(
										process.env.REACT_APP_BACK_URL +
											":" +
											process.env.REACT_APP_BACK_PORT +
											"/user/" +
											myData.ft_id +
											blockOrUnblock +
											id,
										{
											credentials: "include",
										}
									);
									setBlockedUser(!blockedUser);
								}}
							>
								<FontAwesomeIcon icon={faBan} />
							</Button>
						</div>
					</div>
				)}
				<div className={styles.ProfileInfo}>
					{history && (
						<div
							className={styles.MatchHistory}
							style={{ flexDirection: "column-reverse" }}
						>
							{history.map((item: any, index: any) => {
								let other: any;
								let myscore = "";
								let otherscore = "";
								let cl: any;
								if (item.winner.ft_id === userData.ft_id) {
									other = item.looser;
									myscore = item.winner_score;
									otherscore = item.looser_score;
									cl = styles.gameWin;
								} else {
									cl = styles.gameLoose;
									other = item.winner;
									myscore = item.looser_score;
									otherscore = item.winner_score;
								}
								return (
									<div
										key={index}
										style={{
											flexDirection: "column",
											display: "flex",
										}}
										className={cl}
									>
										<Link
											to={"/Profile/" + other.ft_id}
											className={styles.linkToProfileHistory}
										>
											<div style={{ alignSelf: "flex-start" }}>
												{other.username}
											</div>
										</Link>
										<div style={{ alignSelf: "flex-end" }}>
											{myscore} : {otherscore}
										</div>
									</div>
								);
							})}
						</div>
					)}

					<div className={styles.SearchBar}>
						<TextField
							className={styles.Search}
							variant="outlined"
							fullWidth
							label="Search"
							onChange={inputHandler}
						/>
						<Profiles Data={filteredData} myData={myData} />
					</div>
				</div>
			</div>
		</div>
	);
}
