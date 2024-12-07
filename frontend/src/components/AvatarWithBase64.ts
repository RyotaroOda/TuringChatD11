import React, { useState, useEffect } from "react";
import Avatar from "@mui/material/Avatar";

const AvatarWithBase64 = ({ imageUrl }) => {
  const [base64Image, setBase64Image] = useState(null);

  useEffect(() => {
    const convertToBase64 = async () => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }
        const blob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Image(reader.result); // Base64形式の画像データを設定
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error converting image to Base64:", error);
      }
    };

    if (imageUrl) {
      convertToBase64();
    }
  }, [imageUrl]);

  return (
    <Avatar
      src={base64Image || ""}
      alt="新しいアイコン"
      sx={{ width: 200, height: 200, margin: "auto", mb: 3 }}
    />
  );
};

export default AvatarWithBase64;
