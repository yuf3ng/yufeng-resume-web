import { Button } from "@src/common/element/Button";
import { FlexColumn } from "@src/common/layout/flex";
import styled from "styled-components";
import { ServiceEditor } from "./ServiceEditor";
import { useContext } from "react";
import { APIServiceContext } from "@src/provider/APIServiceProvider";

const StyledFlexColumn = styled(FlexColumn)`
  align-items: center;

  & > :not(:first-child) {
    align-self: stretch;
  }
`;

export const AdminPage = () => {
  const { previewService, postService } = useContext(APIServiceContext);
  return (
    <StyledFlexColumn>
      <Button
        onClick={async (e) => {
          const now = new Date();
          const services = [previewService, postService];

          // Fetch models
          const results = await Promise.all(
            services.map(async (service) => [
              service.collectionName,
              await service.find(),
            ]),
          );
          const jsonData = Object.fromEntries(results);

          // Download models
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(jsonData, null, 2)], {
              type: "application/json",
            }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `cassadra-models_${now
            .toISOString()
            .replace(/[:.]/g, "-")}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }}
      >
        Backup cassandra models
      </Button>
      <ServiceEditor />
    </StyledFlexColumn>
  );
};

export default AdminPage;
