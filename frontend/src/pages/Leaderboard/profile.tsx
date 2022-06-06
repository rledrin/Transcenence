import styles from "../../css/Leaderboard.module.css";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { context } from "../../App";

export default function profiles({ Leaderboard }: any) {
	return <div id={styles.profile}>{Item(Leaderboard)}</div>;
}

function Item(data: any[]) {
	const [status, setStatus] = useState<any>([]);
	const ws = useContext(context);

	useEffect(() => {
		let tmpStatus: any = [];
		data.forEach((item: any) => {
			tmpStatus.push(item.status);
		});
		setStatus(tmpStatus);
		ws.on("status", (d: any) => {
			if (data.find((x: any) => x.ft_id === d.ft_id)) {
				setStatus((status: any) => {
					let tmp = status.slice();
					tmp[data.findIndex((x: any) => x.ft_id === d.ft_id)] = d.status;
					return tmp;
				});
			}
		});
	}, [data]);

	return (
		<>
			{data.map((value, index) => {
				let color;
				if (value.status === "Online") color = "green";
				else if (value.status === "Offline") color = "red";
				else if (value.status === "InGame") color = "orange";
				return (
					<div className={styles.flex} key={index}>
						<div className={styles.item}>
							<img src={value.picture} alt="" />

							<div className={styles.info}>
								<Link to={"/Profile/" + value.ft_id}>
									<h3 className={`${styles.name} ${styles.textDark}`}>
										{value.username}
									</h3>
								</Link>
							</div>
							<div className={styles.status} style={{ color: color }}>
								<span>{status[index]}</span>
							</div>

							<div className={styles.elo}>
								<span>Elo: {value.elo}</span>
							</div>
							<div className={styles.rank}>
								<span>Rank: {index + 1}</span>
							</div>
						</div>
					</div>
				);
			})}
		</>
	);
}
