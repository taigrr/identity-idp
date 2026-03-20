import { useContext, useState, useEffect } from 'react';

import { useIfStillMounted } from '@/hooks';

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
  const ifStillMounted = useIfStillMounted();

  useEffect(() => {
    const reader = new window.FileReader();
    reader.onload = ({ target }) => {
      if (target?.result && typeof target.result === 'string') {
        cache.set(file, target.result);
        ifStillMounted(forceRender)((prevState) => 1 - prevState);
      }
    };
    reader.readAsDataURL(file);
  }, [file, cache, ifStillMounted]);

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
