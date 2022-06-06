import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import styles from "../css/Login.module.css";

export default function Login() {
	const navigate = useNavigate();

	if (
		Cookies.get("token") !== undefined &&
		sessionStorage.getItem("2FA") === "true"
	) {
		navigate("/2FA");
	} else if (Cookies.get("token") !== undefined) {
		navigate("/Profile");
	}

	return (
		<div>
			<a
				href={
					process.env.REACT_APP_BACK_URL +
					":" +
					process.env.REACT_APP_BACK_PORT +
					"/login/42"
				}
			>
				<button className={styles.button}>
					<span>Log 42 </span>
				</button>
			</a>
		</div>
	);
}
