import { ServiceProvider } from "@/app/constant";
import { ModalConfigValidator, ModelConfig } from "../store";

import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import { useTranslation } from "react-i18next";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const { t } = useTranslation();
  const allModels = useAllModels();
  const groupModels = groupBy(
    allModels.filter((v) => v.available),
    "provider.providerName",
  );
  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const compressModelValue = `${props.modelConfig.compressModel}@${props.modelConfig?.compressProviderName}`;

  return (
    <>
      {/* <ListItem title={Locale.Settings.Model}> */}
      <ListItem title={t("Settings.Model")}>
        <Select
          // aria-label={Locale.Settings.Model}
          aria-label={t("Settings.Model")}
          value={value}
          align="left"
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            props.updateConfig((config) => {
              config.model = ModalConfigValidator.model(model);
              config.providerName = providerName as ServiceProvider;
            });
          }}
        >
          {Object.keys(groupModels).map((providerName, index) => (
            <optgroup label={providerName} key={index}>
              {groupModels[providerName].map((v, i) => (
                <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                  {v.displayName}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Temperature.Title}
        title={t("Settings.Temperature.Title")}
        // subTitle={Locale.Settings.Temperature.SubTitle}
        subTitle={t("Settings.Temperature.SubTitle")}
      >
        <InputRange
          // aria={Locale.Settings.Temperature.Title}
          aria={t("Settings.Temperature.Title")}
          value={props.modelConfig.temperature?.toFixed(1)}
          min="0"
          max="1" // lets limit it to 0-1
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.temperature = ModalConfigValidator.temperature(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        // title={Locale.Settings.TopP.Title}
        // subTitle={Locale.Settings.TopP.SubTitle}
        title={t("Settings.TopP.Title")}
        subTitle={t("Settings.TopP.SubTitle")}
      >
        <InputRange
          // aria={Locale.Settings.TopP.Title}
          aria={t("Settings.TopP.Title")}
          value={(props.modelConfig.top_p ?? 1).toFixed(1)}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.top_p = ModalConfigValidator.top_p(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        // title={Locale.Settings.MaxTokens.Title}
        // subTitle={Locale.Settings.MaxTokens.SubTitle}
        title={t("Settings.MaxTokens.Title")}
        subTitle={t("Settings.MaxTokens.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.MaxTokens.Title}
          aria-label={t("Settings.MaxTokens.Title")}
          type="number"
          min={1024}
          max={512000}
          value={props.modelConfig.max_tokens}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.max_tokens = ModalConfigValidator.max_tokens(
                  e.currentTarget.valueAsNumber,
                )),
            )
          }
        ></input>
      </ListItem>

      {props.modelConfig?.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            // title={Locale.Settings.PresencePenalty.Title}
            // subTitle={Locale.Settings.PresencePenalty.SubTitle}
            title={t("Settings.PresencePenalty.Title")}
            subTitle={t("Settings.PresencePenalty.SubTitle")}
          >
            <InputRange
              // aria={Locale.Settings.PresencePenalty.Title}
              aria={t("Settings.PresencePenalty.Title")}
              value={props.modelConfig.presence_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.presence_penalty =
                      ModalConfigValidator.presence_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            // title={Locale.Settings.FrequencyPenalty.Title}
            // subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
            title={t("Settings.FrequencyPenalty.Title")}
            subTitle={t("Settings.FrequencyPenalty.SubTitle")}
          >
            <InputRange
              // aria={Locale.Settings.FrequencyPenalty.Title}
              aria={t("Settings.FrequencyPenalty.Title")}
              value={props.modelConfig.frequency_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.frequency_penalty =
                      ModalConfigValidator.frequency_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            // title={Locale.Settings.InjectSystemPrompts.Title}
            // subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
            title={t("Settings.InjectSystemPrompts.Title")}
            subTitle={t("Settings.InjectSystemPrompts.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.InjectSystemPrompts.Title}
              aria-label={t("Settings.InjectSystemPrompts.Title")}
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                    (config.enableInjectSystemPrompts =
                      e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Settings.InputTemplate.Title}
            // subTitle={Locale.Settings.InputTemplate.SubTitle}
            title={t("Settings.InputTemplate.Title")}
            subTitle={t("Settings.InputTemplate.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.InputTemplate.Title}
              aria-label={t("Settings.InputTemplate.Title")}
              type="text"
              value={props.modelConfig.template}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.template = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
      <ListItem
        // title={Locale.Settings.HistoryCount.Title}
        // subTitle={Locale.Settings.HistoryCount.SubTitle}
        title={t("Settings.HistoryCount.Title")}
        subTitle={t("Settings.HistoryCount.SubTitle")}
      >
        <InputRange
          // aria={Locale.Settings.HistoryCount.Title}
          aria={t("Settings.HistoryCount.Title")}
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        // title={Locale.Settings.CompressThreshold.Title}
        // subTitle={Locale.Settings.CompressThreshold.SubTitle}
        title={t("Settings.CompressThreshold.Title")}
        subTitle={t("Settings.CompressThreshold.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.CompressThreshold.Title}
          aria-label={t("Settings.CompressThreshold.Title")}
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      {/* <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}> */}
      <ListItem title={t("Memory.Title")} subTitle={t("Memory.Send")}>
        <input
          // aria-label={Locale.Memory.Title}
          aria-label={t("Memory.Title")}
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.CompressModel.Title}
        // subTitle={Locale.Settings.CompressModel.SubTitle}
        title={t("Settings.CompressModel.Title")}
        subTitle={t("Settings.CompressModel.SubTitle")}
      >
        <Select
          className={styles["select-compress-model"]}
          // aria-label={Locale.Settings.CompressModel.Title}
          aria-label={t("Settings.CompressModel.Title")}
          value={compressModelValue}
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            props.updateConfig((config) => {
              config.compressModel = ModalConfigValidator.model(model);
              config.compressProviderName = providerName as ServiceProvider;
            });
          }}
        >
          {allModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
    </>
  );
}
