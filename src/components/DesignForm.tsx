import { Plus, Trash2 } from "lucide-react";
import { uid } from "@/domain/practice-service";
import {
  RELATIONSHIP_TYPES,
  type RelationshipType,
  type StructuredDesignContent,
} from "@/domain/types";
import type { ValidationResult } from "@/domain/validation";
import { issuesFor } from "@/domain/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: StructuredDesignContent;
  onChange: (next: StructuredDesignContent) => void;
  validation: ValidationResult | null;
  disabled?: boolean;
}

function FieldError({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {messages[0]}
    </p>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function DesignForm({ value, onChange, validation, disabled }: Props) {
  const errors = (field: string) =>
    validation ? issuesFor(validation, field) : [];

  const patch = (partial: Partial<StructuredDesignContent>) =>
    onChange({ ...value, ...partial });

  const entityNames = [
    ...value.classes.map((c) => c.name).filter(Boolean),
    ...value.interfaces.map((i) => i.name).filter(Boolean),
  ];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Classes"
        description="Name, single responsibility, and the methods it exposes."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patch({
                classes: [
                  ...value.classes,
                  { id: uid(), name: "", responsibility: "", methods: "" },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add Class
          </Button>
        }
      >
        {value.classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No classes yet — add at least one to submit.
          </p>
        ) : null}
        {value.classes.map((cls, index) => (
          <div
            key={cls.id}
            className="rounded-lg border border-border bg-background/60 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`class-name-${cls.id}`} className="text-xs">
                  Class name
                </Label>
                <Input
                  id={`class-name-${cls.id}`}
                  disabled={disabled}
                  className="mono mt-1"
                  placeholder="ParkingLot"
                  value={cls.name}
                  onChange={(e) =>
                    patch({
                      classes: value.classes.map((c) =>
                        c.id === cls.id ? { ...c, name: e.target.value } : c,
                      ),
                    })
                  }
                />
                <FieldError messages={errors(`classes.${index}.name`)} />
              </div>
              <div>
                <Label htmlFor={`class-methods-${cls.id}`} className="text-xs">
                  Methods (name, params, returns)
                </Label>
                <Input
                  id={`class-methods-${cls.id}`}
                  disabled={disabled}
                  className="mono mt-1"
                  placeholder="park(vehicle): Ticket, remove(ticket): Fee"
                  value={cls.methods}
                  onChange={(e) =>
                    patch({
                      classes: value.classes.map((c) =>
                        c.id === cls.id ? { ...c, methods: e.target.value } : c,
                      ),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor={`class-resp-${cls.id}`} className="text-xs">
                Responsibility
              </Label>
              <Textarea
                id={`class-resp-${cls.id}`}
                disabled={disabled}
                rows={2}
                className="mt-1"
                placeholder="Allocates a free spot to an arriving vehicle."
                value={cls.responsibility}
                onChange={(e) =>
                  patch({
                    classes: value.classes.map((c) =>
                      c.id === cls.id
                        ? { ...c, responsibility: e.target.value }
                        : c,
                    ),
                  })
                }
              />
              <FieldError messages={errors(`classes.${index}.responsibility`)} />
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  patch({
                    classes: value.classes.filter((c) => c.id !== cls.id),
                  })
                }
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          </div>
        ))}
        <FieldError messages={errors("classes")} />
      </SectionCard>

      <SectionCard
        title="Interfaces"
        description="Contracts that let collaborators be swapped."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patch({
                interfaces: [
                  ...value.interfaces,
                  { id: uid(), name: "", responsibility: "", methods: "" },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add Interface
          </Button>
        }
      >
        {value.interfaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Optional, but most good designs have at least one seam.
          </p>
        ) : null}
        {value.interfaces.map((itf, index) => (
          <div
            key={itf.id}
            className="rounded-lg border border-border bg-background/60 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`itf-name-${itf.id}`} className="text-xs">
                  Interface name
                </Label>
                <Input
                  id={`itf-name-${itf.id}`}
                  disabled={disabled}
                  className="mono mt-1"
                  placeholder="PricingStrategy"
                  value={itf.name}
                  onChange={(e) =>
                    patch({
                      interfaces: value.interfaces.map((i) =>
                        i.id === itf.id ? { ...i, name: e.target.value } : i,
                      ),
                    })
                  }
                />
                <FieldError messages={errors(`interfaces.${index}.name`)} />
              </div>
              <div>
                <Label htmlFor={`itf-methods-${itf.id}`} className="text-xs">
                  Methods
                </Label>
                <Input
                  id={`itf-methods-${itf.id}`}
                  disabled={disabled}
                  className="mono mt-1"
                  placeholder="price(ticket): Money"
                  value={itf.methods}
                  onChange={(e) =>
                    patch({
                      interfaces: value.interfaces.map((i) =>
                        i.id === itf.id ? { ...i, methods: e.target.value } : i,
                      ),
                    })
                  }
                />
                <FieldError messages={errors(`interfaces.${index}.methods`)} />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor={`itf-resp-${itf.id}`} className="text-xs">
                Responsibility
              </Label>
              <Textarea
                id={`itf-resp-${itf.id}`}
                disabled={disabled}
                rows={2}
                className="mt-1"
                placeholder="Computes the fee for a completed stay."
                value={itf.responsibility}
                onChange={(e) =>
                  patch({
                    interfaces: value.interfaces.map((i) =>
                      i.id === itf.id
                        ? { ...i, responsibility: e.target.value }
                        : i,
                    ),
                  })
                }
              />
              <FieldError
                messages={errors(`interfaces.${index}.responsibility`)}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  patch({
                    interfaces: value.interfaces.filter((i) => i.id !== itf.id),
                  })
                }
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Relationships"
        description="How your entities are connected, and why."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patch({
                relationships: [
                  ...value.relationships,
                  {
                    id: uid(),
                    from: entityNames[0] ?? "",
                    type: "composition",
                    to: entityNames[1] ?? "",
                    reason: "",
                  },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add Relationship
          </Button>
        }
      >
        {value.relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Declare ownership and dependency direction between your entities.
          </p>
        ) : null}
        {value.relationships.map((rel, index) => (
          <div
            key={rel.id}
            className="rounded-lg border border-border bg-background/60 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor={`rel-from-${rel.id}`} className="text-xs">
                  From
                </Label>
                <select
                  id={`rel-from-${rel.id}`}
                  disabled={disabled}
                  className="mono mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={rel.from}
                  onChange={(e) =>
                    patch({
                      relationships: value.relationships.map((r) =>
                        r.id === rel.id ? { ...r, from: e.target.value } : r,
                      ),
                    })
                  }
                >
                  <option value="">Select…</option>
                  {entityNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <FieldError messages={errors(`relationships.${index}.from`)} />
              </div>
              <div>
                <Label htmlFor={`rel-type-${rel.id}`} className="text-xs">
                  Type
                </Label>
                <select
                  id={`rel-type-${rel.id}`}
                  disabled={disabled}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={rel.type}
                  onChange={(e) =>
                    patch({
                      relationships: value.relationships.map((r) =>
                        r.id === rel.id
                          ? { ...r, type: e.target.value as RelationshipType }
                          : r,
                      ),
                    })
                  }
                >
                  {RELATIONSHIP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`rel-to-${rel.id}`} className="text-xs">
                  To
                </Label>
                <select
                  id={`rel-to-${rel.id}`}
                  disabled={disabled}
                  className="mono mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={rel.to}
                  onChange={(e) =>
                    patch({
                      relationships: value.relationships.map((r) =>
                        r.id === rel.id ? { ...r, to: e.target.value } : r,
                      ),
                    })
                  }
                >
                  <option value="">Select…</option>
                  {entityNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <FieldError messages={errors(`relationships.${index}.to`)} />
              </div>
              <div>
                <Label htmlFor={`rel-reason-${rel.id}`} className="text-xs">
                  Reason
                </Label>
                <Input
                  id={`rel-reason-${rel.id}`}
                  disabled={disabled}
                  className="mt-1"
                  placeholder="A lot owns its spots"
                  value={rel.reason}
                  onChange={(e) =>
                    patch({
                      relationships: value.relationships.map((r) =>
                        r.id === rel.id ? { ...r, reason: e.target.value } : r,
                      ),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  patch({
                    relationships: value.relationships.filter(
                      (r) => r.id !== rel.id,
                    ),
                  })
                }
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Design explanation"
        description="Required. Why these abstractions, and what you assumed."
      >
        <Textarea
          id="explanation"
          rows={6}
          disabled={disabled}
          placeholder="Explain your design decisions, assumptions, and why you chose these abstractions."
          value={value.explanation}
          onChange={(e) => patch({ explanation: e.target.value })}
        />
        <FieldError messages={errors("explanation")} />
      </SectionCard>

      <SectionCard
        title="Edge cases"
        description="One per line. Failure paths are where designs break."
      >
        <Textarea
          id="edge-cases"
          rows={4}
          disabled={disabled}
          placeholder={"Lot is full for the requested vehicle type\nTicket is lost on exit"}
          value={value.edgeCases}
          onChange={(e) => patch({ edgeCases: e.target.value })}
        />
      </SectionCard>

      <SectionCard title="Design notes" description="Optional. Anything else worth saying.">
        <Textarea
          id="notes"
          rows={3}
          disabled={disabled}
          placeholder="Trade-offs you considered, things you would do with more time."
          value={value.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </SectionCard>
    </div>
  );
}
