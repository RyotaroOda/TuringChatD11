// frontend/src/services/player-profile.ts
import { updateProfile } from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { AIModel, BotData, BotSetting, ProfileData } from "shared/dist/types";
import { DATABASE_PATHS } from "shared/dist/database-paths";
import { auth, firestore } from "./firebase_f.ts";

//region Authプロフィール
// Authプロフィールの更新
const updateAuthProfile = async (displayName: string, photoURL: string) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName, photoURL });
    console.log("Authプロファイルが更新されました:", displayName, photoURL);
  }
};

//#endregion

const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(userAgent)) return "mobile";
  if (
    /win|mac|linux/.test(userAgent) &&
    !/mobile|android|iphone|ipad/.test(userAgent)
  )
    return "desktop";
  return "web";
};

export const createUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ユーザーが認証されていません");
  }
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, user.uid); // Firestoreのプロファイルドキュメント参照
  const botData: BotSetting[] = [
    {
      id: 0,
      prompt: "設定1",
      model: AIModel["gpt-4"],
      name: "1",
      temperature: 1,
      top_p: 1,
    },
    {
      id: 1,
      prompt: "設定2",
      model: AIModel["gpt-4"],
      name: "2",
      temperature: 1,
      top_p: 1,
    },
    {
      id: 2,
      prompt: "設定3",
      model: AIModel["gpt-4"],
      name: "3",
      temperature: 1,
      top_p: 1,
    },
    {
      id: 3,
      prompt: "設定4",
      model: AIModel["gpt-4"],
      name: "4",
      temperature: 1,
      top_p: 0,
    },
    {
      id: 4,
      prompt: "設定5",
      model: AIModel["gpt-4"],
      name: "5",
      temperature: 1,
      top_p: 0,
    },
    {
      id: 5,
      prompt: "設定6",
      model: AIModel["gpt-4"],
      name: "6",
      temperature: 1,
      top_p: 1,
    },
  ];

  const initialProfileData: ProfileData = {
    userId: user.uid,
    name: user.displayName || "未設定",
    rating: 0,
    bots: {
      defaultId: 1,
      data: botData,
    },
    questionnaire: null,
    signUpDate: Date.now(),
    lastLoginDate: Date.now(),
    age: null,
    gender: "no_answer",
    language: "Japanese",
    location: {
      country: "japan",
      city: null,
    },
    platform: detectPlatform(),
    win: 0,
    lose: 0,
  };
  await setDoc(profileRef, initialProfileData);
  console.log("新規プロフィールが作成されました:", user.uid);
};

// プロフィールの更新
export const updateUserProfile = async (data: any) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  await updateDoc(profileRef, {
    ...data,
    lastLogin: new Date().toISOString(),
  });
  console.log("プロフィールが更新されました:", userId);
};

// プロフィールの取得
export const getUserProfile = async (): Promise<ProfileData> => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) {
    console.log("プロフィールが見つかりました:", snapshot.data());
    return snapshot.data() as ProfileData;
  } else {
    throw new Error(`ユーザープロフィールが見つかりません: ${userId}`);
  }
};
