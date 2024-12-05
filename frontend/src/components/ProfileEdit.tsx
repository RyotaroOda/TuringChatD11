// frontend/src/components/ProfileEdit.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../API/firebase_f.ts";
import { updateUserProfile } from "../API/firestore-database_f.ts";
import { ProfileData } from "../shared/types.ts";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  CssBaseline,
  SelectChangeEvent,
  ListSubheader,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Timestamp } from "@google-cloud/firestore";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const languages = [
  "日本語",
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Russian",
];
const countries = [
  "日本",
  "United States",
  "France",
  "Germany",
  "China",
  "Russia",
  "Brazil",
];

const prefectureGroups = [
  { label: "北海道", options: ["北海道"] },
  {
    label: "東北",
    options: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  {
    label: "関東",
    options: [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県",
    ],
  },
  {
    label: "中部",
    options: [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県",
    ],
  },
  {
    label: "関西",
    options: [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県",
    ],
  },
  {
    label: "中国",
    options: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  { label: "四国", options: ["徳島県", "香川県", "愛媛県", "高知県"] },
  {
    label: "九州",
    options: [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県",
    ],
  },
];

const ProfileEdit: React.FC = () => {
  //#region init
  const [profile, setProfile] = useState<ProfileData>(useLocation().state);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = event.target;
    setProfile((prev) => (prev ? { ...prev, [name as string]: value } : prev));
  };

  useEffect(() => {
    if (profile?.language === "日本語") {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              location: {
                ...prev.location,
                country: "日本",
              },
            }
          : prev
      );
    }
  }, [profile?.language]);

  const handleCountryChange = (e: SelectChangeEvent) => {
    const country = e.target.value;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            location: {
              ...prev.location,
              country,
              city: country === "日本" ? "" : prev.location.region,
            },
          }
        : prev
    );
  };

  const handleCityChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { value } = event.target;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            location: {
              ...prev.location,
              city: value,
            },
          }
        : prev
    );
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

  // 感想編集画面へ遷移
  const handleImpressionEdit = () => {
    navigate("/impression_edit");
  };
  //#endregion

  if (!profile) return <p>読み込み中...</p>;
  if (errorMessage) return <p style={{ color: "red" }}>{errorMessage}</p>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Button
            variant="outlined" // ボタンのスタイルをテキストベースに
            color="inherit"
            startIcon={<ArrowBackIcon />} // 矢印アイコンを追加
            sx={{
              textTransform: "none", // テキストをそのままの形で表示（全大文字を防ぐ）
              borderColor: "#ffffff", // ボーダーカラーを白に設定
              color: "#ffffff", // テキストカラーを白
              ":hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)", // ホバー時の背景色
              },
            }}
            onClick={() => navigate("/")}
          >
            戻る
          </Button>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
              whiteSpace: "nowrap", // テキストの折り返しを防止
              overflow: "hidden", // 必要に応じてあふれたテキストを隠す
              textOverflow: "ellipsis", // 必要に応じて省略記号を表示
            }}
          >
            プロフィール編集
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <Box mt={4}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h5">基本情報</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="名前"
                  name="name"
                  value={profile?.name || ""}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="年齢"
                  type="number"
                  name="age"
                  value={profile?.age || ""}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>性別</InputLabel>
                  <Select
                    name="gender"
                    value={profile?.gender || ""}
                    onChange={handleChange}
                  >
                    <MenuItem value="no_answer">回答しない</MenuItem>
                    <MenuItem value="male">男性</MenuItem>
                    <MenuItem value="female">女性</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>言語</InputLabel>
                  <Select
                    name="language"
                    value={profile?.language || ""}
                    onChange={handleChange}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang} value={lang}>
                        {lang}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>国</InputLabel>
                  <Select
                    name="location.country"
                    value={profile?.location.country || ""}
                    onChange={handleCountryChange}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {profile?.location.country === "日本" ? (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>地域</InputLabel>
                    <Select
                      name="location.city"
                      value={profile?.location.region || ""}
                      onChange={handleChange}
                    >
                      {prefectureGroups.flatMap((group) => [
                        <ListSubheader key={`${group.label}-header`}>
                          {group.label}
                        </ListSubheader>,
                        ...group.options.map((prefecture) => (
                          <MenuItem key={prefecture} value={prefecture}>
                            {prefecture}
                          </MenuItem>
                        )),
                      ])}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    label="地域"
                    name="location.city"
                    value={profile?.location.region || ""}
                    onChange={handleCityChange}
                    fullWidth
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="プラットフォーム"
                  name="platform"
                  value={profile?.platform || ""}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h5">その他情報</Typography>
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="body1">
                      レーティング: {profile?.rating || 0}
                    </Typography>
                    <Typography variant="body1">
                      勝利数: {profile?.win || 0}
                    </Typography>
                    <Typography variant="body1">
                      敗北数: {profile?.lose || 0}
                    </Typography>
                    <Typography variant="body1">
                      登録日: {profile?.signUpDate || ""}
                    </Typography>
                    <Typography variant="body1">
                      最終ログイン: {profile?.lastLoginDate || ""}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h5">実験アンケート</Typography>
                {profile?.questionnaire ? (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="body1">
                        質問内容: {profile.questionnaire.questions.join(", ")}
                      </Typography>
                      <Typography variant="body1">
                        回答: {profile.questionnaire.answers.join(", ")}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Typography variant="body1">
                    アンケートはまだ回答されていません
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleImpressionEdit}
                  sx={{ mt: 2 }}
                >
                  アンケートの回答/編集
                </Button>
              </Grid>

              <Grid item xs={12} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  fullWidth
                >
                  更新
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleDelete}
                  fullWidth
                >
                  アカウントを削除
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default ProfileEdit;
