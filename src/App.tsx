import { Button } from "@mui/material";
import { useEffect, useState } from "react";

import "./App.css";
import Board from "./components/Board";
import { db } from "./plugins/firebase";
import {
  collection,
  addDoc,
  where,
  query,
  getDocs,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

function App() {
  const defaultBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0],
    [0, 0, 0, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const [random_room_id, setRandomRoomId] = useState("");
  const [myColor, setMyColor] = useState<"white" | "black">("white");
  const [loading, setLoading] = useState(false);
  const [board, setBoard] = useState(defaultBoard);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [roomStatus, setRoomStatus] = useState("");

  const [isEnd, setIsEnd] = useState(false);
  const [winner, setWinner] = useState("");

  useEffect(() => {
    if (isEnd) endGame();
  }, [isEnd]);

  // 部屋監視
  const watchRoom = (roomId: string) => {
    // 部屋を監視します。
    const roomsRef = doc(db, "random_rooms", roomId);
    // リアルタイムで部屋を更新します。
    onSnapshot(roomsRef, (querySnapshot) => {
      const data = querySnapshot.data();
      setRoomStatus(data?.status || "");
      if (!data) return;
      if (Number(data.num_people) !== 2) return;
      if (data.status !== "playing") return;
      if (!data.board) return;
      setLoading(false);
      const newBoard = [...data.board];

      checkEndGame(newBoard, querySnapshot.id);

      // 碁盤データを一次元から二次元に変換
      const formatNewBoard = [...Array(8)].map((_, index) => {
        const startNum = index === 0 ? index : index * 8;
        const endNum = startNum + 8;

        return newBoard.slice(startNum, endNum);
      });

      setBoard([...formatNewBoard]);
      setTurn(data.turn);
    });
  };

  // ボード情報更新
  const updateBoard = async (board: number[][]) => {
    const roomsRef = doc(db, "random_rooms", random_room_id);
    await updateDoc(roomsRef, {
      board: [...board].flat(),
      turn: turn === "white" ? "black" : "white",
    });

    setBoard([...board]);
  };

  // 部屋作成
  const createRoom = async () => {
    const docRef = collection(db, "random_rooms");
    const data = await addDoc(docRef, {
      // Firebaseは二次元配列を格納できない
      board: defaultBoard.flat(),
      num_people: 1,
      status: "matching",
      turn: "white",
    });
    if (!data.id) return;
    setRandomRoomId(data.id);
    watchRoom(data.id);
  };

  // マッチング
  const matching = async () => {
    setLoading(true);
    // 初期化
    setRoomStatus("");
    setMyColor("white");
    setTurn("white");
    const collectionRef = collection(db, "random_rooms");
    // マッチ中の部屋を取得するためのクエリ
    const q = query(collectionRef, where("status", "==", "matching"));
    // マッチ中の部屋の取得
    const rooms = await getDocs(q);
    // もし部屋がなければ作っています。
    if (rooms.size === 0) {
      await createRoom();
      return;
    }

    // 部屋情報を取得してデータを取り出しています。
    const roomData = [] as {
      id: string;
      board: string[];
      num_people: number;
      status: string;
      turn: string;
    }[];
    rooms.forEach((doc) => {
      if (!doc?.id) return;
      const data = doc.data();
      roomData.push({
        id: doc.id,
        board: data.board,
        num_people: data.num_people,
        status: data.status,
        turn: data.turn,
      });
    });
    // 最初に見つかった部屋をセットしています。
    setRandomRoomId(roomData[0].id);

    // 部屋の参加人数とステータスを更新
    const roomsDoc = doc(db, "random_rooms", roomData[0].id);
    const newNumPeople = Number(roomData[0].num_people) + 1;
    if (newNumPeople === 2) setMyColor("black");
    await updateDoc(roomsDoc, {
      ...roomData[0],
      num_people: newNumPeople,
      status: newNumPeople === 2 ? "playing" : "matching",
    });

    // 部屋を監視
    watchRoom(roomData[0].id);
  };

  // パス機能
  const pass = async () => {
    const roomsDoc = doc(db, "random_rooms", random_room_id);
    await updateDoc(roomsDoc, {
      turn: turn === "white" ? "black" : "white",
    });
  };

  // ゲームが決着ついたかどうか 第一引数は、一次元配列にしたボードのデータです。
  const checkEndGame = async (board: number[], roomId: string) => {
    // 白のコマの数
    const whiteNum = board.filter((item) => item === 1)?.length || 0;
    // 黒のコマの数
    const blackNum = board.filter((item) => item === 2)?.length || 0;
    // 残りのマス目の数
    const boardNum = board.filter((item) => item === 0)?.length || 0;
    if (whiteNum === 0) setWinnerItem("black");
    if (blackNum === 0) setWinnerItem("white");
    if (boardNum === 0) {
      // 引き分け
      if (whiteNum === blackNum) setWinnerItem("draw");
      if (whiteNum > blackNum) setWinnerItem("white");
      if (whiteNum < blackNum) setWinnerItem("black");
    }
  };

  const setWinnerItem = (winner: string) => {
    setWinner(winner);
    setIsEnd(true);
  };

  useEffect(() => {
    if (isEnd) endGame();
  }, [isEnd]);

  // ゲームを終了している
  const endGame = async () => {
    const roomsDoc = doc(db, "random_rooms", random_room_id);
    await updateDoc(roomsDoc, {
      status: "end",
    });

    setIsEnd(false);
  };

  return (
    <div className="App container m-auto min-h-screen flex bg-[#ffffff]">
      <div className="w-full m-auto flex flex-col">
        <h1 className="font-bold text-2xl text-[#696969] py-4 mb-8">
          オンラインオセロ
        </h1>
        {roomStatus !== "matching" && (
          <div className="mx-auto w-[400px] mb-4">
            <Board
              myColor={myColor}
              board={board}
              turn={turn}
              setBoard={updateBoard}
            ></Board>
          </div>
        )}

        {roomStatus === "playing" && (
          <>
            <div className="font-bold text-2xl text-[#696969] flex mx-auto">
              <div className="border-4 rounded-lg mr-2">
                {turn === "white" ? "白" : "黒"}
              </div>
              <span className="my-auto">
                {turn === myColor ? "あなたのターンです" : "相手のターンです"}
              </span>
            </div>
            {turn === myColor && (
              <div className="mx-auto mt-2">
                <Button disabled={loading} onClick={pass} variant="contained">
                  パス
                </Button>
              </div>
            )}
          </>
        )}

        {roomStatus === "end" && (
          <h2 className="font-bold text-3xl text-[#696969] mb-4">
            {!winner
              ? ""
              : winner === "draw"
                ? "引き分けです"
                : winner === myColor
                  ? "あなたの勝ちです！"
                  : "あなたの負けです"}
          </h2>
        )}

        {roomStatus !== "playing" && (
          <div className="mx-auto">
            <Button
              disabled={loading}
              onClick={matching}
              disableElevation
              className="w-80 h-20 rounded-full "
              variant="contained"
            >
              <span className="text-xl font-bold"> 対戦</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;