import { Post } from "@src/provider/APIServiceProvider/post/post-model";
import {
  Preview,
  PreviewType,
} from "@src/provider/APIServiceProvider/preview/preview-model";
import { DBSchema, IDBPDatabase } from "idb";

export interface CustomDBSchema {
  posts: {
    key: string;
    value: Post;
    indexes: { preview_id: string; api: [string, Date, string] };
  };

  previews: {
    key: string;
    value: Preview;
    indexes: { type: PreviewType; api: [PreviewType, Date, string] };
  };
  "posts-bottoms": {
    key: string;
    value: string;
    indexes: {};
  };
  "previews-bottoms": {
    key: string;
    value: string;
    indexes: {};
  };
}
export type CustomDBValues = CustomDBSchema[keyof CustomDBSchema]["value"];
export type CustomDBKeys = keyof CustomDBSchema;

export interface CustomDBSchemaExtended extends DBSchema, CustomDBSchema {}

export type CustomIDBPDatabase = IDBPDatabase<CustomDBSchemaExtended>;
