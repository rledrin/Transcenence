import styles from "../../css/Profile.module.css";
import { Link } from "react-router-dom";

export default function profiles({ Data, myData }: any) {
	return <div id={styles.profile}>{Item(Data, myData)}</div>;
}

function Item(data: any[], myData: any) {
	return (
		<div style={{ overflowY: "scroll", maxHeight: "41vh" }}>
			{data.map((value, index) => {
				let color;
				if (value.status === "Online") color = "green";
				else if (value.status === "Offline") color = "red";
				else if (value.status === "InGame") color = "orange";
				return (
					<div className={styles.flex} key={index}>
						<div />
						<div className={styles.item}>
							<img src={value.picture} alt="" />

							<div className={styles.info}>
								<Link to={"/Profile/" + value.ft_id}>
									<h3 className={`${styles.name} ${styles.textDark}`}>
										{value.username}
									</h3>
								</Link>
								<span style={{ color: color }}>{value.status}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
