import { getUserCookie } from "@/app/create/temp-character-data-action";
import MessagesClient from "./components/MessagesClient";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function MessagesPage() {
const user = await getUserCookie();

if (!user?.id) {
return ( <div className="flex h-full flex-col items-center justify-center"> <PageMusic track={MUSIC.AMBIENTE} /> <h1 className="mb-4 font-imFeel text-4xl">
Mensagens </h1>

    <p className="text-lg text-gray-700">
      Faça login para ver suas mensagens.
    </p>
  </div>
);
}
return (
  <>
    <PageMusic track={MUSIC.AMBIENTE} />
    <MessagesClient currentUserId={Number(user.id)} />
  </>
);
}
