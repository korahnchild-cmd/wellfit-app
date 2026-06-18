// src/components/BottomNav.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  {
    id: 'home',
    label: '홈',
    path: '/',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          stroke={active ? '#C8956C' : '#B0A0A0'} strokeWidth="1.7" strokeLinejoin="round" fill={active ? 'rgba(200,149,108,0.12)' : 'none'} />
      </svg>
    ),
  },
  {
    id: 'analyze',
    label: '분석하기',
    path: '/upload',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={active ? '#C8956C' : '#B0A0A0'} strokeWidth="1.7" fill={active ? 'rgba(200,149,108,0.12)' : 'none'} />
        <circle cx="12" cy="12" r="4" stroke={active ? '#C8956C' : '#B0A0A0'} strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="1.5" fill={active ? '#C8956C' : '#B0A0A0'} />
      </svg>
    ),
    center: true,
  },
  {
    id: 'partner',
    label: '파트너',
    path: '/partner-dashboard',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"
          stroke={active ? '#8B5E83' : '#B0A0A0'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'mypage',
    label: '마이',
    path: '/mypage',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={active ? '#C8956C' : '#B0A0A0'} strokeWidth="1.7" fill={active ? 'rgba(200,149,108,0.12)' : 'none'} />
        <path d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20"
          stroke={active ? '#C8956C' : '#B0A0A0'} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
];

// 하단 탭 숨길 경로 목록
const HIDDEN_PATHS = ['/login', '/survey', '/analyzing', '/report', '/privacy', '/terms'];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  // 공유/리포트 뷰 경로 숨김
  const isHidden = HIDDEN_PATHS.some(p => location.pathname.startsWith(p))
    || location.pathname.startsWith('/shared/')
    || location.pathname.startsWith('/report-view/');

  if (isHidden || !user) return null;

  return (
    <>
      {/* 하단 여백 확보용 */}
      <div style={{ height: 80 }} />

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '448px',
        zIndex: 100,
        background: 'rgba(253,250,246,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(200,149,108,0.15)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 0 4px',
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            if (item.center) {
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '4px 12px',
                    position: 'relative',
                    marginTop: -20,
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #C8956C 0%, #A87898 50%, #8B5E83 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(200,149,108,0.45), 0 2px 8px rgba(139,94,131,0.25)',
                    border: '2.5px solid rgba(253,250,246,0.9)',
                  }}>
                    {item.icon(isActive)}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#C8956C' : '#B0A0A0',
                    letterSpacing: '-0.2px',
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  minWidth: 56,
                  position: 'relative',
                }}
              >
                {/* 활성 인디케이터 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2.5,
                    borderRadius: 2,
                    background: item.id === 'partner'
                      ? 'linear-gradient(90deg, #8B5E83, #C8956C)'
                      : 'linear-gradient(90deg, #C8956C, #8B5E83)',
                  }} />
                )}
                {item.icon(isActive)}
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? (item.id === 'partner' ? '#8B5E83' : '#C8956C')
                    : '#B0A0A0',
                  letterSpacing: '-0.2px',
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
