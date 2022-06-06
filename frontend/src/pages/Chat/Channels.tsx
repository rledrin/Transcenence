import styles from "../../css/Chat.module.css";
import Button from "@mui/material/Button";
import { useContext } from "react";
import { context } from "../../App";

export default function channels({
	myChats,
	setChannelState,
	channelState,
}: any) {
	return (
		<>
			{myChats && (
				<div id={styles.channel}>
					{Item(myChats, setChannelState, channelState)}
				</div>
			)}
		</>
	);
}

function Item(dataChannels: any, setChannelState: any, channelState: any) {
	const ws = useContext(context);

	return (
		<>
			{dataChannels.map((value: any, index: any) => {
				return (
					<div
						className={styles.flex}
						key={index}
						id={index.toString()}
						onClick={() => {
							if (value.id !== channelState) {
								setChannelState(value.id);
							} else {
								setChannelState("");
							}
						}}
						style={{
							backgroundColor:
								channelState === value.id ? "#38B2AC" : "#E8E8E8",
						}}
					>
						<h1> {value.channelname}</h1>
						<Button
							className={styles.buttonQuitChannel}
							variant="contained"
							color="error"
							onClick={() => {
								ws.emit("leaveChannel", { channelId: value.id });
							}}
						>
							Quit
						</Button>
					</div>
				);
			})}
		</>
	);
}
