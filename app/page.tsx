import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Home() {
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <ChatWindow />
    </div>
  );
}

