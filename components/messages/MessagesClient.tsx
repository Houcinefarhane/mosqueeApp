"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import { cn, formatDateTime, formatRelativeDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants/status";
import type {
  DestinataireOption,
  MessageBox,
  MessageItem,
} from "@/lib/types/messages";
import {
  ArrowLeft,
  Mail,
  MailPlus,
  MessageSquare,
  Reply,
  Send,
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MessagesClientProps {
  breadcrumbs: BreadcrumbItem[];
}

function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export default function MessagesClient({ breadcrumbs }: MessagesClientProps) {
  const [box, setBox] = useState<MessageBox>("received");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [destinataires, setDestinataires] = useState<DestinataireOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const [receiverId, setReceiverId] = useState("");
  const [objet, setObjet] = useState("");
  const [contenu, setContenu] = useState("");

  const selectedMessage = messages.find((m) => m.id === selectedId) ?? null;

  const loadMessages = useCallback(async (currentBox: MessageBox) => {
    const res = await fetch(`/api/messages?box=${currentBox}`);
    if (!res.ok) throw new Error("Erreur de chargement");
    const data = (await res.json()) as MessageItem[];
    return data;
  }, []);

  const loadDestinataires = useCallback(async () => {
    const res = await fetch("/api/messages/destinataires");
    if (!res.ok) throw new Error("Erreur destinataires");
    const data = (await res.json()) as DestinataireOption[];
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await loadMessages(box);
      setMessages(data);
      if (selectedId && !data.some((m) => m.id === selectedId)) {
        setSelectedId(null);
        setMobileShowDetail(false);
      }
    } catch {
      toast.error("Impossible de charger les messages");
    }
  }, [box, loadMessages, selectedId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [msgs, dest] = await Promise.all([
          loadMessages(box),
          loadDestinataires(),
        ]);
        setMessages(msgs);
        setDestinataires(dest);
      } catch {
        toast.error("Impossible de charger les messages");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [box, loadMessages, loadDestinataires]);

  const markAsRead = async (message: MessageItem) => {
    if (box !== "received" || message.lu) return;
    try {
      const res = await fetch(`/api/messages/${message.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, lu: true } : m))
      );
      window.dispatchEvent(new CustomEvent("messages-updated"));
    } catch {
      toast.error("Impossible de marquer comme lu");
    }
  };

  const handleSelectMessage = async (message: MessageItem) => {
    setSelectedId(message.id);
    setShowReply(false);
    setMobileShowDetail(true);
    await markAsRead(message);
  };

  const resetCompose = () => {
    setReceiverId("");
    setObjet("");
    setContenu("");
    setShowReply(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !objet.trim() || !contenu.trim()) {
      toast.error("Remplissez tous les champs");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, objet, contenu }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur d'envoi");

      toast.success("Message envoyé");
      resetCompose();
      setShowModal(false);
      window.dispatchEvent(new CustomEvent("messages-updated"));

      if (box === "sent") {
        await refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    const replyTo =
      box === "received" ? selectedMessage.sender : selectedMessage.receiver;
    setReceiverId(replyTo.id);
    setObjet(
      selectedMessage.objet.startsWith("Re: ")
        ? selectedMessage.objet
        : `Re: ${selectedMessage.objet}`
    );
    setContenu("");
    setShowReply(true);
  };

  const openNewMessage = () => {
    resetCompose();
    setShowModal(true);
  };

  const displayPerson = (message: MessageItem) =>
    box === "received" ? message.sender : message.receiver;

  const destinataireOptions = (() => {
    const options = destinataires.map((d) => ({
      value: d.id,
      label: `${d.prenom} ${d.nom} (${ROLE_LABELS[d.role]})`,
    }));

    if (
      receiverId &&
      !options.some((o) => o.value === receiverId) &&
      selectedMessage
    ) {
      const person =
        box === "received" ? selectedMessage.sender : selectedMessage.receiver;
      if (person.id === receiverId) {
        options.unshift({
          value: person.id,
          label: `${person.prenom} ${person.nom} (${ROLE_LABELS[person.role]})`,
        });
      }
    }

    return [{ value: "", label: "Sélectionner un destinataire" }, ...options];
  })();

  const composeForm = (onCancel: () => void, submitLabel: string) => (
    <form onSubmit={handleSend} className="space-y-4">
      <Select
        label="Destinataire"
        required
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
        options={destinataireOptions}
      />
      <Input
        label="Objet"
        required
        value={objet}
        onChange={(e) => setObjet(e.target.value)}
        placeholder="Objet du message"
      />
      <Textarea
        label="Message"
        required
        rows={5}
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        placeholder="Votre message…"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSending}>
          <Send className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Messagerie interne de la mosquée"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={openNewMessage}>
            <MailPlus className="h-4 w-4" />
            Nouveau message
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Liste — colonne gauche */}
        <Card
          className={cn(
            "overflow-hidden lg:col-span-1",
            mobileShowDetail && "hidden lg:block"
          )}
        >
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => {
                setBox("received");
                setSelectedId(null);
                setMobileShowDetail(false);
              }}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                box === "received"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Reçus
            </button>
            <button
              type="button"
              onClick={() => {
                setBox("sent");
                setSelectedId(null);
                setMobileShowDetail(false);
              }}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                box === "sent"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Envoyés
            </button>
          </div>

          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                Chargement…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-gray-500">
                <Mail className="h-8 w-8 text-gray-300" />
                Aucun message {box === "received" ? "reçu" : "envoyé"}
              </div>
            ) : (
              <ul>
                {messages.map((message) => {
                  const person = displayPerson(message);
                  const isSelected = selectedId === message.id;
                  const isUnread = box === "received" && !message.lu;

                  return (
                    <li key={message.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectMessage(message)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors",
                          isSelected && "bg-primary/5",
                          isUnread && "bg-emerald-50/60",
                          !isSelected && !isUnread && "hover:bg-gray-50"
                        )}
                      >
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(person.prenom, person.nom)}
                          </div>
                          {isUnread && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p
                              className={cn(
                                "truncate text-sm",
                                isUnread ? "font-semibold text-foreground" : "font-medium text-gray-700"
                              )}
                            >
                              {person.prenom} {person.nom}
                            </p>
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {formatRelativeDate(message.createdAt)}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "mt-0.5 truncate text-xs",
                              isUnread ? "font-medium text-gray-700" : "text-gray-500"
                            )}
                          >
                            {truncate(message.objet, 40)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Détail — colonne droite */}
        <Card
          className={cn(
            "flex min-h-[420px] flex-col lg:col-span-2",
            !mobileShowDetail && "hidden lg:flex"
          )}
        >
          {selectedMessage ? (
            <>
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileShowDetail(false);
                      setSelectedId(null);
                    }}
                    className="mt-0.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
                    aria-label="Retour à la liste"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      {selectedMessage.objet}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {box === "received" ? "De" : "À"}{" "}
                      <span className="font-medium text-gray-700">
                        {displayPerson(selectedMessage).prenom}{" "}
                        {displayPerson(selectedMessage).nom}
                      </span>
                      {" · "}
                      {ROLE_LABELS[displayPerson(selectedMessage).role]}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDateTime(selectedMessage.createdAt)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReply}>
                    <Reply className="h-4 w-4" />
                    Répondre
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {selectedMessage.contenu}
                </p>
              </div>

              {showReply && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Répondre
                  </p>
                  {composeForm(() => setShowReply(false), "Envoyer")}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Sélectionnez un message
              </p>
              <p className="max-w-xs text-xs text-gray-500">
                Choisissez un message dans la liste ou composez un nouveau message.
              </p>
              <Button variant="outline" size="sm" onClick={openNewMessage}>
                <MailPlus className="h-4 w-4" />
                Nouveau message
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetCompose();
        }}
        title="Nouveau message"
      >
        {composeForm(() => setShowModal(false), "Envoyer")}
      </Modal>
    </div>
  );
}
