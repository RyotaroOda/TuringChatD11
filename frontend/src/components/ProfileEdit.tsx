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
  updateEmail,
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
  Avatar,
  Divider,
  Paper,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { appPaths } from "../App.tsx";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  palette: {
    background: {
      default: "#f5f5f5",
    },
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

  // メールアドレス更新用state
  const [newEmail, setNewEmail] = useState("");

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = event.target;

    setProfile((prev) => {
      if (!prev) return prev;

      // location.xxx の場合、locationオブジェクト内の更新に対応
      if (name.startsWith("location.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          location: {
            ...prev.location,
            [field]: value,
          },
        };
      } else {
        return { ...prev, [name]: value };
      }
    });
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
              region: country === "日本" ? "" : prev.location.region,
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
        // 再認証
        const providerId = user.providerData[0]?.providerId;

        if (providerId === "password") {
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
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } else {
          alert("再認証がサポートされていない認証方法です。");
          return;
        }

        await deleteUser(user);
        alert("アカウントが削除されました。");
        navigate("/");
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

  //#endregion

  //#region その他機能
  const handleQuestionnaireEdit = () => {
    navigate("/questionnaire_edit");
  };

  const handleImpressionEdit = () => {
    navigate("/impression_edit");
  };

  // ログアウト
  const handleLogout = async () => {
    await auth.signOut();
    alert("ログアウトしました");
    navigate("/");
  };

  // 画像生成
  const handleGenerateImage = async () => {
    navigate(appPaths.icon_generator, { state: profile });
  };

  // メールアドレス変更
  const handleChangeEmail = async () => {
    if (user && newEmail) {
      try {
        await updateEmail(user, newEmail);
        alert("メールアドレスが更新されました");
      } catch (error: any) {
        console.error("メールアドレス更新エラー:", error);
        if (error.code === "auth/requires-recent-login") {
          alert("再認証が必要です。再度ログインしてください。");
        } else {
          alert("メールアドレス更新中にエラーが発生しました。");
        }
      }
    } else {
      alert("メールアドレスを入力してください。");
    }
  };
  //#endregion

  if (!profile) return <p>読み込み中...</p>;
  if (errorMessage) return <p style={{ color: "red" }}>{errorMessage}</p>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              borderColor: "#ffffff",
              color: "#ffffff",
              ":hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            プロフィール編集
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h5" gutterBottom>
              基本情報
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {/* ユーザーネーム */}
              <Grid item xs={12}>
                <TextField
                  label="ユーザーネーム"
                  name="name"
                  value={profile?.name || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* プロフィール画像 */}
              <Grid item xs={12} sx={{ textAlign: "center" }}>
                <Avatar
                  alt="Profile Image"
                  src={user?.photoURL || ""}
                  sx={{ width: 100, height: 100, margin: "0 auto" }}
                />
                <Button
                  variant="outlined"
                  onClick={handleGenerateImage}
                  sx={{ mt: 2 }}
                >
                  プロフィール画像生成
                </Button>
              </Grid>

              {/* 年齢 */}
              <Grid item xs={12}>
                <TextField
                  label="年齢"
                  type="number"
                  name="age"
                  value={profile?.age || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* 性別 */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>性別</InputLabel>
                  <Select
                    name="gender"
                    value={profile?.gender || ""}
                    onChange={handleChange}
                    label="性別"
                  >
                    <MenuItem value="no_answer">回答しない</MenuItem>
                    <MenuItem value="male">男性</MenuItem>
                    <MenuItem value="female">女性</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 言語 */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>言語</InputLabel>
                  <Select
                    name="language"
                    value={profile?.language || ""}
                    onChange={handleChange}
                    label="言語"
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang} value={lang}>
                        {lang}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 国 */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>国</InputLabel>
                  <Select
                    name="location.country"
                    value={profile?.location.country || ""}
                    onChange={handleCountryChange}
                    label="国"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 地域 */}
              {profile?.location.country === "日本" ? (
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>地域</InputLabel>
                    <Select
                      name="location.region"
                      value={profile?.location.region || ""}
                      onChange={handleChange}
                      label="地域"
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
                    name="location.region"
                    value={profile?.location.region || ""}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              )}

              {/* プラットフォーム */}
              <Grid item xs={12}>
                <TextField
                  label="プラットフォーム"
                  name="platform"
                  value={profile?.platform || ""}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mt: 2, mb: 2 }} />
              </Grid>

              {/* アンケート */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  実験アンケート
                </Typography>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
                  {profile?.questionnaire ? (
                    <Typography variant="body1">アンケート回答済み</Typography>
                  ) : (
                    <Typography variant="body1">
                      アンケートはまだ回答されていません
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleQuestionnaireEdit}
                    sx={{ mt: 2 }}
                  >
                    アンケートの回答/編集
                  </Button>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mt: 4, mb: 2 }} />
              </Grid>

              {/* アカウント情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  アカウント情報
                </Typography>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    登録メールアドレス: {user?.email || "未設定"}
                  </Typography>
                  <TextField
                    label="新しいメールアドレス"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleChangeEmail}
                    sx={{ mt: 1 }}
                  >
                    メールアドレス登録・変更
                  </Button>

                  <Divider sx={{ mt: 2, mb: 2 }} />

                  <Button variant="outlined" onClick={handleLogout}>
                    ログアウト
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleDelete}
                    sx={{ ml: 26 }}
                  >
                    アカウントを削除
                  </Button>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mt: 4, mb: 2 }} />
              </Grid>

              {/* その他情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  その他情報
                </Typography>
                <Card
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
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

              {/* 更新ボタン */}
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
            </Grid>
          </form>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default ProfileEdit;
