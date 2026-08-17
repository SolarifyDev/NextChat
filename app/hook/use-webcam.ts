/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useCallback } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

// export function useWebcam(isFromApp: boolean): UseMediaStreamResult {
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [isStreaming, setIsStreaming] = useState(false);

//   useEffect(() => {
//     const handleStreamEnded = () => {
//       setIsStreaming(false);
//       setStream(null);
//     };
//     if (stream) {
//       stream
//         .getTracks()
//         .forEach((track) => track.addEventListener("ended", handleStreamEnded));
//       return () => {
//         stream
//           .getTracks()
//           .forEach((track) =>
//             track.removeEventListener("ended", handleStreamEnded),
//           );
//       };
//     }
//   }, [stream]);

//   const start = async () => {
//     const mediaStream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//     });
//     setStream(mediaStream);
//     setIsStreaming(true);
//     return mediaStream;
//   };

//   const stop = () => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       setStream(null);
//       setIsStreaming(false);
//     }
//   };

//   const result: UseMediaStreamResult = {
//     type: "webcam",
//     start,
//     stop,
//     isStreaming,
//     stream,
//   };

//   return result;
// }

export function useWebcam(isFromApp: boolean): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >("environment");

  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.addEventListener("ended", handleStreamEnded));
      return () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.removeEventListener("ended", handleStreamEnded),
          );
      };
    }
  }, [stream]);

  // 原有的web端逻辑 - 保持完全不变
  const startWebMode = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  }, []);

  // App端的摄像头逻辑 - 支持前后置切换
  const startWithFacingMode = useCallback(
    async (facingMode: "user" | "environment") => {
      try {
        // 如果当前有流，先停止
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: {
            facingMode: { exact: facingMode },
          },
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setIsStreaming(true);
        setCurrentFacingMode(facingMode);
        return mediaStream;
      } catch (error) {
        console.error("Error accessing camera with exact facingMode:", error);

        // 如果exact约束失败，尝试不使用exact
        try {
          const fallbackConstraints = {
            video: {
              facingMode: facingMode,
            },
          };
          const mediaStream =
            await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          setStream(mediaStream);
          setIsStreaming(true);
          setCurrentFacingMode(facingMode);
          return mediaStream;
        } catch (fallbackError) {
          console.error("Fallback camera access failed:", fallbackError);
          throw fallbackError;
        }
      }
    },
    [stream],
  );

  // 统一的启动函数 - 根据环境选择不同策略
  const start = useCallback(async () => {
    if (isFromApp) {
      // App环境：使用带前后置切换的逻辑
      return startWithFacingMode(currentFacingMode);
    } else {
      // Web环境：保持原有简单逻辑
      return startWebMode();
    }
  }, [isFromApp, currentFacingMode, startWithFacingMode, startWebMode]);

  // 停止摄像头
  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  // 切换前后置摄像头 - 仅App端可用
  const switchCamera = useCallback(async () => {
    try {
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";

      return await startWithFacingMode(newFacingMode);
    } catch {
      return false;
    }
  }, [currentFacingMode, isFromApp, isStreaming, startWithFacingMode]);

  // 返回结果对象
  const result: UseMediaStreamResult = {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
    // 只在app环境中提供切换相关功能
    switchCamera: switchCamera,
    currentFacingMode: currentFacingMode,
  };

  return result;
}
