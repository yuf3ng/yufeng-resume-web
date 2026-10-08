import { Preview } from "../APIServiceProvider/preview/preview-model";
import { AbstractIDBService } from "./abstract-idb-service";
import { CustomDBKeys } from "./db";

export class PreviewIDBService extends AbstractIDBService<Preview> {
  protected getStoreName(): CustomDBKeys {
    return "previews";
  }

  protected getBottomsStoreName(): CustomDBKeys {
    return "previews-bottoms";
  }
}
