// frontend/src/views/HomeView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRoomData,
  onRoomPlayersUpdated,
} from "../services/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelRequest,
} from "../services/firebase-functions-client.ts"; // Firebase Functionsの呼び出しをインポート

import { signInAnonymously, signOut, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase_f.ts";

import {
  AIModel,
  BotData,
  MatchResult,
  PlayerData,
  ProfileData,
  RoomData,
} from "shared/dist/types";
import { getUserProfile } from "../services/profileAPI.ts";
import { OnlineRoomViewProps } from "./RoomView.tsx";
import { BotSetting } from "shared/src/types.ts";

const HomeView: React.FC = () => {
  const [score, setScore] = useState<number>(9999);
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [roomId, setRoomId] = useState<string | null>(null); // ルームID
  const [playerName, setPlayerName] = useState<string>(""); // プレイヤーネームを保持
  const [playerId, setPlayerId] = useState<string>(""); // プレイヤーID

  const navigate = useNavigate();
  const user = auth.currentUser; // ログインユーザー情報
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bots, setBots] = useState<BotData | null>(null);

  //#region ログイン状態
  useEffect(() => {
    if (user) {
      setPlayerId(user.uid); // プレイヤーIDを設定
      // ログイン済みユーザーならFirebaseからプレイヤー名を取得
      if (user.isAnonymous) {
        setPlayerName("ゲスト"); // 匿名ユーザーの場合はゲスト表示
        const newBot: BotData = {
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
        };
        setBots(newBot);
      } else {
        setPlayerName(user.displayName || ""); // 名前が登録されている場合は表示
        const fetchProfile = async () => {
          if (user) {
            const data = await getUserProfile();
            if (data) {
              setProfile(data);
              setBots(data.bots);
            } else {
              console.error("プロフィール情報の取得に失敗しました。", data);
            }
          }
        };
        fetchProfile();
      }
    }
  }, [user]);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました");
      navigate("/login"); // ログアウト後にログイン画面にリダイレクト
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // 匿名ログイン処理
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストでログインしました");
      // navigate("/"); // ログイン後にホーム画面にリダイレクト
    } catch (error) {
      console.error("ゲストログインエラー:", error);
    }
  };
  //#endregion

  //#region プレイヤーネーム
  const [isEditingName, setIsEditingName] = useState<boolean>(false); // 名前編集モード
  const [newName, setNewName] = useState<string>(""); // 新しい名前
  // ユーザー情報が変わるたびにプレイヤーネームを更新
  useEffect(() => {
    if (user) {
      const displayName =
        user.displayName || (user.isAnonymous ? "ゲスト" : user.email || "");
      setPlayerName(displayName); // 既存のプレイヤーネームを設定
      setNewName(displayName); // 名前編集用のテキストフィールドにも設定
    }
  }, [user]);

  // 名前変更ボタンを押した時の処理
  const handleNameChangeClick = () => {
    setIsEditingName(!isEditingName); // 編集モードのオン/オフを切り替え
  };

  // 名前を更新する処理
  const handleNameSubmit = async () => {
    if (user && newName) {
      try {
        await updateProfile(user, { displayName: newName }); // FirebaseAuthで名前を更新
        setPlayerName(newName); // 画面上の名前を更新
        setIsEditingName(false); // 編集モードを終了
      } catch (error) {
        console.error("名前の更新に失敗しました:", error);
      }
    }
  };

  //#endregion

  //#region マッチング
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  // マッチング開始処理
  let match: MatchResult;

  const startMatch = async () => {
    setIsPushedMatching(true); // マッチングボタンを押した状態にする
    try {
      const player: PlayerData = {
        id: playerId, // プレイヤーID
        name: playerName,
        rating: score,
        isReady: false,
      };
      const result = await requestMatch(player); // サーバーレス関数でマッチングリクエスト
      if (result.roomId !== "") {
        await setRoomId(result.roomId); // ルームIDを設定
        if (result.startBattle) {
          toRoomViewSegue(result.roomId); // バトル画面に遷移
          //TODO: roomIdを更新してから
        } else {
          //ホスト
          setIsMatching(true); // マッチング状態を設定
        }
      } else {
        console.error("マッチングエラー", result.message);
        cancelMatching();
      }
    } catch (error) {
      console.error("マッチングエラー:", error);
      cancelMatching(); // エラー発生時にマッチング状態を解除
    }
  };

  // マッチングキャンセル処理
  const cancelMatching = async () => {
    setIsPushedMatching(false); // マッチングボタンを押した状態を解除
    setIsMatching(false); // マッチング状態を解除
    setRoomId(null); // ルームIDをクリア
    try {
      await cancelRequest(); // サーバーレス関数でキャンセル
    } catch (error) {
      console.error("キャンセルエラー:", error);
    }
  };

  //ルーム監視
  useEffect(() => {
    if (isMatching && roomId) {
      // ルームIDが設定されている場合、ルームのデータを監視
      const unsubscribe = onRoomPlayersUpdated(
        roomId,
        (players) => {
          // player2が設定されたらマッチング成立とみなす
          if (players && Object.keys(players).length === 2) {
            toRoomViewSegue(roomId); // バトル画面に遷移
          }
        },
        { current: !isMatching }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [roomId, navigate, playerName, isMatching]);

  // 画面が閉じられるかリロードされた場合にマッチングをキャンセル
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (isMatching) {
        cancelMatching();
        event.preventDefault();
        event.returnValue = ""; // ブラウザに確認メッセージを表示（ユーザーが手動で中止できる）
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload); // クリーンアップ
    };
  }, [isMatching]);

  //#endregion

  //#region 画面遷移
  // プロフィール編集ボタンのクリック処理
  const handleProfileEditClick = () => {
    navigate("/profile_edit", {
      state: profile,
    }); // プロフィール編集画面に遷移
  };

  const handlePromptEdit = () => {
    navigate("/prompt_edit", {
      state: bots,
    }); // プロンプト編集画面に遷移
  };

  const toBattleViewSegue = (roomId: string, roomData: RoomData) => {
    setIsMatching(false); // マッチング状態を解除
    getRoomData(roomId).then((roomData) => {
      if (roomData.status === "playing") {
        console.log("バトル画面に遷移します");
        navigate(`/battle/${roomId}`, {
          state: { roomData: roomData },
        });
      } else {
        console.error("ルームがプレイ中ではありません");
        cancelMatching();
      }
    });
  };

  const toRoomViewSegue = (roomId: string) => {
    setIsMatching(false); // マッチング状態を解除
    getRoomData(roomId).then((roomData) => {
      if (roomData.status === "playing" && bots) {
        console.log("バトル画面に遷移します");
        const props: OnlineRoomViewProps = {
          roomData: roomData,
          botData: bots,
        };
        navigate(`/${roomId}`, {
          state: props,
        });
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
          {/* ゲストユーザー（匿名）ではない場合に名前を表示 */}
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
                  <button onClick={handlePromptEdit}>編集</button>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <p>匿名でプレイ中</p>
              <button onClick={() => navigate("/login")}>ログイン</button>{" "}
              <div>
                PlayerName:{" "}
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

          {/* マッチング中にキャンセルボタンを表示 */}
          {isPushedMatching ? (
            <button onClick={cancelMatching}>キャンセル</button> // マッチングキャンセルボタン
          ) : (
            <button onClick={startMatch}>Start Matching</button> // マッチング開始ボタン
          )}
          {isMatching ? <p>"Matching ..."</p> : <p></p>}
        </div>
      ) : (
        <div>
          <button onClick={() => navigate("/login")}>ログイン</button>{" "}
          <button onClick={handleAnonymousLogin}>
            ゲストアカウントでプレイ
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeView;
