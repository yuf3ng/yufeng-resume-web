import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { openDB } from "idb";
import React, { createContext, useEffect, useState } from "react";
import { CustomDBSchemaExtended, CustomIDBPDatabase } from "./db";

class IDB {
  db: CustomIDBPDatabase;
}

export const IDBContext = createContext<IDB>(new IDB());
export const IDBProvider = ({ children }: { children: React.ReactNode }) => {
  const [idbValue, setIDBValue] = useState<IDB | null>(null);

  useEffect(() => {
    const dbName = "api";
    openDB<CustomDBSchemaExtended>(dbName, 2, {
      upgrade(db, oldVersion, newVersion, transaction, event) {
        if (oldVersion < 1) {
          const postStore = db.createObjectStore("posts", { keyPath: "id" });
          postStore.createIndex("preview_id", "preview_id");
          const previewStore = db.createObjectStore("previews", {
            keyPath: "id",
          });
          previewStore.createIndex("type", "type");
        }

        if (oldVersion < 2) {
          db.clear("posts");
          db.clear("posts-bottoms");
          db.clear("previews");
          db.clear("previews-bottoms");
          const postStore = transaction.objectStore("posts");
          postStore.createIndex("api", ["preview_id", "created_at", "id"]);
          db.createObjectStore("posts-bottoms");
          const previewStore = transaction.objectStore("previews");
          previewStore.createIndex("api", ["type", "created_at", "id"]);
          db.createObjectStore("previews-bottoms");
        }

        console.log("Upgraded db");
      },
      blocked(currentVersion, blockedVersion, event) {
        console.log("blocked");
      },
      blocking(currentVersion, blockedVersion, event) {
        console.log("blocking");
      },
      terminated() {
        console.log("terminated");
      },
    }).then((db) => {
      const idbObject = new IDB();
      idbObject.db = db;
      setIDBValue(idbObject);
    });
  }, []);

  if (idbValue === null) {
    return <LoadingSpinner />;
  }
  return <IDBContext.Provider value={idbValue}>{children}</IDBContext.Provider>;
};
