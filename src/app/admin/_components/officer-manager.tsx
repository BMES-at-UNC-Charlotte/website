"use client";

import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { AdminRole } from "../../../../generated/prisma";

const adminRoleItems = [
  { label: "Officer", value: AdminRole.OFFICER },
  { label: "Admin", value: AdminRole.ADMIN },
];

export function OfficerManager() {
  const { data: session } = authClient.useSession();
  const currentAdminUser = session?.user.adminUser;
  const canManage = currentAdminUser?.role === AdminRole.ADMIN;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized officers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuthorizedOfficerList
          canManage={canManage}
          currentAdminUserId={currentAdminUser?.id}
        />
        <AddOfficerForm canManage={canManage} />
      </CardContent>
    </Card>
  );
}

function AuthorizedOfficerList({
  canManage,
  currentAdminUserId,
}: {
  canManage: boolean;
  currentAdminUserId?: string;
}) {
  const officers = api.officer.list.useQuery();
  const utils = api.useUtils();
  const updateRole = api.officer.updateRole.useMutation({
    onSuccess: async () => {
      await utils.officer.list.invalidate();
    },
  });
  const removeOfficer = api.officer.remove.useMutation({
    onSuccess: async () => {
      await utils.officer.list.invalidate();
    },
  });

  if (officers.isLoading) {
    return (
      <Item>
        <Spinner />
        <ItemContent>
          <ItemTitle>Loading officers…</ItemTitle>
        </ItemContent>
      </Item>
    );
  }

  if (officers.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Unable to load officers.</AlertDescription>
      </Alert>
    );
  }

  return (
    <ItemGroup>
      {officers.data?.map((officer) => (
        <Item key={officer.id} variant="muted">
          <ItemContent>
            <ItemTitle>{officer.email}</ItemTitle>
            <ItemDescription>
              Added{" "}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(officer.createdAt)}
              {officer.addedBy && ` by ${officer.addedBy.name}`}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            {canManage ? (
              <>
                <Select
                  disabled={
                    officer.id === currentAdminUserId ||
                    updateRole.isPending ||
                    removeOfficer.isPending
                  }
                  items={adminRoleItems}
                  onValueChange={(role) => {
                    if (role) {
                      updateRole.mutate({
                        id: officer.id,
                        role,
                      });
                    }
                  }}
                  value={officer.role}
                >
                  <SelectTrigger
                    aria-label={`Role for ${officer.email}`}
                    size="sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={AdminRole.OFFICER}>Officer</SelectItem>
                      <SelectItem value={AdminRole.ADMIN}>Admin</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  aria-label={`Remove ${officer.email}`}
                  disabled={
                    officer.id === currentAdminUserId ||
                    updateRole.isPending ||
                    removeOfficer.isPending
                  }
                  onClick={() => removeOfficer.mutate({ id: officer.id })}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                </Button>
              </>
            ) : (
              <span className="capitalize">{officer.role.toLowerCase()}</span>
            )}
          </ItemActions>
        </Item>
      ))}
      {updateRole.error || removeOfficer.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to update this user. Please try again.
          </AlertDescription>
        </Alert>
      ) : null}
    </ItemGroup>
  );
}

function AddOfficerForm({ canManage }: { canManage: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>(AdminRole.OFFICER);
  const [message, setMessage] = useState<string>();
  const utils = api.useUtils();
  const addOfficer = api.officer.add.useMutation({
    onSuccess: async (officer) => {
      setEmail("");
      setRole(AdminRole.OFFICER);
      setMessage(`${officer.email} added as ${officer.role.toLowerCase()}.`);
      await utils.officer.list.invalidate();
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    await addOfficer
      .mutateAsync({ email, role: canManage ? role : undefined })
      .catch(() => undefined);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field data-invalid={Boolean(addOfficer.error)}>
        <FieldLabel htmlFor="officer-email">
          <Typography
            as="span"
            variant="h6"
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add an officer
          </Typography>
        </FieldLabel>

        <InputGroup>
          <InputGroupInput
            aria-describedby={
              addOfficer.error ? "officer-email-error" : undefined
            }
            aria-invalid={Boolean(addOfficer.error)}
            autoComplete="email"
            disabled={addOfficer.isPending}
            id="officer-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="officer@example.com"
            required
            type="email"
            value={email}
          />
          <InputGroupAddon align="inline-end" className="pr-2">
            {canManage ? (
              <Select
                disabled={addOfficer.isPending}
                items={adminRoleItems}
                onValueChange={(role) => {
                  if (role) setRole(role);
                }}
                value={role}
              >
                <SelectTrigger aria-label="New user role" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectItem value={AdminRole.OFFICER}>Officer</SelectItem>
                    <SelectItem value={AdminRole.ADMIN}>Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}
            <InputGroupButton
              aria-label="Add officer"
              className="size-7 rounded-full"
              disabled={addOfficer.isPending || !email.trim()}
              size="icon-sm"
              type="submit"
              variant="default"
            >
              {addOfficer.isPending ? <Spinner /> : <Plus />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldError id="officer-email-error">
          {addOfficer.error
            ? (addOfficer.error.data?.zodError?.fieldErrors.email?.[0] ??
              "Unable to add this officer. Please try again.")
            : null}
        </FieldError>
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </Field>
    </form>
  );
}
