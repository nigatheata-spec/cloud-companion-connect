import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Btn, Chip } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { fetchGroups, fetchMembers, type Member } from "@/lib/admin";

const ROLE_LABEL = {
  participant: "يافع",
  parent: "ولي أمر",
  supervisor: "مشرفة",
} as const;

export function RosterPanel() {
  const [filter, setFilter] = useState<"participant" | "parent" | "supervisor">("participant");

  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const membersQuery = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const groups = groupsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  const shown = members.filter((m) => m.role === filter);
  const parents = members.filter((m) => m.role === "parent");

  return (
    <>
      <div className="flex rounded-2xl bg-muted p-1">
        {(["participant", "parent", "supervisor"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold ${
              filter === r ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      {shown.map((m) => (
        <MemberRow key={m.id} member={m} groups={groups} parents={parents} members={members} />
      ))}

      {shown.length === 0 ? (
        <p className="panel p-5 text-sm text-muted-foreground">
          لا يوجد أعضاء بهذا الدور بعد.
        </p>
      ) : null}
    </>
  );
}

function MemberRow({
  member,
  groups,
  parents,
  members,
}: {
  member: Member;
  groups: { id: string; name: string }[];
  parents: Member[];
  members: Member[];
}) {
  const qc = useQueryClient();
  const isParticipant = member.role === "participant";

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["members"] });
    void qc.invalidateQueries({ queryKey: ["overview"] });
  };

  const setGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!groupId) {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("participant_id", member.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("group_members")
        .upsert(
          { participant_id: member.id, group_id: groupId },
          { onConflict: "participant_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("تم تحديث المجموعة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkParent = useMutation({
    mutationFn: async (parentId: string) => {
      if (!parentId) return;
      const { error } = await supabase
        .from("parent_links")
        .insert({ parent_id: parentId, participant_id: member.id });
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("تم ربط ولي الأمر");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlinkParent = useMutation({
    mutationFn: async (parentId: string) => {
      const { error } = await supabase
        .from("parent_links")
        .delete()
        .eq("parent_id", parentId)
        .eq("participant_id", member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("تم فك الارتباط");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "—";
  const unlinked = parents.filter((p) => !member.parentIds.includes(p.id));

  return (
    <section className="panel space-y-3 p-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h3 className="truncate text-sm font-black">{member.name}</h3>
        <Chip>{ROLE_LABEL[member.role]}</Chip>
      </header>

      {isParticipant ? (
        <>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground">المجموعة</span>
            <select
              value={member.groupId ?? ""}
              onChange={(e) => setGroup.mutate(e.target.value)}
              className="min-h-11 w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">بدون مجموعة</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">أولياء الأمر</span>
            {member.parentIds.map((pid) => (
              <div key={pid} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="truncate text-xs">{nameOf(pid)}</span>
                <Btn
                  tone="ghost"
                  className="min-h-9 px-3 text-xs"
                  onClick={() => unlinkParent.mutate(pid)}
                >
                  فك الارتباط
                </Btn>
              </div>
            ))}
            {member.parentIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">لم يُربط ولي أمر بعد.</p>
            ) : null}

            {unlinked.length > 0 ? (
              <select
                value=""
                onChange={(e) => linkParent.mutate(e.target.value)}
                className="min-h-11 w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">إضافة ولي أمر…</option>
                {unlinked.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </>
      ) : null}

      {member.role === "parent" ? (
        <p className="text-xs text-muted-foreground">
          {members.filter((m) => m.parentIds.includes(member.id)).length} يافع مرتبط
        </p>
      ) : null}
    </section>
  );
}
