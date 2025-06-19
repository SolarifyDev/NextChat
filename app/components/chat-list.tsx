import DeleteIcon from "../icons/delete.svg";

import styles from "./home.module.scss";
import { OnDragEndResponder } from "@hello-pangea/dnd";

import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { showConfirm } from "./ui-lib";
import { useMobileScreen } from "../utils";
import clsx from "clsx";
import { useNewChatStore } from "../store/new-chat";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";
import { useOmeStore } from "../store/ome";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
  isFromApp?: boolean;
}) {
  const { t } = useTranslation();
  // const draggableRef = useRef<HTMLDivElement | null>(null);
  // useEffect(() => {
  //   if (props.selected && draggableRef.current) {
  //     draggableRef.current?.scrollIntoView({
  //       block: "center",
  //     });
  //   }
  // }, [props.selected]);

  const { pathname: currentPath } = useLocation();
  return (
    // <Draggable draggableId={`${props.id}`} index={props.index}>
    //   {(provided) => (
    <div
      className={clsx(styles["chat-item"], {
        [styles["chat-item-selected"]]:
          props.selected &&
          (currentPath === Path.Chat ||
            currentPath === Path.Home ||
            currentPath === Path.AIKid ||
            currentPath === Path.SelectVoice ||
            currentPath === Path.AddOrUpdateKid ||
            currentPath === Path.Realtime) &&
          !props.isFromApp,
        [styles["chat-item-selected-is-app"]]:
          props.selected &&
          (currentPath === Path.Chat ||
            currentPath === Path.Home ||
            currentPath === Path.AIKid ||
            currentPath === Path.SelectVoice ||
            currentPath === Path.AddOrUpdateKid ||
            currentPath === Path.Realtime) &&
          props.isFromApp,
      })}
      onClick={props.onClick}
      // ref={(ele) => {
      //   draggableRef.current = ele;
      //   provided.innerRef(ele);
      // }}
      // {...provided.draggableProps}
      // {...provided.dragHandleProps}
      // title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
      title={`${props.title}\n${t("ChatItem.ChatItemCount", {
        count: props.count,
      })}`}
    >
      {props.narrow ? (
        <div className={styles["chat-item-narrow"]}>
          <div className={clsx(styles["chat-item-avatar"], "no-dark")}>
            <MaskAvatar
              avatar={props.mask.avatar}
              model={props.mask.modelConfig.model}
            />
          </div>
          <div className={styles["chat-item-narrow-count"]}>{props.count}</div>
        </div>
      ) : (
        <>
          <div className={styles["chat-item-title"]}>{props.title}</div>
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-count"]}>
              {/* {Locale.ChatItem.ChatItemCount(props.count)} */}
              {t("ChatItem.ChatItemCount", { count: props.count })}
            </div>
            <div className={styles["chat-item-date"]}>{props.time}</div>
          </div>
        </>
      )}

      <div
        className={
          props.isFromApp
            ? styles["chat-item-delete-is-app"]
            : styles["chat-item-delete"]
        }
        onClickCapture={(e) => {
          props.onDelete?.();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DeleteIcon />
      </div>
    </div>
    //   )}
    // </Draggable>
  );
}

export function ChatList(props: { narrow?: boolean; isFromApp?: boolean }) {
  const {
    currentSessionIndex,
    sessions,
    selectSession,
    deleteSession,
    isLoading,
  } = useNewChatStore();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();
  const { onlineSearch, setOnlineSearch } = useOmeStore();

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // moveSession(source.index, destination.index);
  };

  return (
    // <DragDropContext onDragEnd={onDragEnd}>
    //   <Droppable droppableId="chat-list">
    //     {(provided) => (
    <div
      className={styles["chat-list"]}
      // ref={provided.innerRef}
      // {...provided.droppableProps}
    >
      {props.isFromApp && isLoading && (
        <Spin
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {!isLoading &&
        sessions.map((item, i) => (
          <ChatItem
            title={item.topic}
            time={new Date(item.lastUpdate).toLocaleString()}
            count={item?.messages?.length ?? 0}
            key={item.id}
            id={item.id}
            index={i}
            selected={i === currentSessionIndex}
            onClick={() => {
              navigate(Path.Chat);
              selectSession(i);
              if (onlineSearch) {
                setOnlineSearch(false);
              }
            }}
            onDelete={async () => {
              if (
                (!props.narrow && !isMobileScreen) ||
                // (await showConfirm(Locale.Home.DeleteChat))
                (await showConfirm(t("Home.DeleteChat")))
              ) {
                deleteSession(i);
              }
            }}
            narrow={props.narrow}
            mask={item.mask}
            isFromApp={props?.isFromApp ?? false}
          />
        ))}
      {/* {provided.placeholder} */}
    </div>
    //     )}
    //   </Droppable>
    // </DragDropContext>
  );
}

// export function ChatList(props: { narrow?: boolean }) {
//   const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
//     (state) => [
//       state.sessions,
//       state.currentSessionIndex,
//       state.selectSession,
//       state.moveSession,
//     ],
//   );
//   const chatStore = useChatStore();
//   const navigate = useNavigate();
//   const isMobileScreen = useMobileScreen();

//   const onDragEnd: OnDragEndResponder = (result) => {
//     const { destination, source } = result;
//     if (!destination) {
//       return;
//     }

//     if (
//       destination.droppableId === source.droppableId &&
//       destination.index === source.index
//     ) {
//       return;
//     }

//     moveSession(source.index, destination.index);
//   };

//   return (
//     <DragDropContext onDragEnd={onDragEnd}>
//       <Droppable droppableId="chat-list">
//         {(provided) => (
//           <div
//             className={styles["chat-list"]}
//             ref={provided.innerRef}
//             {...provided.droppableProps}
//           >
//             {sessions.map((item, i) => (
//               <ChatItem
//                 title={item.topic}
//                 time={new Date(item.lastUpdate).toLocaleString()}
//                 count={item.messages.length}
//                 key={item.id}
//                 id={item.id}
//                 index={i}
//                 selected={i === selectedIndex}
//                 onClick={() => {
//                   navigate(Path.Chat);
//                   selectSession(i);
//                 }}
//                 onDelete={async () => {
//                   if (
//                     (!props.narrow && !isMobileScreen) ||
//                     (await showConfirm(Locale.Home.DeleteChat))
//                   ) {
//                     chatStore.deleteSession(i);
//                   }
//                 }}
//                 narrow={props.narrow}
//                 mask={item.mask}
//               />
//             ))}
//             {provided.placeholder}
//           </div>
//         )}
//       </Droppable>
//     </DragDropContext>
//   );
// }
