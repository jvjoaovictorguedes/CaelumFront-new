import { getUserCookie } from "@/app/create/temp-character-data-action";
import MessagesClient from "./components/MessagesClient";

export default async function MessagesPage() {
  const user = await getUserCookie();

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Mensagens</h1>
        <p className="text-lg text-gray-700">
          Faça login para ver suas mensagens.
        </p>
      </div>
    );
  }

  return <MessagesClient currentUserId={Number(user.id)} />;
}
