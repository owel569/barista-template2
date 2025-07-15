import { ImageManager } from "./ImageManager";

export interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  uploadMethod: 'url' | 'upload' | 'generated';
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertMenuItemImage {
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
  uploadMethod?: 'url' | 'upload' | 'generated';
}

export const imageManager = new ImageManager();