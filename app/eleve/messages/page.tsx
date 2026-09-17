import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = { title: "Messages" };

export default function EleveMessagesPage() {
  return (
    <MessagesClient
      breadcrumbs={[
        { label: "Espace élève" },
        { label: "Messages" },
      ]}
    />
  );
}
