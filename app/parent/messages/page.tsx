import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = { title: "Messages" };

export default function ParentMessagesPage() {
  return (
    <MessagesClient
      breadcrumbs={[
        { label: "Espace parent" },
        { label: "Messages" },
      ]}
    />
  );
}
