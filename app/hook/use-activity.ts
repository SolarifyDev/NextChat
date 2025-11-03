import { trackEvent } from "../utils/ga";

interface UserActivityMonitorOptions {
  timeout?: number;
  gaEventName?: string;
  userId?: string;
  debug?: boolean;
  eventUuid?: string;
}

interface UserActivityStatus {
  isMonitoring: boolean;
  isPageVisible: boolean;
  timeoutMinutes: number;
  hasActiveTimer: boolean;
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

  // 状态管理
  private timer: NodeJS.Timeout | null = null;
  private isPageVisible: boolean = true;
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
    // 用户活动事件绑定
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleUserActivity, true);
    });

    // 只监听 focus 事件，移除 blur
    window.addEventListener("focus", this.handleUserActivity, true);

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.cleanup);
  }

  private handleUserActivity(): void {
    if (!this.isPageVisible) return;
    this.log("检测到用户活动，重置定时器");
    this.resetTimer();
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.log("页面隐藏，停止监测");
      this.isPageVisible = false;
      this.stopMonitoring();
    } else {
      this.log("页面显示，重新开始监测");
      this.isPageVisible = true;
      this.startMonitoring();
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) this.clearTimer();
    this.isMonitoring = true;
    this.timer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeout);
    this.log("开始监测：", this.timeout / 1000 / 60, "分钟无活动");
  }

  private stopMonitoring(): void {
    this.clearTimer();
    this.isMonitoring = false;
    this.log("停止活动监测");
  }

  private resetTimer(): void {
    if (!this.isMonitoring) return;
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeout);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private handleTimeout(): void {
    this.log("用户无活动超时，触发 GA 事件");
    this.sendGAEvent();
    if (this.isPageVisible) {
      this.startMonitoring();
    }
  }

  private sendGAEvent(): void {
    try {
      if (typeof window.gtag === "function") {
        trackEvent(
          this.gaEventName,
          {
            time: Date.now(),
            userId: this.userId,
            metis_event_id: this.eventUuid,
          },
          this.debug,
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
      isPageVisible: this.isPageVisible,
      timeoutMinutes: Math.floor(this.timeout / 1000 / 60),
      hasActiveTimer: !!this.timer,
    };
  }

  private cleanup(): void {
    this.log("清理事件监听和定时器");
    this.stopMonitoring();

    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.handleUserActivity, true);
    });

    window.removeEventListener("focus", this.handleUserActivity, true);
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
