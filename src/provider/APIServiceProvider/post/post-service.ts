import { AbstractService } from "@src/provider/APIServiceProvider/abstract-service/abstract-service";
import { Post } from "./post-model";
import { Filter } from "../abstract-service/types";

export class PostService extends AbstractService<Post> {
  public getFilterForModelsEqualOrBelow(model: Post): Filter<Post> {
    return {
      preview_id: { $eq: model.preview_id },
      created_at: { $lte: model.created_at },
    } as Filter<Post>;
  }

  protected sortPartition(partition: Post[]): Post[] {
    return partition.sort((a, b) => {
      const dateDiff = b.created_at.getTime() - a.created_at.getTime();

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return b.id.localeCompare(a.id);
    });
  }

  protected getCollectionName(): string {
    return "posts";
  }

  protected getPartitionColumns(): (keyof Post)[] {
    return ["preview_id"];
  }

  protected getClusteringColumns(): (keyof Post)[] {
    return ["created_at", "id"];
  }
}
