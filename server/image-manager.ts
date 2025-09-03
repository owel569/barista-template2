import { ImageManager } from "./ImageManager";

export interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  // Not stored in DB schema; may be inferred at runtime
  uploadMethod?: 'url' | 'upload' | 'generated' | 'pexels';
  createdAt: Date;
  // menu_item_images has no updatedAt column
  updatedAt?: Date;
}

export interface InsertMenuItemImage {
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
  // Not persisted; only used to inform callers
  uploadMethod?: 'url' | 'upload' | 'generated' | 'pexels';
}

export const imageManager = new ImageManager();