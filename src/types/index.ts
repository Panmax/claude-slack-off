export interface BookPage {
  content: string;
  pageNumber: number;
  totalPages: number;
  chapter?: string;
}

export interface BookMeta {
  filePath: string;
  title: string;
  format: "txt" | "epub";
  totalPages: number;
  chapters?: Chapter[];
}

export interface Chapter {
  title: string;
  startPage: number;
}

export interface WebPage {
  url: string;
  title: string;
  content: string; // markdown
  links: WebLink[];
}

export interface WebLink {
  index: number;
  text: string;
  url: string;
}

export interface Bookmark {
  filePath: string;
  page: number;
  updatedAt: string;
}

export interface Favorite {
  url: string;
  title: string;
  addedAt: string;
}

export interface AppConfig {
  disguiseKey: string;
  defaultLang: "ts" | "py" | "go" | "rs";
  typeSpeed: number;
}

export type AppMode = "reader" | "browser";
export type DisplayMode = "normal" | "disguise";
export type TemplateLang = "ts" | "py" | "go" | "rs";

export interface DisguisedLine {
  text: string;
  type: "code" | "comment" | "status" | "blank";
}
