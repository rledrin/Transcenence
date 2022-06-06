import styles from "../../css/Friendlist.module.css";
import TextField from "@mui/material/TextField";
import List from "./List";
import { useState } from "react";

export default function Friendlist() {
	const [inputText, setInputText] = useState("");
	let inputHandler = (e: any) => {
		var lowerCase = e.target.value.toLowerCase();
		setInputText(lowerCase);
	};

	return (
		<div className={styles.main}>
			<h1>React Search</h1>
			<div className={styles.search}>
				<TextField
					id={styles.outlinedBasic}
					variant="outlined"
					fullWidth
					label="Search"
					onChange={inputHandler}
				/>
			</div>
			<List input={inputText} />
		</div>
	);
}
