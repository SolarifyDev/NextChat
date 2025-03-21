"use client";

import React from "react";
import { IconButton } from "./button";
import GithubIcon from "../icons/github.svg";
import ResetIcon from "../icons/reload.svg";
import { ISSUE_URL } from "../constant";
import { showConfirm } from "./ui-lib";
import { useSyncStore } from "../store/sync";
import { useNewChatStore } from "../store/new-chat";
import { withTranslation, WithTranslation } from "react-i18next";

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

interface ErrorBoundaryProps extends WithTranslation {
  children: React.ReactNode; // 显式声明 children 属性
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  IErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Update state with error details
    this.setState({ hasError: true, error, info });
  }

  clearAndSaveData() {
    try {
      useSyncStore.getState().export();
    } finally {
      useNewChatStore.getState().clearAllData();
    }
  }

  render() {
    const { t, children } = this.props;
    if (this.state.hasError) {
      // Render error message
      return (
        <div className="error">
          <h2>Oops, something went wrong!</h2>
          <pre>
            <code>{this.state.error?.toString()}</code>
            <code>{this.state.info?.componentStack}</code>
          </pre>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <a href={ISSUE_URL} className="report">
              <IconButton
                text="Report This Error"
                icon={<GithubIcon />}
                bordered
              />
            </a>
            <IconButton
              icon={<ResetIcon />}
              text="Clear All Data"
              onClick={async () => {
                // if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
                if (await showConfirm(t("Settings.Danger.Reset.Confirm"))) {
                  this.clearAndSaveData();
                }
              }}
              bordered
            />
          </div>
        </div>
      );
    }
    // if no error occurred, render children
    return children;
  }
}

export default withTranslation()(ErrorBoundary);
