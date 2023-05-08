import { Card } from "@mui/material";
import ReversibleChip from "./ReversibleChip";

interface BoardProps {
	board: number[][];
	myColor: "white" | "black";
	turn: "white" | "black";
	setBoard: (board: number[][]) => void;
}

function Board({ board, myColor, turn, setBoard }: BoardProps) {
	// 周囲8方向を調べる配列
	const direction = [
		[-1, 0], // 左
		[-1, 1], // 左下
		[0, 1], // 下
		[1, 1], // 右下
		[1, 0], // 右
		[1, -1], // 右上
		[0, -1], // 上
		[-1, -1], // 左上
	];

	// ひっくり返すことができる座標を取得
	const getReversePoints = (currentX: number, currentY: number) => {
		//ひっくり返す座標
		const result = [] as number[][];
		// 現在のターン
		const currentTurn = turn === "white" ? 1 : 2;
		// ８方面を確認する
		direction.forEach((d) => {
			//確認する方向の座標
			const axisX = d[0];
			const axisY = d[1];
			let x = axisX + currentX;
			let y = axisY + currentY;
			if (y < 0 || y >= 8) return;
			if (x < 0 || x >= 8) return;
			// 確認する方向の隣のコマの数値
			const pointStatus = board[y][x];
			// コマがなかった場合次の方向を確認しに行く
			if (!pointStatus) return;
			// 確認する方向の隣のコマの数値が同じであった場合次の方向を確認しに行く
			if (pointStatus === currentTurn) return;
			// 変更するかもしれない座標
			let localChangePoint = [[axisX + currentX, axisY + currentY]];
			let isStatus = true;
			while (isStatus) {
				// 確認する方向を順に確認しています。
				x = x + axisX;
				y = y + axisY;
				if (y < 0 || y >= 8) return;
				if (x < 0 || x >= 8) return;
				const pointStatus = board[y][x];
				// コマがなかった場合、localChangePointを空にして次の方向確認
				if (!pointStatus) {
					localChangePoint = [];
					isStatus = false;
				}
				// 同じ色のコマがあった場合処理を抜ける
				else if (pointStatus === currentTurn) {
					isStatus = false;
				}
				// 違う色のコマだった場合、localChangePointに座標を入れる
				else {
					localChangePoint.push([x, y]);
				}
			}
			result.push(...localChangePoint);
		});
		return result;
	};

	const clickBoard = (rowIndex: number, colIndex: number) => {
		// 自分のターンではないとき操作させない
		if (myColor !== turn) return;
		const newArray = [...board];
		const reversePoints = getReversePoints(colIndex, rowIndex);
		// ここで、置けない場所をクリックしたとき、処理を抜けいています。
		if (reversePoints.length === 0) return;
		// クリックした座標にこまを置いている
		newArray[rowIndex][colIndex] = turn === "white" ? 1 : 2;
		// ここでひっくり返せるこまをひっくり返している
		reversePoints.forEach((item) => {
			const x = item[0];
			const y = item[1];
			newArray[y][x] = turn === "white" ? 1 : 2;
		});

		// 碁盤変更
		setBoard([...newArray]);
	};
	return (
		<>
			<Card square className="max-w-md">
				{board.map((row, rowIndex) => {
					// colsは横軸です。ここで横軸の要素を取得しています。
					const cols = row.map((col, colIndex) => {
						return (
							// マス目
							<div
								key={colIndex}
								className="border border-[#000] bg-[#516a39] aspect-[4/4] p-1"
							>
								{/* 何も置かれていない時は、0 */}
								{col === 0 && (
									<div
										className="w-full h-full"
										onClick={() => clickBoard(rowIndex, colIndex)}
									></div>
								)}

								{/* 白の時は、１ */}
								{col === 1 && <ReversibleChip status="white"></ReversibleChip>}

								{/* 黒の時は、１ */}
								{col === 2 && <ReversibleChip status="black"></ReversibleChip>}
							</div>
						);
					});
					return (
						// rowは縦軸です。
						<div
							className="grid justify-items-stretch grid-cols-8 w-full"
							key={rowIndex}
						>
							{cols}
						</div>
					);
				})}
			</Card>
		</>
	);
}

export default Board;