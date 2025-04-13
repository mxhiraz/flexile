import { TrashIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  Circle,
  CircleCheck,
  CircleDot,
  GitMerge,
  GitPullRequestArrow,
  GitPullRequestClosed,
  GitPullRequestDraft,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import Input from "@/components/Input";
import { linkClasses } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"; // Assuming command was added by shadcn cli
import { useCurrentCompany } from "@/global";
import type { RouterInput, RouterOutput } from "@/trpc";
import { trpc } from "@/trpc/client";
import type { IssueOrPullRequest } from "@/trpc/routes/github";
import { cn, e } from "@/utils";

type Task = RouterOutput["teamUpdates"]["list"][number]["tasks"][number];
type GithubIntegrationRecord = IssueOrPullRequest | NonNullable<Task["integrationRecord"]>;
export const Task = ({ task }: { task: Task }) => (
  <li className="flex min-w-full">
    {!task.integrationRecord && (
      <div className="mt-[2px] flex items-center">
        {task.completedAt ? (
          <CheckCircleIcon className="text-green mr-2 h-5 w-5" />
        ) : (
          <Circle className="mr-2 h-5 w-5 text-gray-300" />
        )}
      </div>
    )}
    <div className="min-w-0 flex-1">
      {task.integrationRecord ? (
        <div className="flex items-center gap-2">
          <GithubIcon integrationRecord={task.integrationRecord} />
          <a
            href={task.integrationRecord.url}
            className={cn(linkClasses, "block flex-1 truncate p-2")}
            target="_blank"
            rel="noopener noreferrer"
          >
            #{task.integrationRecord.resource_id} {task.integrationRecord.description}
          </a>
        </div>
      ) : (
        <span className="block p-2">{task.name}</span>
      )}
    </div>
  </li>
);

type InputTask = RouterInput["teamUpdates"]["set"]["tasks"][number];
export const TaskInput = ({
  focused,
  task,
  onChange,
  onEnter,
  onRemove,
  onClick,
  onSelectIntegrationRecord,
}: {
  focused: boolean;
  task: InputTask;
  onChange: (task: InputTask) => void;
  onSelectIntegrationRecord: (record: IssueOrPullRequest) => void;
  onEnter: () => void;
  onRemove: () => void;
  onClick: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const company = useCurrentCompany();
  const utils = trpc.useUtils();

  const [debouncedDescription] = useDebounce(task.name, 300);
  const [hideSearchResults, setHideSearchResults] = useState(false);

  const { data: githubSearchResults } = trpc.github.search.useQuery(
    {
      companyId: company.id,
      query: /#(.*)/u.exec(debouncedDescription)?.[1] ?? null,
    },
    {
      enabled: !!debouncedDescription.includes("#") && !task.integrationRecord,
    },
  );

  useEffect(() => setHideSearchResults(false), [githubSearchResults]);

  const handlePaste = async (event: React.ClipboardEvent) => {
    let url: URL;
    const pastedText = event.clipboardData.getData("text");

    try {
      url = new URL(pastedText);
    } catch {
      return;
    }

    if (!url.host.startsWith("github.com")) return;

    const result = await utils.client.github.unfurl.query({
      companyId: company.id,
      url: url.toString(),
    });

    if (!result) return;
    onSelectIntegrationRecord(result);
  };

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  return (
    <li onClick={onClick} className="group flex min-w-full">
      {!task.integrationRecord && (
        <button
          type="button"
          className="mt-[2px]"
          onClick={() => onChange({ ...task, completedAt: task.completedAt ? null : new Date() })}
          role="checkbox"
          aria-checked={!!task.completedAt}
        >
          {task.completedAt ? (
            <CheckCircleIcon className="text-green mr-2 h-5 w-5" aria-hidden="true" />
          ) : (
            <Circle className={cn("mr-2 h-5 w-5 text-gray-300", { "text-gray-100": !task.name })} aria-hidden="true" />
          )}
        </button>
      )}
      <div className="relative min-w-0 flex-1">
        {task.integrationRecord ? (
          <div className="flex items-center gap-2">
            <GithubIcon integrationRecord={task.integrationRecord} />
            <a
              href={task.integrationRecord.url}
              className={cn(linkClasses, "block flex-1 truncate p-2")}
              target="_blank"
              rel="noopener noreferrer"
            >
              #{task.integrationRecord.resource_id} {task.integrationRecord.description}
            </a>
          </div>
        ) : (
          <Input
            ref={inputRef}
            value={task.name || ""}
            className="border-none bg-transparent p-0"
            placeholder="Describe your task"
            onKeyDown={(e) => {
              switch (e.key) {
                case "Enter": {
                  if (!githubSearchResults?.length) {
                    e.preventDefault(); // Prevent form submission only if we handle it
                    onEnter();
                  }
                  break;
                }
                case "Escape":
                  setHideSearchResults(true);
                  break;
              }
            }}
            onChange={(value) => onChange({ ...task, name: value })}
            onPaste={(event) => void handlePaste(event)}
          />
        )}
        {githubSearchResults?.length && !task.integrationRecord && !hideSearchResults ? (
          <div className="absolute z-10 mt-1 rounded-md bg-white shadow-lg"></div>
        ) : null}
      </div>
      <Button
        variant="link"
        aria-label="Remove"
        className="invisible flex w-10 justify-center group-focus-within:visible group-hover:visible"
        onClick={e(onRemove, "stop")}
        disabled={!task.name}
      >
        <TrashIcon className="size-4" />
        {/* Shadcn Command replaces the old ul */}
        <Command className="rounded-lg border shadow-md">
          {/* Input is already handled by the main TaskInput Input, so CommandInput is not needed here */}
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {githubSearchResults?.map((item) => (
                <CommandItem
                  key={item.external_id}
                  value={item.external_id} // Use external_id or another unique identifier as value
                  onSelect={() => {
                    onSelectIntegrationRecord(item);
                    setHideSearchResults(true); // Hide after selection
                  }}
                >
                  {/* Replicate the visual structure */}
                  <div className="flex w-full items-center gap-2">
                    <GithubIcon integrationRecord={item} />
                    <div className="min-w-12 whitespace-nowrap text-gray-500">#{item.resource_id}</div>
                    <div className="truncate font-medium">
                      {item.description} {/* CommandItem handles truncation, but maybe add explicit class */}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </Button>
    </li>
  );
};

const GithubIcon = ({ integrationRecord }: { integrationRecord: GithubIntegrationRecord }) => {
  if (integrationRecord.resource_name === "pulls") {
    switch (integrationRecord.status) {
      case "open":
        return <GitPullRequestArrow className="stroke-green h-5 w-5" />;
      case "closed":
        return <GitPullRequestClosed className="stroke-red h-5 w-5" />;
      case "merged":
        return <GitMerge className="h-5 w-5 stroke-purple-600" />;
      case "draft":
        return <GitPullRequestDraft className="h-5 w-5 stroke-gray-400" />;
      default:
        return null;
    }
  }

  return integrationRecord.status === "open" ? (
    <CircleDot className="stroke-green h-5 w-5" />
  ) : (
    <CircleCheck className="h-5 w-5 stroke-purple-600" />
  );
};
