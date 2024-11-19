// frontend/src/views/HomeView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRoomData,
  onMatched,
} from "../services/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelRequest,
} from "../services/firebase-functions-client.ts";
import { signInAnonymously, signOut, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase_f.ts";
import { AIModel, BotData, PlayerData, ProfileData } from "../shared/types.ts";
import { getUserProfile } from "../services/firestore-database_f.ts";
import { OnlineRoomViewProps } from "./RoomView.tsx";

const HomeView: React.FC = () => {
  //#region init
  const navigate = useNavigate();
  const user = auth.currentUser; // ログインユーザー情報

  // State variables
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bots, setBots] = useState<BotData | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  const [roomListened, setRoomListened] = useState<boolean>(false);

  //#endregion

  //#region ログイン状態の確認とプロフィール取得
  useEffect(() => {
    if (user) {
      setPlayerId(user.uid);
      if (user.isAnonymous) {
        setPlayerName("ゲスト");
      } else {
        setPlayerName(user.displayName || "");
        fetchUserProfile();
      }
    }
  }, [user]);

  // Firebaseからユーザープロフィールを取得
  const fetchUserProfile = async () => {
    try {
      if (user) {
        const data = await getUserProfile();
        if (data) {
          setProfile(data);
        } else {
          console.error("プロフィール情報の取得に失敗しました。");
        }
      }
    } catch (error) {
      console.error("プロフィール取得エラー: ", error);
    }
  };

  useEffect(() => {
    if (profile) {
      setBots(profile.bots);
      setAiPrompt(profile.bots.data[profile.bots.defaultId].prompt);
      setScore(profile.rating);
    }
  }, [profile]);
  //#endregion

  //#region ログイン・ログアウト処理
  // ユーザーをログアウトする
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました");
      navigate("/login");
    } catch (error) {
      console.error("ログアウトエラー: ", error);
    }
  };

  // 匿名ログイン処理
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストでログインしました");
      navigate("/");
    } catch (error) {
      console.error("ゲストログインエラー: ", error);
    }
  };
  //#endregion

  //#region プレイヤーネームの変更(ゲストユーザー用)
  // プレイヤーネーム変更ボタンをクリックしたときの処理
  const handleNameChangeClick = () => {
    handleNameSubmit();
  };

  // プレイヤーネームを更新する処理
  const handleNameSubmit = async () => {
    if (user && newName) {
      try {
        await updateProfile(user, { displayName: newName });
        setPlayerName(newName);
      } catch (error) {
        console.error("名前の更新に失敗しました: ", error);
      }
    }
  };
  //#endregion

  //#region マッチング処理
  // マッチングを開始する
  const startMatch = async () => {
    setIsPushedMatching(true);
    try {
      const player: PlayerData = {
        id: playerId,
        name: playerName,
        isReady: false,
        rating: score,
      };
      const result = await requestMatch(player);
      if (result.roomId !== "") {
        setRoomId(result.roomId);
        setRoomListened(true);
      } else {
        console.error("マッチングエラー: ", result.message);
        cancelMatching();
      }
    } catch (error) {
      console.error("マッチングエラー: ", error);
      cancelMatching();
    }
  };

  // マッチングをキャンセルする
  const cancelMatching = async () => {
    setIsPushedMatching(false);
    setRoomListened(false);
    setRoomId(null);
    try {
      await cancelRequest();
    } catch (error) {
      console.error("キャンセルエラー: ", error);
    }
  };

  // マッチング成立時の処理
  useEffect(() => {
    if (roomListened && roomId) {
      const unsubscribe = onMatched(roomId, (isMatched) => {
        if (isMatched) {
          console.log("マッチング成立");
          toRoomViewSegue(roomId);
        }
      });
      return () => {
        unsubscribe();
        setRoomListened(false);
      };
    }

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (roomListened) {
        await cancelMatching();
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomListened, roomId]);
  //#endregion

  //#region 画面遷移処理
  // プロフィール編集画面に遷移する
  const handleProfileEditClick = () => {
    navigate("/profile_edit", { state: profile });
  };

  // プロンプト編集画面に遷移する
  const handlePromptEdit = () => {
    navigate("/prompt_edit", { state: bots });
  };

  // ルームビューに遷移する処理
  const toRoomViewSegue = (roomId: string) => {
    setRoomListened(false);
    getRoomData(roomId).then((roomData) => {
      if (user && user.isAnonymous) {
        setBots({
          defaultId: 0,
          data: [
            {
              id: 0,
              name: "default",
              prompt: aiPrompt,
              model: AIModel["gpt-4"],
              temperature: 0,
              top_p: 0,
            },
          ],
        });
      }
      if (roomData.status === "matched" && bots) {
        const props: OnlineRoomViewProps = {
          roomData: roomData,
          botData: bots,
        };
        navigate(`/${roomId}`, { state: props });
      } else {
        console.error("ルームがプレイ中ではありません");
        cancelMatching();
      }
    });
  };
  //#endregion

  return (
    <div>
      <h1>ホーム</h1>
      {user ? (
        <div>
          {!user.isAnonymous ? (
            <div>
              <p>こんにちは、{playerName}さん</p>
              <button onClick={handleLogout}>ログアウト</button>
              <button onClick={handleProfileEditClick}>プロフィール編集</button>
              <p>Score: {score}</p>
              <div>
                <label>
                  AIプロンプト:
                  {aiPrompt}
                  <br />
                  <button onClick={handlePromptEdit}>プロンプト編集</button>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <p>匿名でプレイ中</p>
              <button onClick={() => navigate("/login")}>ログイン</button>
              <div>
                PlayerName:
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button onClick={handleNameChangeClick}>名前変更</button>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <h3>プロンプト編集</h3>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                />
              </div>
            </div>
          )}

          {isPushedMatching ? (
            <button onClick={cancelMatching}>キャンセル</button>
          ) : (
            <button onClick={startMatch}>Start Matching</button>
          )}
          {roomListened && <p>"Matching ..."</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => navigate("/login")}>ログイン</button>
          <button onClick={handleAnonymousLogin}>
            ゲストアカウントでプレイ
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeView;
