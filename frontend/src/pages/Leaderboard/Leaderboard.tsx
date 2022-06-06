import { useContext, useEffect, useState } from "react";
import { context } from "../../App";
import Profiles from "./profile";

export default function Leaderboard() {
	const ws = useContext(context);
	let filteredData: any = [{ username: "", elo: "", status: "" }];
	const [rankData, setRankData] = useState(filteredData);
	const getData = async () => {
		const rawData = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/",
			{
				credentials: "include",
			}
		);
		const alldata = await rawData.json();

		alldata.sort((a: { elo: number }, b: { elo: number }) => {
			if (a.elo === b.elo) {
				return b.elo - a.elo;
			} else {
				return b.elo - a.elo;
			}
		});
		ws.on("userData", (data: any) => {
			alldata.forEach((el: any) => {
				if (el.ft_id === data.ft_id) {
					el.status = data.status;
				}
			});
			setRankData(alldata);
		});
		ws.emit("GetUserData");
	};

	useEffect(() => {
		getData();
	}, []);

	return <Profiles Leaderboard={rankData} />;
}
