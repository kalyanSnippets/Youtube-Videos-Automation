import React from "react";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface CTAProps {
  message: string;
  subMessage?: string;
}

/** Call-to-action card (subscribe, link in description, etc). Low-medium intensity. */
export const CTA: React.FC<CTAProps> = ({ message, subMessage }) => {
  const enter = useEnter(0);
  return (
    <SafeArea>
      <div style={{ ...fadeSlideStyle(enter), textAlign: "center" }}>
        <h2 style={{ fontSize: 56, margin: 0, color: THEME.text }}>{message}</h2>
        {subMessage ? <p style={{ fontSize: 26, color: THEME.cyan, marginTop: 12 }}>{subMessage}</p> : null}
      </div>
    </SafeArea>
  );
};
