import type { FindTask } from "@/lib/find-tasks";
import type { TodoItem } from "@/lib/yaml";

export const itemTypes = {
  informalDef: {
    label: "Informal Definition",
    className: "bg-(--accent-tint) text-accent border-accent/20",
    tagPrefix: "informal_def",
  },
  informalLemma: {
    label: "Informal Lemma",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
    tagPrefix: "informal_lemma",
  },
  semiformal: {
    label: "Semiformal Result",
    className: "bg-(--accent-tint) text-accent border-accent/20",
    tagPrefix: "semiformal_result",
  },
  sorryful: {
    label: "Sorryful Result",
    className: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
    tagPrefix: "sorryful result",
  },
  todo: {
    label: "TODO Item",
    className: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400",
    tagPrefix: "TODO",
  },
  githubIssue: {
    label: "GitHub Issue",
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  },
};

export type ItemType = keyof typeof itemTypes;

export function getItemType(item: TodoItem): ItemType {
  if (item.isGitHubIssue) return "githubIssue";
  if (item.isInformalDef) return "informalDef";
  if (item.isInformalLemma) return "informalLemma";
  if (item.isSemiFormalResult) return "semiformal";
  if (item.isSorryfulResult) return "sorryful";
  return "todo";
}

export function filterTaskSearch(tasks: FindTask[], query: string): FindTask[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return tasks;

  return tasks.filter((task) => {
    const kind = task.todoItem ? getItemType(task.todoItem) : null;
    const text = [task.title, task.detail, task.source, task.keywords, kind && itemTypes[kind].label]
      .join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
