import Image from 'next/image';
import { petSpriteUrl } from '@/lib/pets/catalog';

type PetPose = 'standing' | 'happy' | 'sleeping' | 'avatar';

/** 2×2 sprite sheet: standing | happy / sleeping | avatar */
const POSITION: Record<PetPose, { left: string; top: string }> = {
  standing: { left: '0', top: '0' },
  happy: { left: '-100%', top: '0' },
  sleeping: { left: '0', top: '-100%' },
  avatar: { left: '-100%', top: '-100%' },
};

export function PetSprite({
  petKey,
  assetVersion = 1,
  pose = 'standing',
  alt,
  size = 180,
  className = '',
}: {
  petKey: string;
  assetVersion?: number;
  pose?: PetPose;
  alt: string;
  size?: number | string;
  className?: string;
}) {
  const numeric = typeof size === 'number';
  return (
    <span
      className={`pet-sprite ${className}`.trim()}
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        // 必须保持正方形，否则竖向容器会露出精灵图上下两格（站立+睡觉）
        width: size,
        height: numeric ? size : undefined,
        aspectRatio: '1 / 1',
        maxWidth: '100%',
        maxHeight: numeric ? undefined : '100%',
        flexShrink: 0,
      }}
    >
      <Image
        src={petSpriteUrl(petKey, assetVersion)}
        alt={alt}
        width={1254}
        height={1254}
        sizes={numeric ? `${Math.ceil(size * 2)}px` : '(max-width: 600px) 600px, 780px'}
        className="pet-sprite__sheet"
        style={{
          position: 'absolute',
          inset: 'auto',
          width: '200%',
          height: '200%',
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'fill',
          ...POSITION[pose],
        }}
      />
    </span>
  );
}
