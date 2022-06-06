import Cookies from "js-cookie";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { context } from "../App";
import styles from "../css/Settings.module.css";

export default function Settings() {
	const navigate = useNavigate();
	const [dfa, setDfa] = useState(false);
	const flag = useRef({ ini: 1 });
	const ws = useContext(context);

	useEffect(() => {
		if (flag.current.ini === 1) {
			ws.emit("GetUserData");
			ws.on("userData", (data: any) => {
				setDfa(data.dfa);
			});
			flag.current.ini = 0;
		}
	}, []);

	return (
		<div className={styles.Container}>
			<button
				className={`${styles.button} ${styles.left}`}
				onClick={() => {
					Cookies.remove("token");
					navigate("/Login");
				}}
			>
				<span>Log out</span>
			</button>
			<button
				className={`${styles.button} ${styles.right}`}
				onClick={() => {
					ws.emit("2FA");
					setDfa(!dfa);
				}}
			>
				<span>{dfa ? "Disable 2FA" : "Enable 2FA"}</span>
			</button>
		</div>
	);
}
