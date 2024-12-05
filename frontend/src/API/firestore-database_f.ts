// frontend/src/services/firestore-database.ts
import { updateProfile } from "firebase/auth";
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import {
  AIModel,
  BotSetting,
  Impression,
  ProfileData,
  QuestionnaireData,
} from "../shared/types.ts";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { auth, firestore } from "./firebase_f.ts";

//#region Authプロフィール

/**
 * Firebase Auth プロフィールを更新
 * @param displayName 表示名
 * @param photoURL プロフィール画像URL
 */
const updateAuthProfile = async (displayName: string, photoURL: string) => {
  const user = auth.currentUser;
  if (user) {
    await updateProfile(user, { displayName, photoURL });
    console.log("Authプロフィールが更新されました:", displayName, photoURL);
  }
};

//#endregion

//#region ProfileEdit

/** 使用しているプラットフォームを判定
 * @returns プラットフォーム名 (mobile, desktop, web)
 */
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

/** 新しいユーザープロフィールを作成
 */
export const createUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ユーザーが認証されていません");
  }

  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, user.uid);
  const botData: BotSetting[] = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    prompt: `設定${index + 1}`,
    model: AIModel["gpt-4"],
    name: `${index + 1}`,
    temperature: 1,
    top_p: index < 3 ? 1 : 0,
  }));

  const initialProfileData: ProfileData = {
    userId: user.uid,
    name: user.displayName || "未設定",
    rating: 0,
    bots: {
      defaultId: 1,
      data: botData,
    },
    questionnaire: null,
    signUpDate: Timestamp.now(),
    lastLoginDate: Timestamp.now(),
    lastGeneratedImage: new Timestamp(Date.now() - 24 * 60 * 60, 0),
    age: null,
    gender: "no_answer",
    language: "Japanese",
    location: {
      country: "japan",
      region: null,
    },
    platform: detectPlatform(),
    win: 0,
    lose: 0,
    draw: 0,
  };

  await setDoc(profileRef, initialProfileData);
  console.log("新規プロフィールが作成されました:", user.uid);
};

/** ユーザープロフィールを更新
 * @param data 更新データ
 */
export const updateUserProfile = async (data: Partial<ProfileData>) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }

  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  await updateDoc(profileRef, {
    ...data,
    lastLoginDate: Timestamp.now(),
  });

  console.log("プロフィールが更新されました:", userId);
};

/**
 * 最終ログイン日時を更新
 */
export const updateLastLogin = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }

  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  await updateDoc(profileRef, {
    lastLoginDate: Timestamp.now(),
  });

  console.log("最終ログインが更新されました:", userId);
};

export const updateLastGeneratedImage = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }

  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  await updateDoc(profileRef, {
    lastGeneratedImage: Date.now(),
  });

  console.log("最終ログインが更新されました:", userId);
};

/** ユーザープロフィールを取得
 * @returns プロフィールデータ
 */
export const getUserProfile = async (): Promise<ProfileData> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  const userId = user.uid;

  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  const snapshot = await getDoc(profileRef);
  console.log("プロフィールデータを取得:", snapshot);

  // ProfileDataの初期値を定義
  const botData: BotSetting[] = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    prompt: `設定${index + 1}`,
    model: AIModel["gpt-4"],
    name: `${index + 1}`,
    temperature: 1,
    top_p: index < 3 ? 1 : 0,
  }));

  const initialProfileData: ProfileData = {
    userId: userId,
    name: user.displayName || "未設定",
    rating: 0,
    bots: {
      defaultId: 1,
      data: botData,
    },

    questionnaire: null,
    signUpDate: Timestamp.now(),
    lastLoginDate: Timestamp.now(),
    lastGeneratedImage: new Timestamp(
      Timestamp.now().seconds - 24 * 60 * 60,
      0
    ),
    age: null,
    gender: "no_answer",
    language: "Japanese",
    location: {
      country: "japan",
      region: null,
    },
    platform: detectPlatform(),
    win: 0,
    lose: 0,
    draw: 0,
  };

  if (snapshot.exists()) {
    const profileData = snapshot.data() as Partial<ProfileData>;
    console.log("取得したプロフィール:", profileData);

    // 不足しているプロパティを補完
    const completeProfileData: ProfileData = {
      ...initialProfileData,
      ...profileData,
    };

    // 不足があった場合のみ更新
    const missingFields = Object.keys(initialProfileData).filter(
      (key) => !(key in profileData)
    );

    if (missingFields.length > 0) {
      console.log("欠けているフィールドを補完します:", missingFields);
      updateUserProfile(completeProfileData);
    }

    await updateLastLogin();
    return completeProfileData;
  } else {
    throw new Error(`ユーザープロフィールが見つかりません: ${userId}`);
  }
};

//#endregion

//#region Questionnaire

/**
 * アンケートを更新
 * @param data アンケートデータ
 */
export const updateUserQuestionnaire = async (data: QuestionnaireData) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }

  const questionnaireRef = doc(
    firestore,
    DATABASE_PATHS.questionnaires(userId),
    userId
  );
  await updateDoc(questionnaireRef, data);

  console.log("アンケートが更新されました:", userId);
};

/**
 * 感想を追加
 * @param data 感想の内容
 */
export const addUserImpression = async (data: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("ユーザーIDが見つかりません");
  }

  const impressionRef = collection(
    firestore,
    DATABASE_PATHS.impression(userId)
  );
  const impressionData: Impression = {
    impression: data,
    date: Timestamp.now(),
    user: auth.currentUser?.displayName || "未設定",
    userId: userId,
  };

  await addDoc(impressionRef, impressionData);
  console.log("感想が追加されました:", impressionData);

  const rootRef = collection(firestore, DATABASE_PATHS.route_impressions);
  await addDoc(rootRef, impressionData);
};

//#endregion

//#region Rating
export const updateRating = async (userId: string, score: number) => {
  // レーティングの更新処理
  const profile = await getUserProfile();
  const newRating = profile.rating + score;
  console.log("newRating", newRating);
  await updateUserProfile({ rating: newRating });
  console.log("レートが更新されました:", userId, newRating);
};
//#endregion
