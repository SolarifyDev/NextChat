import { TabComponent, TabItem } from "./kid/component/tab";
import ArrowLeftIcon from "../icons/arrow-left.svg";
import AudioSvg from "../icons/audio.svg";
import AidHelpIcon from "../icons/kid-help.svg";
import { Path } from "../constant";

import { useNavigate } from "react-router-dom";

export function AI() {
  return (
    <div
      style={{
        width: "100%",
        // backgroundColor: "red",
        gap: "2px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "98px 0 0 0",
        }}
      >
        <AidHelpIcon />
        <div
          style={{
            marginTop: "6px",
            color: "#9E9DB8",
          }}
        >
          你還沒有 AI Kid 哦~
        </div>
        <div
          style={{
            color: "#9E9DB8",
          }}
        >
          點擊下方「+」召喚屬於自己的 AI Kid 吧~
        </div>
        <div
          style={{
            marginTop: "34px",
            cursor: "pointer",
            backgroundColor: "#28B446",
            padding: "12px 82px",
            color: "white",
            borderRadius: "24px",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          创建
        </div>
      </div>

      {/* {[
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      ].map((item, index) => {
        return (
          <div
            key={index}
            style={{
              width: "100%",
              backgroundColor: "white",
              padding: "10px 20px",
              boxSizing: "border-box",
              display: "flex",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "white",
                flexShrink: 0,
              }}
            >
              123
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontSize: "18px",
                  color: "#3A3A47",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                NANCY.Y NANCY.Y NAN
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#6D6C88",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
              }}
            >
              <div
                style={{
                  cursor: "pointer",
                }}
              >
                1
              </div>
              <div
                style={{
                  cursor: "pointer",
                }}
              >
                2
              </div>
            </div>
          </div>
        );
      })} */}
    </div>
  );
}

export function SelectVoice() {
  const tabsData: TabItem[] = [
    {
      title: "推薦",
      component: (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "5px 16px",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(
            (item, index) => (
              <div
                key={index}
                style={{
                  paddingTop: "16px",
                  display: "flex",
                  height: "57px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#D9D9D9",
                    marginRight: "10px",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    paddingBottom: "12px",
                    borderColor: "transparent transparent #EDECFF transparent",
                    borderWidth: "0 0 1px 0",
                    borderStyle: "solid",
                  }}
                >
                  <div style={{ marginRight: "16px", flexShrink: 0 }}>
                    <div
                      style={{
                        color: "#3A3A47",
                        fontSize: "16px",
                      }}
                    >
                      成熟男聲
                    </div>
                    <div
                      style={{
                        color: "#6D6C88",
                        fontSize: "14px",
                      }}
                    >
                      男 | 青年
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <AudioSvg />
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#28B446",
                      }}
                    >
                      已選擇
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      ),
    },
    {
      title: "男聲",
      component: <div>222</div>,
    },
    {
      title: "女聲",
      component: <div>556</div>,
    },
    {
      title: "方言",
      component: <div>889</div>,
    },
  ];

  const navigate = useNavigate();

  return (
    <>
      <TabComponent
        tabs={tabsData}
        header={
          <div
            style={{
              fontWeight: 600,
              position: "relative",
              padding: "11px 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "8px",
              }}
              onClick={() => navigate(Path.Home)}
            >
              <ArrowLeftIcon />
            </div>
            <div
              style={{
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
                fontSize: "18px",
              }}
            >
              選擇聲音
            </div>
            <div
              style={{
                marginLeft: "8px",
                backgroundColor: "#28B446",
                borderRadius: "48px",
                color: "white",
                flexShrink: 0,
                fontSize: "16px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              完成
            </div>
          </div>
        }
        defaultTab={0}
        showScrollbar={false}
      />
    </>
  );
}
