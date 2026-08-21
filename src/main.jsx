// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import App from './App.jsx'
import { resolveLocalTheme, applyTheme } from './lib/theme'
import { fetchRemoteTheme } from './config/runtime'

// 2026.8.21 — 테마 결정 2단계.
// ① 로컬(URL·localStorage)로 즉시 적용 → 첫 페인트 전에 끝나므로 깜빡임이 없다.
//    index.html의 인라인 스크립트가 이미 같은 일을 하지만, 번들이 늦게 뜨는 경우를
//    대비해 여기서도 한 번 더 확정한다.
applyTheme(resolveLocalTheme())

// ② 원격(Firestore config/app)은 도착하는 대로 덮어쓴다. 이것이 재배포 없는 킬스위치다.
//    URL 파라미터로 미리보기 중일 때는 원격이 덮어쓰지 않도록 예외를 둔다.
const hasUrlOverride = new URLSearchParams(window.location.search).has('theme')
if (!hasUrlOverride) {
  fetchRemoteTheme().then((remote) => { if (remote) applyTheme(remote) })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
