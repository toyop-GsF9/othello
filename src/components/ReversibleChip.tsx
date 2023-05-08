interface ReversibleChipsProps {
	status: "white" | "black";
}

function ReversibleChips({ status }: ReversibleChipsProps) {
	return (
		<div
			className={`w-full h-full rounded-full 
      ${status === "white" ? "bg-[#fff]" : "bg-[#000]"} 
      `}
		></div>
	);
}

export default ReversibleChips;