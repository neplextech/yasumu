import React from 'react';
import Image from 'next/image';

const AppPreview: React.FC = () => {
  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="relative rounded-xl overflow-hidden p-px shadow-2xl bg-white/5">
        <div className="absolute -inset-full animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] will-change-transform" />
        <div className="relative rounded-[11px] bg-surface-dark overflow-hidden border border-white/10 h-full">
          <Image
            src="/preview.png"
            alt="Yasumu App Preview"
            width={2400}
            height={1600}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
