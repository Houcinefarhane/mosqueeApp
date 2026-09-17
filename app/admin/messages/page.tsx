import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = { title: "Messages" };

export default function AdminMessagesPage() {
  return (
    <MessagesClient
      breadcrumbs={[
        { label: "Administration" },
        { label: "Messages" },
      ]}
    />
  );
}
