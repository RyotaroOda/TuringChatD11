// frontend/src/components/ProfileEdit.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase_f.ts";
import { updateUserProfile } from "../services/firestore-database_f.ts";
import { ProfileData } from "../shared/types.ts";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

const languages = [
  "English",
  "Japanese",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Russian",
];
const countries = [
  "Japan",
  "United States",
  "France",
  "Germany",
  "China",
  "Russia",
  "Brazil",
];

const ProfileEdit: React.FC = () => {
  //#region init
  const [profile, setProfile] = useState<ProfileData>(useLocation().state);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : prev));
  };
  //#endregion

  //#region プロフィール更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile && user) {
      try {
        await updateUserProfile(profile);
        if (profile.name !== user.displayName) {
          await updateProfile(user, { displayName: profile.name });
        }
        alert("プロフィールが更新されました");
        navigate("/");
      } catch (error) {
        console.error("プロフィールの更新エラー:", error);
        setErrorMessage("プロフィールの更新中にエラーが発生しました");
      }
    }
  };

  // アカウント削除処理
  const handleDelete = async () => {
    if (!user) {
      alert("現在ログインしているユーザーが見つかりません。");
      return;
    }

    if (
      window.confirm(
        "本当にアカウントを削除しますか？この操作は取り消せません。"
      )
    ) {
      try {
        // 再認証を試みる
        const providerId = user.providerData[0]?.providerId;

        if (providerId === "password") {
          // メールとパスワードでログインしている場合
          const email = user.email;
          const password = prompt("再認証のためパスワードを入力してください:");

          if (email && password) {
            const credential = EmailAuthProvider.credential(email, password);
            await reauthenticateWithCredential(user, credential);
          } else {
            alert("パスワードが入力されていません。");
            return;
          }
        } else if (providerId === "google.com") {
          // Googleログインの場合
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } else {
          alert("再認証がサポートされていない認証方法です。");
          return;
        }

        // 再認証後にアカウント削除
        await deleteUser(user);
        alert("アカウントが削除されました。");
        navigate("/"); // ホーム画面にリダイレクト
      } catch (error: any) {
        console.error("アカウント削除エラー:", error);
        if (error.code === "auth/requires-recent-login") {
          alert("再認証が必要です。再度ログインしてください。");
        } else {
          alert("アカウント削除中にエラーが発生しました。");
        }
      }
    }
  };

  //#region 画面遷移
  const handleQuestionnaireEdit = () => {
    navigate("/questionnaire_edit");
  };

  //感想編集画面へ遷移
  const handleImpressionEdit = () => {
    navigate("/impression_edit");
  };
  //#endregion

  if (!profile) return <p>読み込み中...</p>;
  if (errorMessage) return <p style={{ color: "red" }}>{errorMessage}</p>;

  return (
    <div>
      <h1>プロフィール編集</h1>
      <div>
        <h3>認証情報</h3>
        <p>ユーザーID: {user?.uid}</p>
        <p>メールアドレス: {user?.email || "登録されていません"}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>名前:</label>
          <input
            type="text"
            name="name"
            value={profile?.name || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>年齢:</label>
          <input
            type="number"
            name="age"
            value={profile?.age || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>性別:</label>
          <select
            name="gender"
            value={profile?.gender || ""}
            onChange={handleChange}
          >
            <option value="no_answer">回答しない</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label>言語:</label>
          <select
            name="preferredLanguage"
            value={profile?.language || ""}
            onChange={handleChange}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>国:</label>
          <select
            name="location.country"
            value={profile?.location.country || ""}
            onChange={handleChange}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>都市:</label>
          <input
            type="text"
            name="location.city"
            value={profile?.location.city || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>プラットフォーム:</label>
          <input
            type="text"
            name="platform"
            value={profile?.platform || ""}
            readOnly
          />
        </div>

        <div>
          <h3>バトル情報</h3>
          <p>レーティング: {profile?.rating || 0}</p>
          <p>勝利数: {profile?.win || 0}</p>
          <p>敗北数: {profile?.lose || 0}</p>

          <p>
            登録日: {new Date(profile?.signUpDate || 0).toLocaleDateString()}
          </p>
          <p>
            最終ログイン:{" "}
            {new Date(profile?.lastLoginDate || 0).toLocaleDateString()}
          </p>
        </div>

        <div>
          <h3>実験アンケート</h3>
          {profile?.questionnaire ? (
            <div>
              <p>質問内容: {profile.questionnaire.questions.join(", ")}</p>
              <p>回答: {profile.questionnaire.answers.join(", ")}</p>
            </div>
          ) : (
            <p>アンケートはまだ回答されていません</p>
          )}
          <button onClick={handleImpressionEdit}>アンケートの回答/編集</button>
        </div>
        <button type="submit">更新</button>
        <br />
        <br />
        <button type="button" onClick={handleDelete}>
          アカウントを削除
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;
