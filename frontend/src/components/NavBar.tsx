import { Link } from "react-router-dom";
import styles from "../css/NavBar.module.css";

export default function NavBar() {
	return (
		<div className={styles.Container}>
			<div className={styles.PlayGame}>
				<Link to="/PlayGame">PLAY GAME</Link>
				<hr className={styles.LongHR} />
			</div>
			<div className={styles.MiddleNavBar}>
				<div>
					<Link to="/Profile">PROFILE</Link>
					<hr />
				</div>
				<div>
					<Link to="/Leaderboard">LEADERBOARD</Link>
					<hr />
				</div>
				<div>
					<Link to="/Friendlist">FRIENDLIST</Link>
					<hr />
				</div>
				<div>
					<Link to="/Chat">CHAT</Link>
					<hr />
				</div>
			</div>
			<div className={styles.Settings}>
				<hr className={styles.LongHR} />
				<Link to="/Settings">SETTINGS</Link>
			</div>
		</div>
	);
}
