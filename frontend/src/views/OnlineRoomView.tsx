// frontend/src/views/OnlineRoomView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase_f.ts";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firestore = getFirestore();
const functions = getFunctions();

const OnlineRoomView: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {}, [user]);

  useEffect(() => {
    if (roomId) {
      const roomRef = doc(firestore, "rooms", roomId);
      const unsubscribe = onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data();
        if (data) {
          setOpponentReady(data.opponentReady || false);
          if (data.opponentReady && data.playerReady) {
            navigate("/battle");
          }
        }
      });
      return () => unsubscribe();
    }
  }, [roomId, navigate]);

  const handleReady = async () => {
    if (roomId && user) {
      const roomRef = doc(firestore, "rooms", roomId);
      await setDoc(roomRef, { playerReady: true }, { merge: true });
      setIsReady(true);
    }
  };

  return (
    <div>
      <h1>オンラインルーム</h1>
      <p>対戦相手を待っています...</p>
      <div>
        <p>あなたのステータス: {isReady ? "準備完了" : "準備中"}</p>
        <p>相手のステータス: {opponentReady ? "準備完了" : "準備中"}</p>
      </div>
      {!isReady && <button onClick={handleReady}>準備完了</button>}
    </div>
  );
};

export default OnlineRoomView;
