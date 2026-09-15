import React from "react";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface EndScreenProps {
  channelName: string;
  nextVideoTitle?: string;
}

/** Standard end screen: subscribe prompt plus a suggested next video slot (rendered as a placeholder panel). */
export const EndScreen: React.FC<EndScreenProps> = ({ channelName, nextVideoTitle }) => {
  const enter = useEnter(0);
  return (
    <SafeArea>
      <div style={fadeSlideStyle(enter)}>
        <h2 style={{ fontSize: 48, margin: 0 }}>Thanks for watching, {channelName}</h2>
        {nextVideoTitle ? (
          <div
            style={{
              marginTop: 32,
              border: `1px solid ${THEME.border}`,
              borderRadius: 16,
              padding: 24,
              background: THEME.panel,
              maxWidth: 640,
            }}
          >
            <div style={{ fontSize: 18, color: THEME.textDim, marginBottom: 8 }}>Watch next</div>
            <div style={{ fontSize: 26 }}>{nextVideoTitle}</div>
          </div>
        ) : null}
      </div>
    </SafeArea>
  );
};
