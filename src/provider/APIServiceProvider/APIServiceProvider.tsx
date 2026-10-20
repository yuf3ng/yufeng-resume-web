import { ConfigContext } from "@src/provider/ConfigProvider";
import { createContext, useContext, useEffect, useState } from "react";

import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { IDBContext } from "../IDBProvider/IDBProvider";
import { PostIDBService } from "../IDBProvider/post-idb-service";
import { PreviewIDBService } from "../IDBProvider/preview-idb-service";
import { PostService } from "./post/post-service";
import { PreviewService } from "./preview/preview-service";

export type AllAPIServicesUnion = InstanceType<
  typeof APIServices
>[keyof InstanceType<typeof APIServices>];

class APIServices {
  public postService: PostService;
  public previewService: PreviewService;
}

export const APIServiceContext = createContext<APIServices>(new APIServices());
export const APIServiceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const idbContext = useContext(IDBContext);
  const { api, apiToken } = useContext(ConfigContext);

  const [services, setServices] = useState<null | APIServices>(null);

  useEffect(() => {
    const db = idbContext.db;
    const services = new APIServices();
    const initializeValues = {
      baseURL: api,
      token: apiToken,
    };
    const postService = new PostService({
      ...initializeValues,
      idbService: new PostIDBService({
        db,
      }),
    });
    services.postService = postService;
    services.previewService = new PreviewService({
      ...initializeValues,
      idbService: new PreviewIDBService({
        db,
      }),
    });
    setServices(services);
    for (const service of Object.values(services)) {
      service.load();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (services === null) {
    return <LoadingSpinner />;
  }
  return (
    <APIServiceContext.Provider value={services}>
      {children}
    </APIServiceContext.Provider>
  );
};
