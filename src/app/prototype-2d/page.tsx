import { redirect } from "next/navigation";
// O protótipo passa pelo mesmo middleware e gate individual do mundo.
export default function Prototype2DPage() { redirect("/dashboard/mundo"); }
