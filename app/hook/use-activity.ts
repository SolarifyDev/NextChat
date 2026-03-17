import { postMessageToReactNative } from "../utils/ga";

interface UserActivityMonitorOptions {
  timeout?: number;
  gaEventName?: string;
  userId?: string;
  debug?: boolean;
  eventUuid?: string;
}

interface UserActivityStatus {
  isMonitoring: boolean;
  timeoutMinutes: number;
}

interface GAEventData {
  event: string;
  category: string;
  action: string;
  timestamp: string;
  timeout_minutes: number;
}

class UserActivityMonitor {
  // 配置属性
  private timeout: number;
  private gaEventName: string;
  private debug: boolean;
  private userId: string;
  private eventUuid: string;

  // 状态管理 —— 基于 rAF + 绝对时间戳，零累积漂移
  private rafId: number | null = null;
  private lastActivityTime: number = 0;
  private isMonitoring: boolean = false;

  // 监听的用户事件
  private readonly activityEvents: string[] = [
    "mousedown",
    // "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];

  constructor(options: UserActivityMonitorOptions = {}) {
    // 配置选项
    this.timeout = options.timeout || 30 * 60 * 1000; // 默认30分钟
    this.gaEventName = options.gaEventName || "";
    this.debug = options.debug ?? false;
    this.userId = options.userId || "";
    this.eventUuid = options.eventUuid || "";

    // 绑定事件处理函数
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.cleanup = this.cleanup.bind(this);

    this.init();
  }

  private log(...args: any[]): void {
    if (this.debug) console.log("[UserActivityMonitor]", ...args);
  }

  private init(): void {
    this.bindEvents();
    this.startMonitoring();
    this.log("监测器已启动，时长:", this.timeout / 1000 / 60, "分钟");
  }

  private bindEvents(): void {
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleUserActivity, true);
    });

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.cleanup);
  }

  private handleVisibilityChange(): void {
    if (!document.hidden) {
      this.log("页面恢复可见，重置时间戳");
      this.lastActivityTime = Date.now();
    }
  }

  private handleUserActivity(): void {
    this.log("检测到用户活动，重置时间戳");
    this.lastActivityTime = Date.now();
  }

  private startMonitoring(): void {
    if (this.isMonitoring) this.stopRaf();
    this.isMonitoring = true;
    this.lastActivityTime = Date.now();
    this.tick();
    this.log("开始监测：", this.timeout / 1000 / 60, "分钟无活动");
  }

  private tick(): void {
    if (!this.isMonitoring) return;

    if (Date.now() - this.lastActivityTime >= this.timeout) {
      this.log("用户无活动超时，触发 GA 事件");
      this.sendGAEvent();
      this.lastActivityTime = Date.now();
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private stopMonitoring(): void {
    this.stopRaf();
    this.isMonitoring = false;
    this.log("停止活动监测");
  }

  private sendGAEvent(): void {
    try {
      if (typeof window.gtag === "function") {
        // trackEvent(
        //   this.gaEventName,
        //   {
        //     time: Date.now(),
        //     userId: this.userId,
        //     metis_event_id: this.eventUuid,
        //   },
        //   this.debug,
        // );

        postMessageToReactNative(
          {
            action: this.gaEventName,
            time: Date.now(),
            userId: this.userId,
            metis_event_id: this.eventUuid,
          },
          this.gaEventName,
        );
        return;
      }
    } catch (error) {
      console.error("GA事件发送失败:", error);
    }
  }

  public getStatus(): UserActivityStatus {
    return {
      isMonitoring: this.isMonitoring,
      timeoutMinutes: Math.floor(this.timeout / 1000 / 60),
    };
  }

  private cleanup(): void {
    this.log("清理事件监听和 rAF");
    this.stopMonitoring();

    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.handleUserActivity, true);
    });

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("beforeunload", this.cleanup);
  }

  public destroy(): void {
    this.cleanup();
    this.log("用户活动监测器已销毁");
  }
}

export default UserActivityMonitor;
