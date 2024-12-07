import { updateProfile } from "firebase/auth";
import { auth, storage } from "./firebase_f.ts";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export const uploadIcon = async (imageUrl: string) => {
  const user = auth.currentUser;
  const baseURL = imageUrl as Base64URLString;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  try {
    const storageRef = ref(storage, `icons/${user.uid}`);
    // Data URLを直接アップロード
    const snapshot = await uploadString(storageRef, baseURL, "data_url");
    console.log("Image uploaded successfully:", snapshot);

    const downloadUrl = await getDownloadURL(storageRef);
    console.log("Download URL:", downloadUrl);

    await updateProfile(user, { photoURL: downloadUrl });
    console.log("Profile updated successfully!");
  } catch (error) {
    console.error("Error uploading image and updating profile:", error);
  }
};
