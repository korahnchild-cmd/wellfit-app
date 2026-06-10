// src/pages/TermsPage.jsx
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="relative z-10 flex flex-col min-h-screen px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-cream-dark rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-[#7A6060]" />
          </button>
          <h1 className="text-lg font-bold text-[#3D2B2B]">이용약관</h1>
        </div>

        <div className="space-y-6 text-[#3D2B2B] pb-12">
          <div>
            <p className="text-xs text-[#9A8080]">시행일: 2026년 6월 10일</p>
          </div>

          <p className="text-sm leading-relaxed text-[#5A4040]">
            웰핏+ CHECK-UP(이하 "서비스")을 이용해 주셔서 감사합니다.
            본 약관은 서비스 이용에 관한 기본 사항을 규정합니다.
          </p>

          {/* 1조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제1조 서비스 소개</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                웰핏+ CHECK-UP은 AI 기반 건강 라이프스타일 코칭 서비스입니다.
                본 서비스는 <span className="font-semibold">의료 진단, 처방, 치료를 대체하지 않으며</span>,
                건강 관리에 참고하는 라이프스타일 코칭 정보를 제공합니다.
              </p>
            </div>
          </section>

          {/* 2조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제2조 이용 자격</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                본 서비스는 <span className="font-semibold">만 19세 이상</span>의 성인만 이용 가능합니다.
                만 19세 미만의 경우 서비스 이용이 제한됩니다.
              </p>
            </div>
          </section>

          {/* 3조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제3조 이용 요금 및 결제</h2>
            <div className="card-glass p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#3D2B2B]">무료 체험</span>
                <span className="text-sm text-mauve font-bold">14일</span>
              </div>
              <div className="h-px bg-cream-deeper" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#3D2B2B]">유료 구독</span>
                <span className="text-sm text-mauve font-bold">월 59,800원</span>
              </div>
              <p className="text-xs text-[#9A8080]">
                유료 구독은 언제든지 해지 가능하며, 해지 시 다음 결제일부터 청구되지 않습니다.
              </p>
            </div>
          </section>

          {/* 4조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제4조 청약철회</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                유료 결제일로부터 <span className="font-semibold">14일 이내</span>에 청약철회를 요청하실 수 있습니다.
                단, 콘텐츠 이용이 시작된 경우 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라
                철회가 제한될 수 있습니다.
                철회 요청: korahnchild@gmail.com
              </p>
            </div>
          </section>

          {/* 5조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제5조 금지 행위</h2>
            <ul className="text-sm text-[#5A4040] space-y-1.5 list-disc list-inside leading-relaxed">
              <li>타인의 사진 또는 이미지 무단 업로드</li>
              <li>계정 공유 및 양도</li>
              <li>서비스의 상업적 무단 이용 및 재판매</li>
              <li>서비스 시스템 해킹 또는 비정상적 방법의 접근</li>
              <li>허위 정보 입력 및 다른 이용자에 대한 피해 행위</li>
            </ul>
          </section>

          {/* 6조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제6조 면책 조항</h2>
            <div className="bg-rose-gold/10 border border-rose-gold/30 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-rose-gold">⚠ 중요 안내</p>
              <ul className="text-sm text-[#5A4040] space-y-1.5 list-disc list-inside leading-relaxed">
                <li>본 서비스의 AI 분석 결과는 의료 진단을 대체할 수 없습니다.</li>
                <li>건강 이상 증상이 있는 경우 반드시 의료 전문가와 상담하시기 바랍니다.</li>
                <li>AI 분석 결과는 참고용이며, 서비스 제공자는 분석 결과의 정확성에 대해 법적 책임을 지지 않습니다.</li>
                <li>이용자의 설문 응답 오류로 인한 분석 결과 오류에 대해 책임지지 않습니다.</li>
              </ul>
            </div>
          </section>

          {/* 7조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제7조 서비스 변경 및 중단</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                서비스 제공자는 서비스 내용 변경 또는 중단 시 사전 공지합니다.
                불가피한 사유로 사전 공지 없이 변경 또는 중단된 경우, 이용자에게 발생한 손해에 대해
                고의 또는 중과실이 없는 한 책임을 지지 않습니다.
              </p>
            </div>
          </section>

          {/* 8조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제8조 준거법 및 분쟁 해결</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                본 약관은 <span className="font-semibold">대한민국 법률</span>을 준거법으로 합니다.
                서비스 이용과 관련한 분쟁 발생 시 관할 법원은 민사소송법에 따릅니다.
              </p>
            </div>
          </section>

          <div className="pt-2">
            <p className="text-xs text-[#B0A0A0] text-center">
              본 약관은 2026년 6월 10일부터 시행됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
