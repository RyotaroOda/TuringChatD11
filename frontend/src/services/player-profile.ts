// frontend/src/services/player-profile.ts
import { updateProfile, User } from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { ProfileData } from "shared/dist/types";
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

export const createUserProfile = async (user: User) => {
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, user.uid); // Firestoreのプロファイルドキュメント参照
  const initialProfileData: ProfileData = {
    userId: user.uid,
    name: user.displayName || "未設定",
    rating: 0,
    bots: [],
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
    platform: "web",
    win: 0,
    lose: 0,
  };
  await setDoc(profileRef, initialProfileData);
  console.log("新規プロフィールが作成されました:", user.uid);
};

// プロフィールの更新
export const updateUserProfile = async (
  userId: string,
  data: Partial<ProfileData>
) => {
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  await updateDoc(profileRef, {
    ...data,
    lastLogin: new Date().toISOString(),
  });
  console.log("プロフィールが更新されました:", userId);
};

// プロフィールの取得
export const getUserProfile = async (userId: string) => {
  const profileRef = doc(firestore, DATABASE_PATHS.route_profiles, userId);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) {
    return snapshot.data();
  } else {
    console.log("ユーザープロフィールが見つかりません:", userId);
    return null;
  }
};

// プロフィールの表示
const displayProfile = async (userId: string) => {
  const profile = await getUserProfile(userId);
  console.log("ユーザープロフィール:", profile);
};
