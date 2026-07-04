const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { VertexAI } = require("@google-cloud/vertexai");
const admin = require("firebase-admin");
const axios = require("axios");

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Vertex AI 초기화 — Firebase Functions는 Google Cloud 환경이라
// 서비스 계정 자동 인증으로 별도 API 키 없이 Gemini 사용 가능
const PROJECT_ID = "wellfit-checkup";
const LOCATION = "us-central1";
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

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

// ── Gemini API 프록시 (Vertex AI 서비스 계정 자동 인증 — API 키 불필요)
// Firebase Functions는 Google Cloud 환경이라 별도 키 없이 Vertex AI Gemini 호출 가능
// 클라이언트에는 Gemini 키가 전혀 노출되지 않음
exports.analyzeHealth = onRequest(
  { cors: true, timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { promptText, faceImageBase64, faceImageMimeType, nailImageBase64, nailImageMimeType } = req.body;

    if (!promptText) {
      return res.status(400).json({ success: false, error: "promptText required" });
    }

    try {
      const model = vertexAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });

      const parts = [{ text: promptText }];

      if (faceImageBase64) {
        parts.push({
          inlineData: {
            mimeType: faceImageMimeType || "image/jpeg",
            data: faceImageBase64,
          },
        });
      }

      if (nailImageBase64) {
        parts.push({
          inlineData: {
            mimeType: nailImageMimeType || "image/jpeg",
            data: nailImageBase64,
          },
        });
      }

      // 503 에러 시 최대 3회 재시도
      let responseText;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await model.generateContent({ contents: [{ role: "user", parts }] });
          responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) break;
          throw new Error("응답 텍스트가 없습니다");
        } catch (err) {
          console.log(`Vertex AI 시도 ${attempt} 실패:`, err.message);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          throw err;
        }
      }

      if (!responseText) {
        throw new Error("응답 텍스트가 없습니다");
      }

      const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        // JSON이 아닌 텍스트 응답 시 그대로 반환
        parsed = { rawText: cleanedText };
      }

      return res.json({ success: true, data: parsed });
    } catch (err) {
      console.error("Vertex AI 프록시 오류:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);
