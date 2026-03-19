"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Menu,
  MoreVertical,
} from "lucide-react";
import {
  CircleChatWindow,
  type ChatMessage,
} from "@/components/circles/CircleChatWindow";
import {
  CircleChannelsSidebar,
  type ChannelItem,
} from "@/components/circles/CircleChannelsSidebar";
import { CircleMemberCard } from "@/components/circles/CircleMemberCard";
import { cn } from "@/lib/utils";
import { CircleAvatar } from "@/components/circles/CircleAvatar";

type CircleData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  member_count: number;
  channels: string[];
  channelList: ChannelItem[];
  circle_image_url?: string | null;
};

export default function CircleChatPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug ?? null;
  const [circle, setCircle] = React.useState<CircleData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = React.useState(false);
  const [activeChannel, setActiveChannel] = React.useState<string>("general");
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [sendLoading, setSendLoading] = React.useState(false);
  const [loadOlderLoading, setLoadOlderLoading] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [mainTab, setMainTab] = React.useState<"chat" | "members">("chat");
  const [members, setMembers] = React.useState<any[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${origin}/api/circles/${encodeURIComponent(slug)}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data: CircleData) => {
        setCircle(data);
        if (data.channelList?.[0] && !activeChannel) setActiveChannel(data.channelList[0].slug);
      })
      .catch(() => setLoadError("Circle not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  React.useEffect(() => {
    fetch("/api/me", { credentials: "include" }).then((r) => r.json()).then((d) => setCurrentUserId(d?.id)).catch(() => {});
  }, []);

  // SSE for messages
  React.useEffect(() => {
    if (!slug || !activeChannel || mainTab !== "chat") return;
    const es = new EventSource(`/api/circle-messages/stream?circleSlug=${slug}&channel=${activeChannel}`);
    es.addEventListener("history", (e) => {
       const data = JSON.parse(e.data);
       setMessages(data.messages || []);
       setHasOlder((data.messages || []).length >= 50);
    });
    es.addEventListener("message", (e) => {
       const m = JSON.parse(e.data);
       setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
    });
    return () => es.close();
  }, [slug, activeChannel, mainTab]);

  const handleSend = async (text: string) => {
    setSendLoading(true);
    try {
      await fetch("/api/circle-messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circleSlug: slug, channel: activeChannel, message: text }),
        credentials: "include",
      });
    } finally {
      setSendLoading(false);
    }
  };

  // Render instantly: no blocking loading screen.
  // If we fail to load (or circle never resolves), show the error screen.
  if (!loading && (loadError || !circle)) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
        <p className="mb-4">{loadError}</p>
        <Link href="/circles" className="text-violet-300 hover:text-violet-200">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-transparent flex flex-col overflow-hidden">
      {/* Premium Header */}
      <header className="shrink-0 h-16 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center px-4 gap-4">
        <button onClick={() => setNavOpen(true)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <Menu className="h-6 w-6 text-white/80" />
        </button>

        <div className="flex-1 flex items-center gap-3 overflow-hidden">
           <CircleAvatar
             name={circle?.name ?? "Circle"}
             imageUrl={circle?.circle_image_url ?? null}
             size="sm"
             className="h-10 w-10 rounded-full ring-1 ring-white/10"
           />
           <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-white truncate leading-tight">
                {circle?.name ?? "Circle"}
              </h1>
              <p className="text-[12px] text-white/40 truncate">#{activeChannel}</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => setMainTab(prev => prev === "members" ? "chat" : "members")} className={cn("h-10 w-10 flex items-center justify-center rounded-full transition-colors", mainTab === "members" ? "text-violet-300 bg-violet-500/15" : "text-white/60 hover:bg-white/5")}>
              <Users className="h-5 w-5" />
           </button>
           <button onClick={() => setQuickMenuOpen(!quickMenuOpen)} className="h-10 w-10 flex items-center justify-center rounded-full text-white/60 hover:bg-white/5">
              <MoreVertical className="h-5 w-5" />
           </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
         <CircleChatWindow
            messages={messages}
            currentUserId={currentUserId}
            onSend={handleSend}
            sendLoading={sendLoading}
            fullPage={true}
            className="bg-transparent"
         />

         {/* Sidebar Navigation */}
         {navOpen && (
            <div className="absolute inset-0 z-50 flex animate-in fade-in duration-200">
               <div className="h-full w-[300px] bg-[#0A0A0A] shadow-2xl animate-in slide-in-from-left duration-300">
                  <CircleChannelsSidebar
                    channels={circle?.channelList ?? []}
                    activeChannel={activeChannel}
                    onSelectChannel={(ch) => { setActiveChannel(ch); setNavOpen(false); }}
                  />
               </div>
               <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
            </div>
         )}
      </div>
    </div>
  );
}
