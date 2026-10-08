import { Post } from "../APIServiceProvider/post/post-model";
import { AbstractIDBService } from "./abstract-idb-service";
import { CustomDBKeys } from "./db";

export class PostIDBService extends AbstractIDBService<Post> {
  protected getStoreName(): CustomDBKeys {
    return "posts";
  }

  protected getBottomsStoreName(): CustomDBKeys {
    return "posts-bottoms";
  }
}
