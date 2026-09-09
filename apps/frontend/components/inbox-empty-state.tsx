import { MessageSquare } from "lucide-react";

export const InboxEmptyState = ({ selectedProjectId }: { selectedProjectId?: string }) => {
  return (
    <div className="grid h-full place-items-center bg-input p-6 text-center">
      <div className="max-w-xs space-y-2">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-brand">
          <MessageSquare size={24} />
        </div>
        <h3 className="text-sm font-semibold text-primary">
          {!selectedProjectId ? "Select a Project" : "Select a Conversation"}
        </h3>
        <p className="text-xs text-muted">
          {!selectedProjectId
            ? "Click on any project on the left to browse contacts and conversation threads."
            : "Choose a contact from the list on the left to start viewing and replying to their messages."}
        </p>
      </div>
    </div>
  );
};
