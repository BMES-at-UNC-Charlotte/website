"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

export default function Home() {
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const messageFormRef = useRef<HTMLFormElement>(null);
  const utils = api.useUtils();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = message.trim();
    if (!text || isSending) return;

    setMessage("");
    messageFormRef.current?.reset();
    setIsSending(true);
    try {
      const response = await utils.post.hello.fetch({ text });
      setGreeting(response.greeting);
    } catch {
      setGreeting("Unable to reach the tRPC endpoint. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="container mx-auto max-w-4xl space-y-12">
        <header className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Charlotte BMES
          </Badge>
          <Typography variant="h1">Design system reference</Typography>
          <Typography variant="subtitle" className="max-w-2xl">
            Preview of theme tokens and UI components used across the site.
          </Typography>
        </header>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Documentation</Typography>
            <Typography className="text-muted-foreground">
              Quick links for stack setup and project docs.
            </Typography>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Components</CardTitle>
                <CardDescription>
                  Documentation and library of UI components (shadcn/ui).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href="https://ui.shadcn.com/docs/components"
                      target="_blank"
                    />
                  }
                >
                  Open component library
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Libraries, deployment, and project structure for the T3 stack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href="https://create.t3.gg/en/introduction"
                      target="_blank"
                    />
                  }
                >
                  Read docs
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-row items-end justify-between">
                <div>
                  <CardTitle>API</CardTitle>
                  <CardDescription>
                    {greeting ?? "Send a message to the tRPC hello endpoint."}
                  </CardDescription>
                </div>
                <form
                  ref={messageFormRef}
                  className="w-full max-w-sm"
                  onSubmit={handleSubmit}
                >
                  <InputGroup className="h-10">
                    <InputGroupInput
                      name="message"
                      onChange={(event) => {
                        setMessage(event.target.value);
                      }}
                      placeholder="Type something..."
                      required
                      value={message}
                    />
                    <InputGroupAddon align="inline-end" className="pr-2">
                      <InputGroupButton
                        aria-label="Send message"
                        className="size-8 rounded-full"
                        disabled={!message.trim() || isSending}
                        size="icon-sm"
                        type="submit"
                        variant="default"
                      >
                        {isSending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ArrowRight />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </form>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <Typography variant="caption">
                Above is a live response from the tRPC server.
              </Typography>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Brand tokens</Typography>
            <Typography className="text-muted-foreground">
              Primary brand colors applied to the theme.
            </Typography>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="bg-primary h-16 rounded-xl" />
              <div>
                <Typography className="text-sm font-medium">primary</Typography>
                <Typography variant="caption">#005035</Typography>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-secondary h-16 rounded-xl" />
              <div>
                <Typography className="text-sm font-medium">
                  secondary
                </Typography>
                <Typography variant="caption">#A49665</Typography>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-background h-16 rounded-xl border" />
              <div>
                <Typography className="text-sm font-medium">
                  background
                </Typography>
                <Typography variant="caption">#101820</Typography>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-chart-1 h-16 rounded-xl" />
              <div>
                <Typography className="text-sm font-medium">chart-1</Typography>
                <Typography variant="caption">#151060</Typography>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Surfaces & neutrals</Typography>
            <Typography className="text-muted-foreground">
              Navy-tinted surface steps for cards, muted fills, and borders.
            </Typography>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            <div className="space-y-2">
              <div className="bg-card h-12 rounded-xl border" />
              <Typography variant="caption">card</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-12 rounded-xl" />
              <Typography variant="caption">muted</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-accent h-12 rounded-xl" />
              <Typography variant="caption">accent</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-destructive h-12 rounded-xl" />
              <Typography variant="caption">destructive</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-border h-12 rounded-xl" />
              <Typography variant="caption">border</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-ring h-12 rounded-xl" />
              <Typography variant="caption">ring</Typography>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Chart palette</Typography>
            <Typography className="text-muted-foreground">
              chart-1 is brand indigo; chart-2 through chart-5 use the default
              palette.
            </Typography>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="bg-chart-1 h-12 rounded-xl" />
              <Typography variant="caption">chart-1</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-chart-2 h-12 rounded-xl" />
              <Typography variant="caption">chart-2</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-chart-3 h-12 rounded-xl" />
              <Typography variant="caption">chart-3</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-chart-4 h-12 rounded-xl" />
              <Typography variant="caption">chart-4</Typography>
            </div>
            <div className="space-y-2">
              <div className="bg-chart-5 h-12 rounded-xl" />
              <Typography variant="caption">chart-5</Typography>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Buttons</Typography>
            <Typography className="text-muted-foreground">
              Available variants, sizes, and states.
            </Typography>
          </div>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">XS</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="https://ui.shadcn.com" target="_blank" />}
                >
                  As link
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Badges</Typography>
            <Typography className="text-muted-foreground">
              Available badge variants.
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="ghost">Ghost</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Form controls</Typography>
            <Typography className="text-muted-foreground">
              Label, input, and validation states.
            </Typography>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Example form</CardTitle>
              <CardDescription>
                Basic field layout with an invalid state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@charlotte.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Required" aria-invalid />
                <Typography variant="caption" className="text-destructive">
                  Name is required.
                </Typography>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="button">Subscribe</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Typography variant="h2">Typography</Typography>
            <Typography className="text-muted-foreground">
              Heading, body, subtitle, and caption styles.
            </Typography>
          </div>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Typography variant="h4">Heading 4</Typography>
              <Typography variant="h5">Heading 5</Typography>
              <Typography variant="h6">Heading 6</Typography>
              <Typography>
                Body text. The quick brown fox jumps over the lazy dog. Accent
                text on dark backgrounds uses the secondary token.
              </Typography>
              <Typography variant="subtitle">
                Subtitle — larger supporting text.
              </Typography>
              <Typography variant="caption">
                Caption — smaller supporting text.
              </Typography>
              <Typography className="text-muted-foreground">
                Paragraph with muted applied via className.
              </Typography>
              <Typography className="text-secondary">
                Accent text using secondary.
              </Typography>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
