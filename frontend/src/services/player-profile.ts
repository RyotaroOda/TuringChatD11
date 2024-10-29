import { set, update, get, ref } from "firebase/database";
import { getAuth, updateProfile } from "firebase/auth";
import { db } from "./firebase_f.ts"; // Firebase初期化ファイルからデータベースをインポート
import { ProfileData } from "shared/dist/types";
import { DATABASE_PATHS } from "shared/dist/database-paths.ts";
import { getFunctions, httpsCallable } from "firebase/functions";
const auth = getAuth();

const updateAuthProfile = async (displayName: string, photoURL: string) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName, photoURL });
    console.log("Authプロファイルが更新されました:", displayName, photoURL);
  }
};

export const createUserProfile = async (
  userId: string,
  username: string,
  avatarUrl: string
) => {
  const profileRef = ref(db, DATABASE_PATHS.profiles(userId));
  const initialProfileData = {
    username,
    avatarUrl,
    level: 1,
    winCount: 0,
    lossCount: 0,
    score: 0,
    lastLogin: new Date().toISOString(),
  };
  await set(profileRef, initialProfileData);
  console.log("新規プロフィールが作成されました:", userId);
};

// プロフィールの更新
export const updateUserProfile = async (
  userId: string,
  data: Partial<ProfileData>
) => {
  const profileRef = ref(db, DATABASE_PATHS.profiles(userId));
  await update(profileRef, {
    ...data,
    lastLogin: new Date().toISOString(),
  });
  console.log("プロフィールが更新されました:", userId);
};

// プロフィールの取得
export const getUserProfile = async (userId: string) => {
  const profileRef = ref(db, DATABASE_PATHS.profiles(userId));
  const snapshot = await get(profileRef);
  return snapshot.val();
};

const functions = getFunctions();
const createProfile = httpsCallable(functions, "createUserProfile");

await createProfile({
  userId: "userId1",
  username: "Player1",
  avatarUrl: "https://example.com/avatar1.png",
});

const displayProfile = async (userId: string) => {
  const profile = await getUserProfile(userId);
  console.log("ユーザープロフィール:", profile);
};
