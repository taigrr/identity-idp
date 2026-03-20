import { useContext, useState, useEffect, useRef } from 'react';

import FileBase64CacheContext from '../context/file-base64-cache';

interface FileImageProps {
  file: Blob;
  alt: string;
  className?: string;
}

function FileImage({ file, alt, className }: FileImageProps) {
  const cache = useContext(FileBase64CacheContext);
  const [, forceRender] = useState(0);
  const imageData = cache.get(file);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const reader = new window.FileReader();
    reader.onload = ({ target }) => {
      if (target?.result && typeof target.result === 'string' && isMountedRef.current) {
        cache.set(file, target.result);
        forceRender((prevState) => 1 - prevState);
      }
    };
    reader.readAsDataURL(file);

    return () => {
      isMountedRef.current = false;
    };
  }, [file, cache]);

  const classes = [
    'document-capture-file-image',
    !imageData && 'document-capture-file-image--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return imageData ? (
    <img src={imageData} alt={alt} className={classes} />
  ) : (
    <span className={classes} />
  );
}

export default FileImage;
