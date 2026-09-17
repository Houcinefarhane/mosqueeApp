import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = { title: "Messages" };

export default function ProfesseurMessagesPage() {
  return (
    <MessagesClient
      breadcrumbs={[
        { label: "Espace professeur" },
        { label: "Messages" },
      ]}
    />
  );
}
