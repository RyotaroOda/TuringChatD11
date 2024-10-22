import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onRoomUpdate,
  getRoomData,
} from "../services/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelMatch,
} from "../services/firebase-functions-client.ts"; // Firebase Functionsの呼び出しをインポート

import { useAuth } from "../services/useAuth.tsx"; // useAuthフックをインポート
import { signOut } from "firebase/auth"; // Firebaseのログアウト機能をインポート
import { auth } from "../services/firebase_f.ts"; // Firebaseの認証インスタンスをインポート

import { AIModel, PlayerData } from "shared/dist/types";

const HomeView: React.FC = () => {
  const [score, setScore] = useState<number>(9999);
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [roomId, setRoomId] = useState<string | null>(null); // ルームID
  const [playerName, setPlayerName] = useState<string>(""); // プレイヤーネームを保持
  const [playerId, setPlayerId] = useState<string>(""); // プレイヤーID

  const navigate = useNavigate();
  const { user } = useAuth(); // useAuthフックで認証状態を取得

  //#region ログイン状態
  useEffect(() => {
    if (user) {
      setPlayerId(user.uid); // プレイヤーIDを設定
      // ログイン済みユーザーならFirebaseからプレイヤー名を取得
      if (user.isAnonymous) {
        setPlayerName("ゲスト"); // 匿名ユーザーの場合はゲスト表示
      } else if (user.displayName) {
        setPlayerName(user.displayName); // 名前が登録されている場合は表示
      } else {
        setPlayerName(user.email || ""); // 名前がない場合はメールアドレスを表示
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
        //FIXME - updateProfile関数の実装が必要
        // await updateProfile(user, { displayName: newName }); // Firebaseで名前を更新
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
  // マッチング開始処理
  const startMatch = async () => {
    try {
      const player: PlayerData = {
        id: playerId, // プレイヤーID
        name: playerName,
        rating: score,
        bot: { prompt: aiPrompt, model: AIModel.default },
      };
      const result = await requestMatch(player); // サーバーレス関数でマッチングリクエスト

      if (result.roomId) {
        setRoomId(result.roomId); // ルームIDを保存
        if (result.startBattle) {
          //バトル開始
          const roomData = await getRoomData(result.roomId);
          navigate(`/battle/${roomId}`, {
            state: { roomData: roomData },
          });
        } else {
          //ホスト
          setIsMatching(true); // マッチング状態を設定
        }
      } else {
        console.error("マッチングエラー1");
        setIsMatching(false);
      }
    } catch (error) {
      console.error("マッチングエラー2:", error);
      setIsMatching(false); // エラー発生時にマッチング状態を解除
    }
  };

  // マッチングキャンセル処理
  const handleCancelMatch = async () => {
    setIsMatching(false); // マッチング状態を解除
    setRoomId(null); // ルームIDをクリア
    try {
      await cancelMatch(); // サーバーレス関数でキャンセル
    } catch (error) {
      console.error("キャンセルエラー:", error);
    }
  };

  //ルーム監視
  useEffect(() => {
    if (isMatching && roomId) {
      // ルームIDが設定されている場合、ルームのデータを監視
      onRoomUpdate(roomId, (roomData) => {
        if (roomData && roomData.player2) {
          // player2が設定されたらマッチング成立とみなす
          console.log("Match found with opponent:", roomData.player2);
          navigate(`/battle/${roomId}`, {
            state: { matchData: roomData, myData: { playerName } },
          });
        } else if (!roomData) {
          // ルームが削除された場合
          console.error(
            "ルームが削除されました。マッチングがキャンセルされた可能性があります。"
          );
          cancelMatch(); // マッチングをキャンセル
          setIsMatching(false);
          alert(
            "ルームが削除されました。マッチングがキャンセルされた可能性があります"
          );
        }
      });
    }
  }, [roomId, navigate, playerName, isMatching]);

  // 画面が閉じられるかリロードされた場合にマッチングをキャンセル
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (isMatching) {
        await cancelMatch(); // マッチングが進行中ならキャンセル
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

  return (
    <div>
      <h1>ホーム</h1>
      {user ? (
        <div>
          {/* ゲストユーザー（匿名）ではない場合に名前を表示 */}
          {!user.isAnonymous && (
            <div>
              <p>こんにちは、{playerName}さん</p>
              <button onClick={handleNameChangeClick}>
                {isEditingName ? "キャンセル" : "名前変更"}
              </button>

              {/* 名前編集モード時にのみテキストフィールドを表示 */}
              {isEditingName && (
                <div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)} // テキストフィールドの値を更新
                    placeholder="新しい名前を入力"
                  />
                  <button onClick={handleNameSubmit}>名前を保存</button>
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      ) : (
        <div>
          <button onClick={() => navigate("/login")}>ログイン</button>{" "}
          {/* ログインボタン */}
        </div>
      )}

      {/* プレイヤーネームの入力はログイン済みユーザーのみ表示 */}
      {user && !user.isAnonymous ? null : (
        <div>
          <p>PlayerName: ゲスト</p>
        </div>
      )}

      <p>Score: {score}</p>
      <div>
        <label>
          AIプロンプト:
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
        </label>
      </div>

      {/* マッチング中にキャンセルボタンを表示 */}
      {isMatching ? (
        <button onClick={handleCancelMatch}>キャンセル</button> // マッチングキャンセルボタン
      ) : (
        <button onClick={startMatch}>Start Matching</button> // マッチング開始ボタン
      )}
      {isMatching ? <p>"Matching ..."</p> : <p></p>}
    </div>
  );
};

export default HomeView;
