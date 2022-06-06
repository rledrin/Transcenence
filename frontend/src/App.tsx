import {
	Routes,
	Route,
	BrowserRouter,
	Outlet,
	Navigate,
	useLocation,
} from "react-router-dom";
import Chat from "./pages/Chat/Chat";
import Profile from "./pages/Profile/Profile";
import Friendlist from "./pages/Friendlist/Friendlist";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Login from "./pages/Login";
import PlayGame from "./pages/PlayGame";
import Settings from "./pages/Settings";
import NavBar from "./components/NavBar";
import ModalDuelAccept from "./components/modalDuelAccept";
import Cookies from "js-cookie";
import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import TheGame from "./pages/TheGame/TheGame";
import FA from "./pages/FA";

let tet: any;

export const context = createContext(tet);

function App() {
	const p = { ini: 1 };

	const [userInfo, setUserInfo] = useState<any>();
	const [openModalDuel, setOpenModalDuel] = useState(false);
	const [ws, setWs] = useState<any>(p);
	const [ready, setReady] = useState(false);

	const ProtectedRoutes = () => {
		return (
			<>
				{Cookies.get("token") !== undefined ? (
					<Outlet />
				) : (
					<Navigate replace to="/Login" />
				)}
			</>
		);
	};
	const DefaultRoutes = () => {
		const location = useLocation();
		const displayNav =
			location.pathname.toLowerCase() !== "/thegame" &&
			Cookies.get("token") &&
			!sessionStorage.getItem("2FA")
				? true
				: false;
		return (
			<div>
				{displayNav && <NavBar />}
				<Routes>
					<Route path="/" element={<ProtectedRoutes />}>
						<Route path="/2FA" element={<FA ready={ready} />} />
						{ready && !sessionStorage.getItem("2FA") && (
							<>
								<Route path="/PlayGame" element={<PlayGame />} />
								<Route path="/TheGame" element={<TheGame />} />
								<Route path="/Profile" element={<Profile />} />
								<Route path="/Profile/:id" element={<Profile />} />
								<Route path="/Leaderboard" element={<Leaderboard />} />
								<Route path="/Friendlist" element={<Friendlist />} />
								<Route path="/Chat" element={<Chat />} />
								<Route path="/Settings" element={<Settings />} />
								<Route path="/" element={<Navigate replace to="/Profile" />} />
								<Route path="/2FA" element={<Navigate replace to="/2FA" />} />
								<Route path="*" element={<div>404 Not Found</div>} />
							</>
						)}
						{sessionStorage.getItem("2FA") === "true" && (
							<Route path="*" element={<Navigate to="/2FA" />} />
						)}
						{!Cookies.get("token") && (
							<Route path="*" element={<Navigate to="/Login" />} />
						)}
					</Route>
				</Routes>
			</div>
		);
	};
	// get the jwt token from the url and put it into a cookie
	if (Cookies.get("token") === undefined) {
		const params = new URLSearchParams(window.location.search);
		const paramValue = params.get("code");
		if (paramValue !== null) {
			Cookies.set("token", paramValue, { expires: 1 });
			sessionStorage.setItem("JustLoged", "true");
			if (window.location.pathname.includes("2FA")) {
				sessionStorage.setItem("2FA", "true");
			}
			window.location.href = window.location.href.split("?")[0];
		}
	}

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
		myData
			.json()
			.then((data) => {
				setUserInfo(data);
			})
			.catch((err) => {});
	};

	useEffect(() => {
		if (userInfo && userInfo.ft_id && ws.ini) {
			setWs(
				io(
					process.env.REACT_APP_BACK_URL +
						":" +
						process.env.REACT_APP_BACK_PORT +
						"?ft_id=" +
						userInfo.ft_id
				)
			);
		}
	}, [userInfo]);

	useEffect(() => {
		if (!ws.ini) {
			setReady(true);
		}
	}, [ws]);

	useEffect(() => {
		if (Cookies.get("token") !== undefined) {
			getUserInfo();
		}
	}, []);

	return (
		<>
			<BrowserRouter>
				<context.Provider value={ws}>
					{ready && (
						<ModalDuelAccept setOpen={setOpenModalDuel} open={openModalDuel} />
					)}
					<Routes>
						<Route path="/Login" element={<Login />} />
						<Route path="*" element={<DefaultRoutes />} />
					</Routes>
				</context.Provider>
			</BrowserRouter>
		</>
	);
}

export default App;
