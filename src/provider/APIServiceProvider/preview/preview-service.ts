import { AbstractService } from "@src/provider/APIServiceProvider/abstract-service/abstract-service";
import { Preview } from "./preview-model";
import { Filter } from "../abstract-service/types";

export class PreviewService extends AbstractService<Preview> {
  protected getCollectionName(): string {
    return "previews";
  }

  protected getPartitionColumns(): (keyof Preview)[] {
    return ["type"];
  }

  protected getClusteringColumns(): (keyof Preview)[] {
    return ["created_at", "id"];
  }

  public getFilterForModelsEqualOrBelow(model: Preview): Filter<Preview> {
    return {
      type: { $eq: model.type },
      created_at: { $lte: model.created_at },
    } as Filter<Preview>;
  }
}
