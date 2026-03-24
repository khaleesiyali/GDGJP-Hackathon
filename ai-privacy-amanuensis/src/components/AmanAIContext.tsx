"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LiveKitRoom, useRoomContext, RoomAudioRenderer } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useRouter } from "next/navigation";

type GlobalContextType = {
  token: string;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  currentQuestion: { title: string, description: string };
  setCurrentQuestion: (q: { title: string, description: string }) => void;
  hasConnected: boolean;
  setHasConnected: (v: boolean) => void;
};

export const GlobalContext = createContext<GlobalContextType | null>(null);

export const useAmanAI = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useAmanAI must be used within GlobalLiveKitProvider");
  return ctx;
};

function GlobalAgentListener() {
  const room = useRoomContext();
  const router = useRouter();
  const { setCurrentQuestion } = useAmanAI();

  useEffect(() => {
    // Listen for Agent commands
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.action === "navigate" && data.destination) {
          router.push(data.destination);
        } else if (data.action === "update_card") {
          setCurrentQuestion({
             title: data.title || "ご質問",
             description: data.description || "..."
          });
        }
      } catch (e) {
        // ignore non-json messages
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, router, setCurrentQuestion]);

  return <RoomAudioRenderer />;
}

export function GlobalLiveKitProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
     title: "ご用件について",
     description: "本日はどのようなご用件でしょうか？詳細をお話しください。"
  });

  const connect = async () => {
    if (token) return;
    setIsConnecting(true);
    try {
      let ptName = sessionStorage.getItem("amanai_pt_name");
      if (!ptName) {
        ptName = `user-${Math.random().toString(36).substring(7)}`;
        sessionStorage.setItem("amanai_pt_name", ptName);
      }
      
      const response = await fetch(`/api/token?room_name=form-session&participant_name=${ptName}`);
      if (!response.ok) throw new Error("Backend error fetching token");
      const data = await response.json();
      setToken(data.token);
    } catch (e) {
      console.error(e);
      setToken("");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setToken("");
    setHasConnected(false);
  };

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://jing-139sv34p.livekit.cloud";

  return (
    <GlobalContext.Provider 
      value={{ 
        token, 
        isConnecting, 
        connect, 
        disconnect, 
        currentQuestion, 
        setCurrentQuestion,
        hasConnected,
        setHasConnected
      }}
    >
      <LiveKitRoom
        serverUrl={liveKitUrl}
        token={token || "fake-token-do-not-connect"}
        connect={!!token}
        audio={true}
        video={false}
      >
        <GlobalAgentListener />
        {children}
      </LiveKitRoom>
    </GlobalContext.Provider>
  );
}
