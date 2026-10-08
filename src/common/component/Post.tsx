import {
  RegisterFragmentContext,
  sanitizeFragment,
} from "@src/provider/MaintainURLHash";
import { MarkDown } from "@src/common/component/MarkDown/MarkDown";
import { useContext, useEffect, useState } from "react";
import { FlexRow } from "@src/common/layout/flex";
import { styled } from "styled-components";
import { FlexColumn } from "@src/common/layout/flex";
import { H2 } from "@src/common/element/text";
import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { Button } from "@src/common/element/Button";
import { MediaScroller } from "./MediaScroller";
import { Div } from "@src/common/element/Div";
import { URLIcons } from "@src/common/component/URLIcons";
import { Components } from "react-markdown/lib";
import { mobileBreakpointInPx } from "../atom/isMobile";
import { Modal } from "@src/common/component/Modal";
import { APIServiceContext } from "@src/provider/APIServiceProvider";
import {
  onClickSpanPlugin,
  OnClickSpan,
  hName,
  IntermediateProps,
} from "./MarkDown/plugins/remark/onclickspan";
import { Post as PostModel } from "@src/provider/APIServiceProvider/post/post-model";

export enum RelatedPostsButtonName {
  PROJECT = "Achievements",
  ACHIEVEMENT = "Source Project",
  CAREER = "Projects",
}
const innerButtonName: Record<RelatedPostsButtonName, RelatedPostsButtonName> =
  {
    [RelatedPostsButtonName.PROJECT]: RelatedPostsButtonName.ACHIEVEMENT,
    [RelatedPostsButtonName.ACHIEVEMENT]: RelatedPostsButtonName.PROJECT,
    [RelatedPostsButtonName.CAREER]: RelatedPostsButtonName.PROJECT,
  };
export interface PostProps extends PostModel {
  disableZoom?: boolean;
  buttonName?: RelatedPostsButtonName;
  skip?: number;
}

const StyledFlexColumn = styled(FlexColumn).attrs({ as: "article" })`
  align-items: start;
  gap: 1rem;
`;

const StyledH2 = styled(H2)`
  text-align: left;
`;

const StyledURLIconsFlexRow = styled(FlexRow)`
  gap: 0.3em;
  align-items: center;
  border-left: 3px solid ${({ theme }) => theme.negSofterBackgroundColor};
  padding-left: 0.5em;
  > a {
    &:hover {
      background-color: ${({ theme }) => theme.negSofterBackgroundColor};
    }
  }

  * {
    width: 1.75em;
    height: 1.75em;
  }
`;

const RelatedPostsButton = ({
  related_post_preview_ids,
  related_post_ids,
  buttonName,
}: Required<
  Pick<
    PostProps,
    "related_post_ids" | "related_post_preview_ids" | "buttonName"
  >
>) => {
  const { postService } = useContext(APIServiceContext);
  const [displayModal, setDisplayModal] = useState<boolean>(false);
  const [fetchingPostModels, setFetchingPostModels] = useState<boolean>(false);
  const [postModels, setPostModels] = useState<PostModel[]>([]);

  useEffect(() => {
    if (displayModal) {
      const postModelsToBeSet: PostModel[] = [];
      setFetchingPostModels(true);
      for (let i = 0; i < related_post_preview_ids.length; i++) {
        const postPreviewId = related_post_preview_ids[i];
        const postId = related_post_ids[i];
        postService
          .findNextTopModelsPageByPartition({ preview_id: postPreviewId })
          .then((posts) => {
            for (const post of posts) {
              if (post.id === postId) {
                postModelsToBeSet.push(post);
                if (
                  postModelsToBeSet.length >= related_post_preview_ids.length
                ) {
                  setPostModels(postModelsToBeSet);
                  setFetchingPostModels(false);
                }
              }
            }
          });
      }
    }
  }, [displayModal, postService, related_post_ids, related_post_preview_ids]);
  return (
    <>
      <Button onClick={() => setDisplayModal(true)}>{buttonName}</Button>
      {displayModal && (
        <Modal
          $width="1080px"
          $maxWidth="1080px"
          closer={() => setDisplayModal(false)}
        >
          {fetchingPostModels ? (
            <LoadingSpinner />
          ) : (
            <>
              {postModels.map((postModel, idx) => {
                return (
                  <Post
                    key={idx}
                    {...postModel}
                    buttonName={innerButtonName[buttonName]}
                  />
                );
              })}
            </>
          )}
        </Modal>
      )}
    </>
  );
};

export const Post = (props: PostProps) => {
  const {
    // Model props
    body,
    name,
    medias,
    urls,
    related_post_ids,
    related_post_preview_ids,

    // Own props
    disableZoom,
    buttonName,
    skip: skipProp,
  } = props;

  // Register fragment in URL
  const id = sanitizeFragment(name);
  const registerFragment = useContext(RegisterFragmentContext);
  useEffect(() => {
    return registerFragment(id);
  }, [registerFragment, id]);

  // Enlarge post functionality
  const [zoomIn, setZoomIn] = useState<boolean>(false);

  // Skip MediaScroller functionality
  const initialSkip = skipProp ?? 0;
  const [skip, setSkip] = useState<number[]>([initialSkip]);

  // Plugin for MarkDown
  const components: Components = {};
  if (medias)
    (components as any)[hName] = (props: IntermediateProps) => {
      const skip = props.skip;
      const text = props.text;
      return <OnClickSpan text={text} onClick={() => setSkip([skip])} />;
    };
  return (
    <>
      <StyledFlexColumn id={id}>
        <Div>
          <StyledH2>{name}</StyledH2>
          {related_post_preview_ids && related_post_ids && buttonName && (
            <RelatedPostsButton
              related_post_preview_ids={related_post_preview_ids}
              related_post_ids={related_post_ids}
              buttonName={buttonName}
            />
          )}
        </Div>
        {urls && (
          <StyledURLIconsFlexRow>
            <URLIcons urls={urls} />
          </StyledURLIconsFlexRow>
        )}
        {medias ? (
          <MarkDown remarkPlugins={[onClickSpanPlugin]} components={components}>
            {body}
          </MarkDown>
        ) : (
          <MarkDown>{body}</MarkDown>
        )}
        {medias && (
          <MediaScroller
            onClickMedia={(mediaIdx: number) => {
              if (window.innerWidth > mobileBreakpointInPx) {
                setZoomIn(true);
                setSkip([mediaIdx]);
              }
            }}
            medias={medias}
            skip={skip}
          />
        )}
      </StyledFlexColumn>
      {!disableZoom && zoomIn && (
        <Modal
          $width="1080px"
          $maxWidth="1080px"
          closer={() => setZoomIn(false)}
        >
          <Post {...props} disableZoom skip={skip[0]} />
        </Modal>
      )}
    </>
  );
};
