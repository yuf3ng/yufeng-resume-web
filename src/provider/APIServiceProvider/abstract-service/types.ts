import { OptionalKeys } from "@src/types";
import { AbstractModel } from "../abstract-model";

export type NewModel<M extends AbstractModel> = OptionalKeys<
  M,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOne<M extends AbstractModel> = {
  filter: Filter<M>;
  update: { $set?: Partial<M>; $unset?: { [K in keyof M]?: "" } };
};
export type Find<M extends AbstractModel> = FindOne<M> & {
  sort?: Sort<M>;
  options?: { pageState?: string; limit?: number; ignoreLimits?: boolean };
};

export type FindResponse = {
  data: { documents: any[]; nextPageState: null | string };
};
export type FindOne<M extends AbstractModel> = {
  filter?: Filter<M>;
};
export type Filter<M extends AbstractModel> = {
  [K in keyof M]?: {
    $eq?: M[K];
    $in?: M[K][];
    $gt?: M[K];
    $lt?: M[K];
  };
};
export type Sort<M> = { [K in keyof M]?: number };

export type ListTableMetadataResponseJSON = {
  status: {
    tables: {
      name: string;
      definition: {
        columns: Record<
          string,
          {
            type: "uuid" | "timestamp" | "text" | "list";
            valueType?: "uuid" | "timestamp" | "text";
          }
        >;
        primaryKey: {
          partitionBy: string[];
          partitionSort: Record<string, 1 | -1>;
        };
      };
    }[];
  };
};
