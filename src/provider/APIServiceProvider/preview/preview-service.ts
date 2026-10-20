import { AbstractService } from "@src/provider/APIServiceProvider/abstract-service/abstract-service";
import { Preview } from "./preview-model";
import { Filter } from "../abstract-service/types";

export class PreviewService extends AbstractService<Preview> {
  public getFilterForModelsEqualOrBelow(model: Preview): Filter<Preview> {
    return {
      type: { $eq: model.type },
      created_at: { $lte: model.created_at },
    } as Filter<Preview>;
  }

  protected sortPartition(partition: Preview[]): Preview[] {
    return partition.sort((a, b) => {
      const dateDiff = b.created_at.getTime() - a.created_at.getTime();

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return b.id.localeCompare(a.id);
    });
  }

  protected getCollectionName(): string {
    return "previews";
  }

  protected getPartitionColumns(): (keyof Preview)[] {
    return ["type"];
  }

  protected getClusteringColumns(): (keyof Preview)[] {
    return ["created_at", "id"];
  }
}
