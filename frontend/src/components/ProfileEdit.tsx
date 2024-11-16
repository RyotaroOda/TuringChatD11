import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase_f.ts";
import { updateUserProfile } from "../services/firestore-database_f.ts";
import { ProfileData, QuestionnaireData } from "shared/dist/types";
import { updateProfile } from "firebase/auth";

const languages = [
  "English",
  "Japanese",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Russian",
]; // 言語リスト
const countries = [
  "Japan",
  "United States",
  "France",
  "Germany",
  "China",
  "Russia",
  "Brazil",
]; // 国のリスト

const ProfileEdit: React.FC = () => {
  //HomeViewからProfileDataを取得
  const [profile, setProfile] = useState<ProfileData>(useLocation().state);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  // フォーム変更時のハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // フォーム送信時のハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile && user) {
      try {
        await updateUserProfile(profile);
        // Firebase AuthのdisplayNameも更新
        if (profile.name !== user.displayName) {
          await updateProfile(user, { displayName: profile.name });
        }
        alert("プロフィールが更新されました");
        navigate("/"); // 更新後のリダイレクト先
      } catch (error) {
        console.error("プロフィールの更新エラー:", error);
        setErrorMessage("プロフィールの更新中にエラーが発生しました");
      }
    }
  };

  // アンケートボタンのハンドラ
  const handleQuestionnaireEdit = () => {
    navigate("/questionnaire_edit");
  };

  // アンケートボタンのハンドラ
  const handleImpressionEdit = () => {
    navigate("/impression_edit");
  };

  if (!profile) return <p>読み込み中...</p>;
  if (errorMessage) return <p style={{ color: "red" }}>{errorMessage}</p>;

  return (
    <div>
      <h1>プロフィール編集</h1>
      {/* ユーザーの認証情報の表示 */}
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

        {/* アンケート情報の表示 */}
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
      </form>
    </div>
  );
};

export default ProfileEdit;
