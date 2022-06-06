import styles from "../css/App.module.css";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Block, TaskAlt } from "@mui/icons-material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { context } from "../App";

interface Props {
	setOpen: any;
	open: boolean;
}

export default function ModalDuelAccept(props: Props) {
	const navigate = useNavigate();
	const ws = useContext(context);
	const [username, setUsername] = useState("");

	useEffect(() => {
		ws.on("duelProposal", (data: any) => {
			if (window.location.pathname !== "/TheGame") {
				setUsername(data.username);
				props.setOpen(true);
			} else {
				ws.emit("cancelDuelProposal");
			}
		});
		ws.on("cancelDuelProposal", (data: any) => {
			props.setOpen(false);
		});
		ws.on("gameFound", (data: any) => {
			navigate("/TheGame");
		});
	}),
		[];

	return (
		<>
			<Modal
				open={props.open}
				onClose={(event, reason) => {
					if (reason && reason == "backdropClick") return;
					props.setOpen(false);
				}}
				disableEscapeKeyDown={true}
			>
				<Box className={styles.boxModalDuelAccept}>
					<div style={{ margin: "10% 0 0 30%", fontSize: "1vw" }}>
						{username} has challenged you to play Pong !
					</div>
					<Button
						style={{ margin: "15% 0 0 40%" }}
						variant="contained"
						color="success"
						onClick={() => {
							props.setOpen(false);
							ws.emit("acceptDuel");
						}}
						endIcon={<TaskAlt />}
					>
						Accept Duel
					</Button>
					<Button
						style={{ margin: "5% 0 0 40%" }}
						variant="contained"
						color="error"
						onClick={() => {
							props.setOpen(false);
							ws.emit("cancelDuelProposal");
						}}
						endIcon={<Block />}
					>
						Refuse Duel
					</Button>
				</Box>
			</Modal>
		</>
	);
}
