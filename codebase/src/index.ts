// import * as z from "zod";

// // Import the Genkit core libraries and plugins.
// import { generate } from "@genkit-ai/ai";
// import { configureGenkit } from "@genkit-ai/core";
// import { firebase } from "@genkit-ai/firebase";
// import { googleAI } from "@genkit-ai/googleai";

// // Import models from the Google AI plugin. The Google AI API provides access to
// // several generative models. Here, we import Gemini 1.5 Flash.
// import { gemini15Flash } from "@genkit-ai/googleai";

// // From the Firebase plugin, import the functions needed to deploy flows using
// // Cloud Functions.
// import { firebaseAuth } from "@genkit-ai/firebase/auth";
// import { onFlow } from "@genkit-ai/firebase/functions";

// configureGenkit({
//   plugins: [
//     // Load the Firebase plugin, which provides integrations with several
//     // Firebase services.
//     firebase(),
//     // Load the Google AI plugin. You can optionally specify your API key
//     // by passing in a config object; if you don't, the Google AI plugin uses
//     // the value from the GOOGLE_GENAI_API_KEY environment variable, which is
//     // the recommended practice.
//     googleAI(),
//   ],
//   // Log debug output to tbe console.
//   logLevel: "debug",
//   // Perform OpenTelemetry instrumentation and enable trace collection.
//   enableTracingAndMetrics: true,
// });

// // Define a simple flow that prompts an LLM to generate menu suggestions.
// export const menuSuggestionFlow = onFlow(
//   {
//     name: "menuSuggestionFlow",
//     inputSchema: z.string(),
//     outputSchema: z.string(),
//     authPolicy: firebaseAuth((user) => {
//       // By default, the firebaseAuth policy requires that all requests have an
//       // `Authorization: Bearer` header containing the user's Firebase
//       // Authentication ID token. All other requests are rejected with error
//       // 403. If your app client uses the Cloud Functions for Firebase callable
//       // functions feature, the library automatically attaches this header to
//       // requests.
//       // You should also set additional policy requirements as appropriate for
//       // your app. For example:
//       // if (!user.email_verified) {
//       //   throw new Error("Verified email required to run flow");
//       // }
//     }),
//   },
//   async (subject) => {
//     // Construct a request and send it to the model API.
//     const prompt = `Suggest an item for the menu of a ${subject} themed restaurant`;
//     const llmResponse = await generate({
//       model: gemini15Flash,
//       prompt: prompt,
//       config: {
//         temperature: 1,
//       },
//     });

//     // Handle the response from the model API. In this sample, we just
//     // convert it to a string, but more complicated flows might coerce the
//     // response into structured output or chain the response into another
//     // LLM call, etc.
//     return llmResponse.text();
//   }
// );

import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Request, Response } from "express";

// Firebase Admin SDK を初期化
initializeApp();

// テキストパラメータをHTTPエンドポイントに渡し、Firestoreに挿入
exports.addmessage = onRequest(async (req: Request, res: Response) => {
  // テキストパラメータを取得
  const original = req.query.text as string;

  if (!original) {
    res.status(400).json({ result: "No text provided" });
    return;
  }

  // Firebase Admin SDKを使用してFirestoreにメッセージを追加
  const writeResult = await getFirestore()
    .collection("messages")
    .add({ original });

  // メッセージが正常に書き込まれたことを通知
  res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

// 新しいメッセージが /messages/:documentId/original に追加されたときにリッスンし、
// メッセージの大文字バージョンを /messages/:documentId/uppercase に保存
exports.makeuppercase = onDocumentCreated("/messages/{documentId}", (event) => {
  // Firestoreに書き込まれた現在の値を取得
  const original = event.data?.data().original;

  if (!original) {
    logger.log("No original text found for document", event.params.documentId);
    return null;
  }

  // パラメータ `{documentId}` にアクセス
  logger.log("Uppercasing", event.params.documentId, original);

  const uppercase = original.toUpperCase();

  // Firestoreドキュメントに'uppercase'フィールドを設定（Promiseを返す）
  if (event.data) {
    return event.data.ref.set({ uppercase }, { merge: true });
  } else {
    logger.log("No data found for document", event.params.documentId);
    return null;
  }
});
