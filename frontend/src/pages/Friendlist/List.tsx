import Profiles from "./Users";
import { useEffect, useState } from "react";

interface Props {
	input: string;
}

function List(props: Props) {
	let filteredData: any = [{ username: "", picture: "", status: "" }];
	const [finalData, setFinalData] = useState(filteredData);
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
		const rawData2 = await fetch(
			process.env.REACT_APP_BACK_URL +
				":" +
				process.env.REACT_APP_BACK_PORT +
				"/user/me",
			{
				credentials: "include",
			}
		);
		const myData = await rawData2.json();

		const filteredData = alldata.filter((el: any) => {
			if (
				el.ft_id !== myData.ft_id &&
				myData.friends &&
				myData.friends.find((u: any) => u.ft_id === el.ft_id)
			) {
				if (props.input === "") {
					return el;
				} else {
					return el.username.toLowerCase().includes(props.input);
				}
			}
		});
		setFinalData(filteredData);
	};

	useEffect(() => {
		getData();
	}, []);

	return <Profiles Data={finalData} />;
}

export default List;
