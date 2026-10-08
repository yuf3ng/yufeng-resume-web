import { IDBPIndex, IDBPObjectStore } from "idb";
import {
  CustomDBKeys,
  CustomIDBPDatabase,
  CustomDBValues,
  CustomDBSchemaExtended,
  CustomDBSchema,
} from "./db";

export const MIN_DATE = new Date(-8640000000000000);
export const MAX_DATE = new Date(8640000000000000);
export const MIN_STRING = "";
export const MAX_STRING = "\uffff";

export abstract class AbstractIDBService<M extends CustomDBValues> {
  public readonly db: CustomIDBPDatabase;
  public readonly storeName: CustomDBKeys;
  public readonly bottomsStoreName: CustomDBKeys;
  public readonly idbChainDefaultLimit: number;

  constructor({ db }: { db: CustomIDBPDatabase }) {
    this.db = db;
    this.storeName = this.getStoreName();
    this.bottomsStoreName = this.getBottomsStoreName();
  }

  public async get({ key }: { key: string }): Promise<M> {
    return this.db.get(this.storeName, key) as Promise<M>;
  }

  public async getAll(options?: { key?: string; count?: number }) {
    return this.db.getAll(this.storeName, options?.key, options?.count);
  }

  public async set({ val }: { val: M }) {
    return this.db.put(this.storeName, val);
  }
  public async del({ key }: { key: string }) {
    return this.db.delete(this.storeName, key);
  }
  public async clear() {
    return this.db.clear(this.storeName);
  }
  public async keys() {
    return this.db.getAllKeys(this.storeName);
  }

  public getAPIIndex(
    store: IDBPObjectStore<
      CustomDBSchemaExtended,
      (keyof CustomDBSchema)[],
      keyof CustomDBSchema,
      "readonly" | "readwrite"
    >,
  ): IDBPIndex {
    return store.index("api" as never) as IDBPIndex;
  }

  protected abstract getStoreName(): CustomDBKeys;

  protected abstract getBottomsStoreName(): CustomDBKeys;
}
