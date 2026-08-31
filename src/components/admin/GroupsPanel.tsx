import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Area, Btn, Chip, Field } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchGroups, fetchMembers, type Group } from "@/lib/admin";

export function GroupsPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);

  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const membersQuery = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const groups = groupsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  const countIn = (groupId: string) =>
    members.filter((m) => m.role === "participant" && m.groupId === groupId).length;
  const supervisors = members.filter((m) => m.role === "supervisor");
  const supervisorName = (id: string | null) =>
    id ? supervisors.find((s) => s.id === id)?.name ?? "—" : null;

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["groups"] });
      void qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("تم حذف المجموعة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (creating || editing) {
    return (
      <GroupForm
        group={editing}
        createdBy={user?.id ?? null}
        supervisors={members.filter((m) => m.role === "supervisor")}
        onDone={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <>
      <Btn className="w-full" onClick={() => setCreating(true)}>
        <Plus className="h-4 w-4" />
        مجموعة جديدة
      </Btn>

      {groups.map((g) => (
        <section key={g.id} className="panel space-y-3 p-4">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black">{g.name}</h3>
              {g.starts_on ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">تبدأ {g.starts_on}</p>
              ) : null}
            </div>
            <Chip tone={g.is_active ? "success" : "muted"}>
              {g.is_active ? "نشطة" : "منتهية"}
            </Chip>
          </header>

          {g.note ? <p className="text-xs text-muted-foreground">{g.note}</p> : null}

          <p className="text-xs text-muted-foreground">
            {countIn(g.id)} مشارك
            {supervisorName(g.supervisor_id) ? ` · تشرف عليها ${supervisorName(g.supervisor_id)}` : " · بدون مشرفة"}
          </p>

          <div className="flex gap-2">
            <Btn tone="ghost" className="min-h-9 flex-1 text-xs" onClick={() => setEditing(g)}>
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Btn>
            <Btn
              tone="ghost"
              className="min-h-9 px-3 text-xs"
              onClick={() => {
                if (countIn(g.id) > 0) {
                  toast.error("انقل المشاركين إلى مجموعة أخرى قبل الحذف");
                  return;
                }
                remove.mutate(g.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Btn>
          </div>
        </section>
      ))}

      {groups.length === 0 ? (
        <p className="panel p-5 text-sm text-muted-foreground">
          لا توجد مجموعات بعد. أنشئ مجموعة لتنظيم المشاركين حسب المخيم أو الدفعة.
        </p>
      ) : null}
    </>
  );
}

function GroupForm({
  group,
  createdBy,
  supervisors,
  onDone,
}: {
  group: Group | null;
  createdBy: string | null;
  supervisors: { id: string; name: string }[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(group?.name ?? "");
  const [note, setNote] = useState(group?.note ?? "");
  const [startsOn, setStartsOn] = useState(group?.starts_on ?? "");
  const [isActive, setIsActive] = useState(group?.is_active ?? true);
  const [supervisorId, setSupervisorId] = useState(group?.supervisor_id ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("اسم المجموعة مطلوب");
      const payload = {
        name: name.trim(),
        note: note.trim(),
        starts_on: startsOn || null,
        is_active: isActive,
        supervisor_id: supervisorId || null,
      };
      const { error } = group
        ? await supabase.from("groups").update(payload).eq("id", group.id)
        : await supabase.from("groups").insert({ ...payload, created_by: createdBy });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success(group ? "تم تحديث المجموعة" : "تم إنشاء المجموعة");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="panel space-y-4 p-5">
      <h3 className="text-sm font-black">{group ? "تعديل المجموعة" : "مجموعة جديدة"}</h3>

      <Field
        label="اسم المجموعة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="مخيم صيف 2026"
      />
      <Field
        label="تاريخ البداية"
        type="date"
        value={startsOn}
        onChange={(e) => setStartsOn(e.target.value)}
      />
      <Area
        label="ملاحظات"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="وصف مختصر للمجموعة"
      />

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">المشرفة المسؤولة</span>
        <select
          value={supervisorId}
          onChange={(e) => setSupervisorId(e.target.value)}
          className="min-h-11 w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">بدون تخصيص</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
        <span className="text-xs font-bold">مجموعة نشطة</span>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-5 w-5 accent-[var(--accent)]"
        />
      </label>

      <div className="flex gap-2">
        <Btn className="flex-1" disabled={save.isPending} onClick={() => save.mutate()}>
          حفظ
        </Btn>
        <Btn tone="ghost" className="flex-1" onClick={onDone}>
          إلغاء
        </Btn>
      </div>
    </section>
  );
}
