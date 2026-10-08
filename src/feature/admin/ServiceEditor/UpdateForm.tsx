import { LoadingSpinner } from "@src/common/component/LoadingSpinner";
import { Button } from "@src/common/element/Button";
import { Form } from "@src/common/element/Form";
import { Input } from "@src/common/element/Input";
import { Label } from "@src/common/element/Label";
import { H2, TextArea } from "@src/common/element/text";
import { FlexColumn, FlexRow } from "@src/common/layout/flex";
import { APIServiceContext } from "@src/provider/APIServiceProvider/APIServiceProvider";
import { ExtractModel } from "@src/provider/APIServiceProvider/abstract-service/abstract-service";
import { useContext, useEffect, useState } from "react";

export const UpdateForm = () => {
  const { previewService, postService } = useContext(APIServiceContext);
  const service = postService;

  // All models
  const [models, setModels] = useState<ExtractModel<typeof service>[]>([]);
  const [activeModelIdx, setActiveModelIdx] = useState<number>(0);
  useEffect(() => {
    service.find().then((values) => {
      for (let i = 0; i < values.length; i++) {
        const model = values[i];
        if (
          model.medias &&
          model.medias.includes("/career-p/panasonic/1.png")
        ) {
          setModels(values);
          setActiveModelIdx(i);
          return;
        }
      }
    });
  }, [service]);

  // Form related stuff
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const arrayFields: string[] = [];
  const dateFields: string[] = [];

  return (
    <FlexColumn>
      <H2>Models</H2>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          setPending(true);
          try {
            const formData = new FormData(e.currentTarget);
            const values = Object.fromEntries(formData.entries()) as Record<
              string,
              any
            >;
            for (const field of arrayFields) {
              if (values[field] && !(values[field] instanceof File)) {
                values[field] = JSON.parse(values[field]);
              }
            }

            const activeModel = models[activeModelIdx];
            const filter: Partial<
              Record<keyof typeof activeModel, { $eq: any }>
            > = {};
            for (const col of service.partitionColumns) {
              filter[col] = { $eq: activeModel[col] };
            }
            for (const col of service.clusteringColumns) {
              filter[col] = { $eq: activeModel[col] };
            }
            service
              .updateOne({
                filter,
                update: { $set: values },
              })
              .then((value) => {
                setSuccess(true);
              });
          } catch (e) {
            setSuccess(false);
            setErrorMsg(String(e));
          } finally {
            setPending(false);
          }
        }}
      >
        {models.length > 0 ? (
          <FlexColumn>
            {Object.entries(models[activeModelIdx]).map(([key, value], idx) => {
              let defaultValue = String(value);
              if (value instanceof Array) {
                defaultValue = JSON.stringify(value);
                arrayFields.push(key);
              } else if (value instanceof Date) {
                defaultValue = value.toISOString();
                dateFields.push(key);
              }
              return (
                <FlexRow key={idx}>
                  <Label htmlFor={key}>{key}: </Label>
                  {typeof value === "string" ? (
                    <TextArea id={key} name={key} defaultValue={value} />
                  ) : (
                    <Input
                      id={key}
                      type="text"
                      name={key}
                      defaultValue={defaultValue}
                    />
                  )}
                </FlexRow>
              );
            })}
            <Button>Submit</Button>
          </FlexColumn>
        ) : (
          <LoadingSpinner />
        )}
        {submitted ? (
          pending ? (
            <LoadingSpinner />
          ) : success ? (
            "success"
          ) : (
            errorMsg
          )
        ) : (
          <></>
        )}
      </Form>
    </FlexColumn>
  );
};
