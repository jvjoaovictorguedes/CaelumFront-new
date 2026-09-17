import { getUserCookie } from "@/app/create/temp-character-data-action";
import MessagesClient from "./components/MessagesClient";

export default async function MessagesPage() {
const user = await getUserCookie();

if (!user?.id) {
return ( <div className="flex h-full flex-col items-center justify-center"> <h1 className="mb-4 font-imFeel text-4xl">
Mensagens </h1>

    <p className="text-lg text-gray-700">
      Faça login para ver suas mensagens.
    </p>
  </div>
);
}
return <MessagesClient currentUserId={Number(user.id)} />;
}
