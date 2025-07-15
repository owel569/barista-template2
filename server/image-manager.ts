import { ImageManager } from "./ImageManager";

export interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  uploadMethod: 'url' | 'upload' | 'generated' | 'pexels';
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertMenuItemImage {
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
  uploadMethod?: 'url' | 'upload' | 'generated' | 'pexels';
}

export const imageManager = new ImageManager();