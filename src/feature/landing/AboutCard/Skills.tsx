import { useContext, useEffect, useState } from "react";
import styled from "styled-components";

import { Modal } from "@src/common/component/Modal";
import { Button } from "@src/common/element/Button";
import { FlexColumn } from "@src/common/layout/flex";

import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { Post as PostComponent } from "@src/common/component/Post";
import { Post as PostModel } from "@src/provider/APIServiceProvider/post/post-model";
import { APIServiceContext } from "@src/provider/APIServiceProvider";
import { PartialColorH2 } from "./components";

const StyledFlexColumn = styled(FlexColumn).attrs({ as: "article" })`
  align-items: start;
  gap: 1em;
`;

const StyledButton = styled(Button)`
  text-decoration: none;
`;

const Skill = ({ text, onClick }: { text: string; onClick: () => void }) => {
  return <StyledButton onClick={onClick}>{text}</StyledButton>;
};

const StrikeThroughButton = styled(Button)`
  text-decoration: line-through;
`;

const postPreviewIds = {
  ai: "0ad6c888-b3f6-453c-ac7b-5cf82fd81a34",
  scripting: "0d4989a2-2e13-4bdb-bdca-9317ca173168",
  server: "1efe5ed4-5fab-4eb1-9b16-3ca4010215c2",
  database: "4cb58e03-b85c-42c6-b34d-581d8669a9ba",
  signal: "50d7656f-5e08-4ea5-96c2-ecd4270be49a",
  devOps: "6c5def4f-fcb5-40df-8d42-62cfaf2b6dff",
  android: "7137af39-eb75-4e88-af88-cb7f2552aa24",
  containerization: "8c1db6bd-0b11-4f69-b0c7-38e42fb2867e",
  architecture: "b52051e7-3544-4487-9f83-b98a9deae461",
  electricalEngineering: "c1796286-2f8f-43f0-9f4a-8851a02db901",
  cloudComputing: "dba48626-58f5-49af-9de8-dfe3a7190506",
  web: "e904998f-1835-4e28-ba67-0c70d2dae54e",
  dataScience: "fbbdeab7-5f3d-4466-8752-4d136c1b4145",
};
export const Skills = () => {
  const { postService } = useContext(APIServiceContext);
  const [activePostPreviewId, setActivePostPreviewId] = useState<string | null>(
    null,
  );
  const [fetchingActivePosts, setFetchingActivePosts] =
    useState<boolean>(false);
  const [activePosts, setActivePosts] = useState<PostModel[]>([]);
  useEffect(() => {
    if (activePostPreviewId != null) {
      setFetchingActivePosts(true);
      postService
        .findNextTopModelsPageByPartition({ preview_id: activePostPreviewId })
        .then((values) => {
          setActivePosts(values);
          setFetchingActivePosts(false);
        });
    }
  }, [activePostPreviewId, postService]);
  return (
    <>
      <StyledFlexColumn>
        <PartialColorH2>Proven skills (Click below!)</PartialColorH2>
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.ai);
          }}
          text="AI (Computer Vision) 📸"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.android);
          }}
          text="Android dev 👽"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.cloudComputing);
          }}
          text="Cloud computing 💨"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.containerization);
          }}
          text="Containerization 🫙"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.dataScience);
          }}
          text="Data Science 🧪"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.database);
          }}
          text="Database management 🛢"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.devOps);
          }}
          text="DevOps ⚙️"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.electricalEngineering);
          }}
          text="Hardware design 📟"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.server);
          }}
          text="Server building 💻"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.signal);
          }}
          text="Signal processing 📡"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.architecture);
          }}
          text="Software Architecture 🏗️"
        />
        <Skill
          onClick={() => {
            setActivePostPreviewId(postPreviewIds.web);
          }}
          text="Web dev (Interactive and mobile responsive) 🌐"
        />
        <StrikeThroughButton>Vibe coding 💩</StrikeThroughButton>
      </StyledFlexColumn>
      {activePostPreviewId != null && (
        <Modal
          closer={() => {
            setActivePostPreviewId(null);
          }}
        >
          {fetchingActivePosts ? (
            <LoadingSpinner />
          ) : (
            <>
              {activePosts.map((activePostModel, idx) => {
                return <PostComponent key={idx} {...activePostModel} />;
              })}
            </>
          )}
        </Modal>
      )}
    </>
  );
};
