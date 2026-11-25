import { getActivity } from "@/lib/physlib-activity";

export const revalidate = 300;

export async function GET() {
  const activity = await getActivity();
  return activity
    ? Response.json(activity)
    : Response.json({ error: "Activity unavailable" }, { status: 503 });
}
