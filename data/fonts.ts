export type FontMeta = {
  id: string;
  name: string;
  category: string;
  file: string; // path under /public/fonts, e.g., "/fonts/myfont.woff2"
  isPremium: boolean;
  rating?: number;
  reviewsCount?: number;
  supports?: {
    bold?: boolean;
    italic?: boolean;
  };
  visible?: boolean;
  sortOrder?: number;
};

export type FontsDB = {
  categories: string[];
  fonts: FontMeta[];
};

export const initialFonts: FontsDB = {
  categories: ["Serif", "Sans-Serif", "Corsivo", "Stampatello", "Gotico"],
  fonts: [
    // seed with empty, admin will upload
  ],
};