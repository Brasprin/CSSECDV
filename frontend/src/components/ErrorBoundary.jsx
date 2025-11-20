import React, { Component } from "react";
import styles from "./ErrorBoundary.module.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log details for diagnostics without exposing to the user
    // Do NOT display stack traces in UI
    // eslint-disable-next-line no-console
    console.error("UI error captured by ErrorBoundary:", error, errorInfo);
  }

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Generic error overlay using design tokens from global.css
      return (
        <div className={styles.overlay}>
          <div className={styles.content}>
            <div className={styles.icon}>!</div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              An unexpected error occurred. Please try again later.
            </p>
            <div className={styles.actionsRow}>
              <button
                onClick={this.handleGoBack}
                className={styles.primaryLink}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
