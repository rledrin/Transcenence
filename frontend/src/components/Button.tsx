import styles from "../css/Button.module.scss";

interface Props {
	text: string;
	className?: string;
	id?: string;
	onClick?: () => void;
	children?: React.ReactNode;
}

export default function Button(props: Props) {
	return (
		<>
			<div
				id={props.id}
				className={`${styles.button2} ${props.className}`}
				onClick={props.onClick}
			>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				{props.children} {props.text}
			</div>
		</>
	);
}
