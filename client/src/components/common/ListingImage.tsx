import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ListingImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const ListingImage: React.FC<ListingImageProps> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(!src);

  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={alt}>
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-100 via-teal-50 to-amber-50 text-slate-500">
          <ImageIcon className="h-7 w-7" aria-hidden="true" />
          <span className="text-[10px] font-medium">Photo unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
