// src/components/ThumbnailOrNoImage.jsx
import { useState } from "react";

const ThumbnailOrNoImage = ({ bno, sizeClass="w-32 h-32"}) => {
  const [imgError, setImgError] = useState(false);

 return (
    <div className={`${sizeClass} flex items-center justify-center`}>
      {imgError ? (
        <div className="w-full h-full flex items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-300 rounded text-xs">
          No Image
        </div>
      ) : (
        <img
          src={`/api/thumbnail/${bno}`}
          alt="썸네일"
          className="w-full h-full rounded border border-zinc-200"
          onError={() => setImgError(true)}
          draggable={false}
        />
      )}
    </div>
  );
};

export default ThumbnailOrNoImage;