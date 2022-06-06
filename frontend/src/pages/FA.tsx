import Cookies from "js-cookie";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { context } from "../App";

import styles from "../css/FA.module.css";

interface Props {
	ready: boolean;
}

export default function FA(props: Props) {
	const [code, setCode] = useState("");
	const flag = useRef({ ini: 1 });
	const navigate = useNavigate();
	const ws = useContext(context);

	useEffect(() => {
		if (Cookies.get("token") === undefined) {
			navigate("/Login");
		} else if (
			!sessionStorage.getItem("2FA") &&
			!sessionStorage.getItem("JustLoged")
		) {
			navigate("/Profile");
		}
		if (props.ready && flag.current.ini === 1) {
			ws.emit("ask2FA");
			ws.on("check2FA", (data: boolean) => {
				if (data) {
					sessionStorage.removeItem("2FA");
					sessionStorage.removeItem("JustLoged");
					setCode("");
					navigate("/Profile");
				} else {
					setCode("");
					alert("Invalid code");
				}
			});
			flag.current.ini = 0;
		}
	}, []);

	return (
		<>
			{props.ready && (
				<div className={styles.Container}>
					<div className={styles.Title}>
						<h1>Two-Factor Authentication</h1>
					</div>
					<div className={styles.Content}>
						<div className={styles.Text}>
							<p>Please enter the code sent to your email address.</p>
						</div>
						<div className={styles.Input}>
							<input
								type="text"
								placeholder="Code"
								value={code}
								onChange={(e) => {
									setCode(e.target.value);
								}}
							/>
						</div>
						<div className={styles.Button}>
							<button
								onClick={() => {
									ws.emit("check2FA", {
										code: code,
									});
								}}
							>
								Submit
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
