import { AbstractService } from "@src/provider/APIServiceProvider/abstract-service/abstract-service";
import { Post } from "./post-model";
import { Filter } from "../abstract-service/types";

export class PostService extends AbstractService<Post> {
  protected getCollectionName(): string {
    return "posts";
  }

  protected getPartitionColumns(): (keyof Post)[] {
    return ["preview_id"];
  }

  protected getClusteringColumns(): (keyof Post)[] {
    return ["created_at", "id"];
  }

  public getFilterForModelsEqualOrBelow(model: Post): Filter<Post> {
    return {
      preview_id: { $eq: model.preview_id },
      created_at: { $lte: model.created_at },
    } as Filter<Post>;
  }
}
