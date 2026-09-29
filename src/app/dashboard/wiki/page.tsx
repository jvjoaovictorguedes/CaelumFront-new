import WikiClient from "./components/WikiClient";

export default function WikiPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <WikiClient />
    </div>
  );
}
