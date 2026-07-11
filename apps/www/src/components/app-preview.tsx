import Image from 'next/image';
import React from 'react';

const AppPreview: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-xl bg-white/5 p-px shadow-2xl">
        <div className="absolute -inset-full animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] will-change-transform" />
        <div className="bg-surface-dark relative h-full overflow-hidden rounded-[11px] border border-white/10">
          <Image
            src="/preview.png"
            alt="Yasumu App Preview"
            width={2400}
            height={1600}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
