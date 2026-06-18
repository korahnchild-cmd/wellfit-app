const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");
const axios = require("axios");

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// ── 카카오 로그인 커스텀 토큰 생성
exports.kakaoCustomToken = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "accessToken required" });
  }

  try {
    // 카카오 사용자 정보 조회
    const kakaoRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoUser = kakaoRes.data;
    const uid = `kakao:${kakaoUser.id}`;
    const email = kakaoUser.kakao_account?.email || null;
    const displayName = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url || null;

    // Firebase 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: "kakao",
      email,
      displayName,
      photoURL,
    });

    // Firestore 사용자 정보 업데이트
    await admin.firestore().collection("users").doc(uid).set({
      email,
      displayName,
      photoURL,
      provider: "kakao",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ customToken, uid, email, displayName, photoURL });
  } catch (err) {
    console.error("카카오 토큰 오류:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── 네이버 로그인 커스텀 토큰 생성 (code → 토큰 교환 → 사용자 정보 → Firebase 토큰)
exports.naverCustomToken = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, clientId, clientSecret, redirectUri } = req.body;
  if (!code) {
    return res.status(400).json({ error: "code required" });
  }

  try {
    // 1. 네이버 액세스 토큰 발급
    const tokenRes = await axios.get("https://nid.naver.com/oauth2.0/token", {
      params: {
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
        redirect_uri: redirectUri,
      },
    });
    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("네이버 액세스 토큰 발급 실패");

    // 2. 네이버 사용자 정보 조회
    const naverRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const naverUser = naverRes.data.response;
    const uid = `naver:${naverUser.id}`;
    const email = naverUser.email || null;
    const displayName = naverUser.name || naverUser.nickname || "네이버 사용자";
    const photoURL = naverUser.profile_image || null;

    // 3. Firebase 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: "naver",
      email,
      displayName,
      photoURL,
    });

    // 4. Firestore 사용자 정보 업데이트
    await admin.firestore().collection("users").doc(uid).set({
      email,
      displayName,
      photoURL,
      provider: "naver",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ customToken, uid, email, displayName, photoURL });
  } catch (err) {
    console.error("네이버 토큰 오류:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
