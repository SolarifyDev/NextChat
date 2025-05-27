import { TabComponent, TabItem } from "./tab";
import ArrowLeftIcon from "../icons/arrow-left.svg";
import AudioSvg from "../icons/audio.svg";
import { Path } from "../constant";

import { useNavigate } from "react-router-dom";

export function AIKid() {
  return <div>123</div>;
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
                // position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "8px",
                // top: "50%",
                // transform: "translateY(-50%)",
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
