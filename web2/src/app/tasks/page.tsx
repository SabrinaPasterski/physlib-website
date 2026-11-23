import type { Metadata } from "next";
import Link from "next/link";
import { getFindTasks } from "@/lib/find-tasks";
import { TaskList } from "./task-list";

export const metadata: Metadata = {
  title: "Find a Task | Physlib",
  description: "Search open GitHub issues, Lean TODOs, documentation tasks, and API map work in Physlib.",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[]; q?: string | string[] }>;
}) {
  const [data, filters] = await Promise.all([getFindTasks(), searchParams]);

  return (
    <div className="page-frame-tracker max-w-4xl">
      <h1 className="page-title-tracker">Find a Task</h1>
      <p className="page-intro-tracker mb-7">
        Find GitHub tickets, unfinished work marked in Lean files, and tasks for documentation and API maps.{" "}
        <Link href="/ai-resources#task-discovery" className="text-accent hover:underline underline-offset-2">
          Connect an AI assistant
        </Link>{" or "}
        <a href="/api/tasks" className="text-accent hover:underline underline-offset-2">get the task list as JSON</a>.
      </p>
      <TaskList
        {...data}
        initialType={typeof filters.type === "string" ? filters.type : undefined}
        initialQuery={typeof filters.q === "string" ? filters.q : undefined}
      />
    </div>
  );
}
