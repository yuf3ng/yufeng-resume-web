import { LocalStoragePrefix } from "@src/common/util/local-storage";
import {
  AbstractIDBService,
  MAX_DATE,
  MAX_STRING,
  MIN_DATE,
  MIN_STRING,
} from "@src/provider/IDBProvider/abstract-idb-service";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../post/post-model";
import { Preview } from "../preview/preview-model";
import {
  Filter,
  Find,
  FindOne,
  FindResponse,
  ListTableMetadataResponseJSON,
  NewModel,
  UpdateOne,
} from "./types";

export type AllModels = Post | Preview;
export type ExtractModel<T> = T extends AbstractService<infer U> ? U : never;
const API_MAX_PAGE_SIZE = 20;
const FIND_DEFAULT_LIMIT = API_MAX_PAGE_SIZE;
const IDBCHAIN_DEFAULT_LIMIT = API_MAX_PAGE_SIZE;

export abstract class AbstractService<
  M extends AllModels,
  N extends NewModel<M> = NewModel<M>,
> {
  public collectionName: string;
  public partitionColumns: (keyof M)[];
  public clusteringColumns: (keyof M)[];
  public localStorageKeyPrefix: string = LocalStoragePrefix.Models;
  public keyspace: string = "default_keyspace";
  public baseURL: string;
  public token?: string;
  public keyspaceURL: string;
  public tableURL: string;
  public tableEventsURL: string;
  public idbService: AbstractIDBService<M>;

  constructor({
    baseURL,
    token,
    idbService,
  }: {
    baseURL: string;
    token?: string;
    idbService: AbstractIDBService<M>;
  }) {
    this.baseURL = baseURL;
    this.token = token;
    this.collectionName = this.getCollectionName();
    this.partitionColumns = this.getPartitionColumns();
    this.clusteringColumns = this.getClusteringColumns();
    this.idbService = idbService;
    this.keyspaceURL = `${this.baseURL}/api/json/v1/${this.keyspace}`;
    this.tableURL = `${this.keyspaceURL}/${this.collectionName}`;
    this.tableEventsURL = `${this.keyspaceURL}/${this.collectionName}_events`;
  }
  public async listTableNames() {
    const responseJSON = (await this.fetchAPI(
      {
        body: { listTables: { options: { explain: false } } },
      },
      { url: this.keyspaceURL },
    )) as { status: { tables: string[] } };
    return responseJSON.status.tables;
  }

  public async listTableMetadata() {
    const responseJSON = (await this.fetchAPI(
      {
        body: { listTables: { options: { explain: true } } },
      },
      { url: this.keyspaceURL },
    )) as ListTableMetadataResponseJSON;
    return responseJSON;
  }

  public async find(find?: Find<M>) {
    find = find ?? {};
    find.filter = find.filter ?? {};
    find.options = find.options ?? {};
    if (find.options.ignoreLimits) {
      delete find.options.limit;
      delete find.options.ignoreLimits;
    } else if (!find.options.limit) {
      find.options.limit = FIND_DEFAULT_LIMIT;
    }

    let responseJSON = await this.fetchAPI({
      body: { find },
    });

    let results: M[];
    if (responseJSON.data) {
      if (responseJSON.data.nextPageState) {
        const models: M[][] = [responseJSON.data.documents ?? []];
        let nextPageState: string | null = responseJSON.data.nextPageState;
        while (nextPageState != null) {
          const newFind = {
            ...find,
            options: { pageState: nextPageState },
          };
          responseJSON = await this.fetchAPI({
            body: { find: newFind },
          });
          if (responseJSON.data && responseJSON.data.documents) {
            models.push(responseJSON.data.documents);
            nextPageState = responseJSON.data.nextPageState;
          } else {
            nextPageState = null;
          }
        }
        results = models.flat();
      } else {
        results = (responseJSON.data.documents as M[]) ?? [];
      }
    } else {
      throw new Error();
    }
    results.forEach((model) => {
      this.deserializeJSONModel(model);
    });
    return results;
  }

  public async findOne(findOne?: FindOne<M>) {
    findOne = findOne ?? {};
    findOne.filter = findOne.filter ?? {};
    const responseJSON = await this.fetchAPI({
      body: { findOne },
    });

    if (responseJSON.data) {
      if (responseJSON.data.document) {
        return this.deserializeJSONModel(responseJSON.data.document);
      }
      return null;
    } else {
      throw new Error();
    }
  }

  public async updateOne(updateOne: UpdateOne<M>) {
    if (!updateOne.update.$set) updateOne.update.$set = {};
    updateOne.update.$set.updated_at =
      updateOne.update.$set.updated_at ?? new Date();
    for (const col of this.partitionColumns) {
      updateOne.update.$set[col] = undefined;
    }
    for (const col of this.clusteringColumns) {
      updateOne.update.$set[col] = undefined;
    }
    await this.fetchAPI({ body: { updateOne } });
  }

  public async insert(newModels: N[]) {
    const date = new Date();
    for (const newModel of newModels) {
      newModel.id = newModel.id ?? uuidv4();
      newModel.created_at = newModel.created_at ?? date;
      newModel.updated_at = newModel.updated_at ?? date;
    }
    await this.fetchAPI({
      body: { insertMany: { documents: newModels } },
    });
  }

  public async insertOne(newModel: N) {
    newModel.id = newModel.id ? newModel.id : uuidv4();
    const date = new Date();
    newModel.created_at = newModel.created_at ? newModel.created_at : date;
    newModel.updated_at = newModel.updated_at ? newModel.updated_at : date;
    await this.fetchAPI({
      body: { insertOne: { document: newModel } },
    });
  }

  public async duplicateTo(tableName: string) {
    const models = await this.find({ options: { ignoreLimits: true } });
    await this.fetchAPI(
      {
        body: { insertMany: { documents: models } },
      },
      { url: `${this.keyspaceURL}/${tableName}` },
    );
  }

  public areEqual(first: M, second: M) {
    return first.id === second.id;
  }

  public getClusteringValues(model: M): M[keyof M][] {
    const results = [];
    for (const clusteringColumn of this.clusteringColumns) {
      results.push(model[clusteringColumn]);
    }
    return results;
  }
  public abstract getFilterForModelsEqualOrBelow(model: M): Filter<M>;

  public getPartitionValues(model: Partial<M>) {
    const partitionColumns = this.partitionColumns;
    const partitionValues: any[] = [];
    for (const partitionColumn of partitionColumns) {
      const partitionValue = model[partitionColumn];
      if (partitionValue === null || partitionValue === undefined) {
        throw new Error();
      }
      partitionValues.push(partitionValue);
    }
    return partitionValues;
  }

  public async getIDBChainFromTop(
    range: IDBKeyRange,
    options?: { limit?: number },
  ) {
    const storeName = this.idbService.storeName;
    const bottomsStoreName = this.idbService.bottomsStoreName;

    const transaction = this.idbService.db.transaction(
      [storeName, bottomsStoreName],
      "readonly",
    );
    const store = transaction.objectStore(storeName);
    const bottomsStore = transaction.objectStore(bottomsStoreName);
    const index = this.idbService.getAPIIndex(store);
    const IDBChain: M[] = [];
    const limit = options?.limit ?? IDBCHAIN_DEFAULT_LIMIT;
    let cursor = await index.openCursor(range, "prev");
    if (cursor) {
      let currentModel = cursor.value as M;
      let expectedBottom: string | undefined = currentModel.id;
      while (
        cursor &&
        (limit === undefined || IDBChain.length < limit) &&
        expectedBottom === currentModel.id
      ) {
        IDBChain.push(currentModel);
        expectedBottom = (await bottomsStore.get(currentModel.id)) as
          | string
          | undefined;
        cursor = await cursor.continue();
        currentModel = cursor?.value as M;
      }
    }
    await transaction.done;
    return IDBChain;
  }

  public async upsertChainIntoIDB(chain: M[]) {
    const lastEleIdx = chain.length - 1;
    const transaction = this.idbService.db.transaction(
      [this.idbService.storeName, this.idbService.bottomsStoreName],
      "readwrite",
    );
    const store = transaction.objectStore(this.idbService.storeName);
    const bottomsStore = transaction.objectStore(
      this.idbService.bottomsStoreName,
    );
    for (let i = 0; i < chain.length; i++) {
      await store.put(chain[i]);
      if (i === lastEleIdx) {
        break;
      }
      await bottomsStore.put(chain[i + 1].id, chain[i].id);
    }
    await transaction.done;
  }

  public deserializeJSONModel(model: any) {
    model.created_at = new Date(model.created_at);
    model.updated_at = new Date(model.updated_at);
    return model as M;
  }

  public async fetchAPI(
    { body }: { body: Record<string, any> },
    options?: { url?: string },
  ) {
    const url = options && options.url ? options.url : this.tableURL;
    const stringifiedBody = JSON.stringify(body);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) headers["Token"] = this.token;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: stringifiedBody,
    });

    if (!response.ok)
      throw new Error(`POST to ${url} return status ${response.status}`);

    const responseJSON = (await response.json()) as Record<string, any>;

    if (responseJSON.errors)
      throw new Error(JSON.stringify(responseJSON.errors));
    return responseJSON;
  }

  public getPartitionPageCursor(partition: Partial<M>): PartitionPageCursor<M> {
    const partitionValues = this.getPartitionValues(partition);
    return new PartitionPageCursor({ apiService: this, partitionValues });
  }

  protected abstract getCollectionName(): string;

  protected abstract getPartitionColumns(): (keyof M)[];

  protected abstract getClusteringColumns(): (keyof M)[];
}

class PartitionPageCursor<M extends AllModels> {
  private limit = API_MAX_PAGE_SIZE;
  private readonly options: {
    nextTopIDBModel?: M;
    nextPageState?: string;
  } = {};

  private cursor?: IDBPartitionPageCursor<M> | APIPartitionPageCursor<M>;
  constructor(
    private readonly args: {
      apiService: AbstractService<M>;
      partitionValues: any[];
    },
    options?: {
      nextTopIDBModel?: M;
      nextPageState?: string;
    },
  ) {
    this.options.nextTopIDBModel = options?.nextTopIDBModel;
    if (!this.options.nextTopIDBModel && options?.nextPageState) {
      this.options.nextPageState = options.nextPageState;
    }
  }
  public async initialize() {
    const { apiService, partitionValues } = this.args;
    const { nextTopIDBModel } = this.options;
    const limit = this.limit;

    // Initialize cursor
    if (!this.cursor) {
      this.cursor = new IDBPartitionPageCursor({
        apiService,
        partitionValues,
        nextTopIDBModel,
        limit,
      });
      await this.cursor.initialize();
    }
  }

  public async next(): Promise<M[]> {
    const limit = this.limit;
    let page: M[] = [];
    while (this.cursor) {
      const cursor = this.cursor;
      page = await cursor.next();
      if (page.length >= limit) {
        return page;
      }
      this.cursor = cursor.nextCursor();
      if (page.length === 0) {
        await this.cursor?.initialize();
      } else {
        this.cursor?.initialize();
        return page;
      }
    }
    return page;
  }
}

class APIPartitionPageCursor<M extends AllModels> {
  private exhausted: boolean = false;
  private chainNextAvaialbleModel = false;
  private lastReturnedPage: M[] = [];

  constructor(
    private readonly args: {
      apiService: AbstractService<M>;
      filter: Filter<M>;
      nextPageState?: string;
      limit: number;
      toChain?: M;
    },
  ) {}

  public async initialize() {}

  public nextCursor() {
    return undefined;
  }

  public async next(): Promise<M[]> {
    if (this.exhausted) return [];

    const { apiService, filter, nextPageState, limit } = this.args;

    const options: Find<M>["options"] = { limit };
    if (nextPageState) options.pageState = nextPageState;
    const findResponse = (await apiService.fetchAPI({
      body: {
        find: {
          filter,
          options,
        } as Find<M>,
      },
    })) as FindResponse;
    if (findResponse.data.nextPageState) {
      this.args.nextPageState = findResponse.data.nextPageState;
    } else {
      this.exhausted = true;
      this.args.nextPageState = undefined;
    }

    const models = findResponse.data.documents.map((model) =>
      apiService.deserializeJSONModel(model),
    );

    if (this.args.toChain) {
      if (this.chainNextAvaialbleModel) {
        const nextAvailableModel = models[0];
        if (nextAvailableModel) {
          await apiService.upsertChainIntoIDB([
            this.args.toChain,
            nextAvailableModel,
          ]);
        }
        this.args.toChain = undefined;
        this.chainNextAvaialbleModel = false;
      } else {
        for (let i = 0; i < models.length; i++) {
          if (apiService.areEqual(models[i], this.args.toChain)) {
            if (i >= models.length - 1) {
              this.chainNextAvaialbleModel = true;
            } else {
              await apiService.upsertChainIntoIDB([
                this.args.toChain,
                models[i + 1],
              ]);
            }
          }
        }
      }
    }

    await apiService.upsertChainIntoIDB([...this.lastReturnedPage, ...models]);

    this.lastReturnedPage = models;
    return models;
  }
}

class IDBPartitionPageCursor<M extends AllModels> {
  private lastReturnedPage: M[] = [];

  constructor(
    private readonly args: {
      apiService: AbstractService<M>;
      nextTopIDBModel?: M;
      partitionValues: any[];
      limit: number;
    },
  ) {}

  public async initialize() {
    if (!this.args.nextTopIDBModel) {
      const { apiService, partitionValues } = this.args;
      const range = IDBKeyRange.upperBound([
        ...partitionValues,
        MAX_DATE,
        MAX_STRING,
      ]);
      this.args.nextTopIDBModel = (
        await apiService.getIDBChainFromTop(range, { limit: 1 })
      )[0];
    }
  }

  public nextCursor(): APIPartitionPageCursor<M> {
    const { apiService, limit, nextTopIDBModel, partitionValues } = this.args;
    const nextTopAPIModel = nextTopIDBModel ?? this.lastReturnedPage[0];
    const partitionColumns = apiService.partitionColumns;
    const partitionFilter: Filter<M> = {};
    for (let i = 0; i < partitionColumns.length; i++) {
      partitionFilter[partitionColumns[i]] = { $eq: partitionValues[i] };
    }
    const filter = nextTopAPIModel
      ? apiService.getFilterForModelsEqualOrBelow(nextTopAPIModel)
      : partitionFilter;
    return new APIPartitionPageCursor({ apiService, limit, filter });
  }

  public async next(): Promise<M[]> {
    const { nextTopIDBModel } = this.args;
    if (nextTopIDBModel) {
      const { apiService, partitionValues, limit } = this.args;
      const clusteringValues = apiService.getClusteringValues(nextTopIDBModel);
      console.log(partitionValues);
      console.log(nextTopIDBModel);
      console.log(clusteringValues);
      const range = IDBKeyRange.bound(
        [...partitionValues, MIN_DATE, MIN_STRING],
        [...partitionValues, ...clusteringValues],
      );
      const IDBChain: M[] = await apiService.getIDBChainFromTop(range, {
        limit,
      });

      if (IDBChain.length >= limit) {
        const idbService = apiService.idbService;
        const lastIDBModel = IDBChain[IDBChain.length - 1];
        const nextTopID = (await idbService.db.get(
          idbService.bottomsStoreName,
          lastIDBModel.id,
        )) as string | undefined;
        if (nextTopID) {
          this.args.nextTopIDBModel = await idbService.get({
            key: nextTopID,
          });
        } else {
          this.args.nextTopIDBModel = undefined;
        }
      } else {
        this.args.nextTopIDBModel = undefined;
      }

      this.lastReturnedPage = IDBChain;
      return IDBChain;
    }

    return [];
  }
}
