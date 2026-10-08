import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { Modal } from "@src/common/component/Modal";
import {
  Post as PostComponent,
  RelatedPostsButtonName,
} from "@src/common/component/Post";
import { PreviewCard } from "@src/common/component/PreviewCard";
import { FlexColumn } from "@src/common/layout/flex";
import { ColumnGrid } from "@src/common/layout/grid/ColumnGrid";
import { APIServiceContext } from "@src/provider/APIServiceProvider";
import { Post as PostModel } from "@src/provider/APIServiceProvider/post/post-model";
import {
  Preview,
  PreviewType,
} from "@src/provider/APIServiceProvider/preview/preview-model";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { styled } from "styled-components";

const StyledFlexColumn = styled(FlexColumn).attrs({ as: "section" })`
  > *:not(:first-child) {
    padding-top: 1rem;
  }
`;
interface Props {
  previewParam: string;
  type: PreviewType;
  referenceButtonName: RelatedPostsButtonName;
}
export const PostsPage = ({
  previewParam,
  type,
  referenceButtonName,
}: Props) => {
  const { previewService, postService } = useContext(APIServiceContext);

  // Get all Preview
  const [previews, setPreviews] = useState<Preview[]>([]);
  useEffect(() => {
    const partitionPageCursor = previewService.getPartitionPageCursor({ type });
    partitionPageCursor
      .initialize()
      .then(() =>
        partitionPageCursor.next().then((values) => setPreviews(values)),
      );
  }, [previewService, type]);

  // Build a map of the achievementCategories array, mapping each value's name to its index in the array
  const previewNameToIdx = useMemo(() => {
    const map = new Map<string, number>();
    previews.forEach((value, idx) => map.set(value.name, idx));
    return map;
  }, [previews]);

  // Which category is currently being displayed (which is reflected in URL params)
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePreviewIdx, setActivePreviewIdx] = useState<number | null>(null);
  useEffect(() => {
    setActivePreviewIdx(
      previewNameToIdx.get(searchParams.get(previewParam) || "") ?? null,
    );
  }, [previewNameToIdx, searchParams, previewParam]);

  // Storing the posts (fetched on demand and saved)
  const [activePostModels, setActivePostModels] = useState<PostModel[]>([]);
  const [fetchingActivePostModels, setFetchingActivePostModels] =
    useState<boolean>(false);
  useEffect(() => {
    if (activePreviewIdx != null) {
      setFetchingActivePostModels(true);
      const activePreview = previews[activePreviewIdx];
      const partitionPageCursor = postService.getPartitionPageCursor({
        preview_id: activePreview.id,
      });
      partitionPageCursor.initialize().then(() =>
        partitionPageCursor
          .next()
          .then((values) => setActivePostModels(values))
          .finally(() => {
            setFetchingActivePostModels(false);
          }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreviewIdx]);

  return (
    <>
      {previews.length > 0 ? (
        <ColumnGrid>
          {previews.map((category, index) => (
            <PreviewCard
              onClick={() => {
                setActivePreviewIdx(index);
                setSearchParams((prev) => {
                  prev.set(previewParam, category.name);
                  return prev;
                });
              }}
              src={category.image_url}
              key={index}
              title={category.name}
            />
          ))}
        </ColumnGrid>
      ) : (
        <LoadingSpinner />
      )}
      {typeof activePreviewIdx === "number" && (
        <Modal
          closer={() => {
            setActivePreviewIdx(null);
            setSearchParams((prev) => {
              prev.delete(previewParam);
              return prev;
            });
          }}
        >
          {fetchingActivePostModels ? (
            <LoadingSpinner />
          ) : (
            <StyledFlexColumn>
              <>
                {activePostModels.map((_, idx, arr) => {
                  const postModel = arr[arr.length - 1 - idx]; // pick from the end
                  return (
                    <PostComponent
                      key={postModel.id}
                      {...postModel}
                      buttonName={referenceButtonName}
                    />
                  );
                })}
              </>
            </StyledFlexColumn>
          )}
        </Modal>
      )}
    </>
  );
};

export default PostsPage;
