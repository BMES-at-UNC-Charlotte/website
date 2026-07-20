# UI conventions

## Tailwind classes

Minimize use of tailwind classes. Prefer existing components and their built-in APIs (`variant`, `size`, `as`, etc.). The whole point of them existing is that we have a bunch of good defaults, not randomly styled elements on each page based on how the vibes are that day

```tsx
// Prefer
<Typography variant="h1">Career Fair</Typography>
<Button variant="outline">Register</Button>

// Avoid
<h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Career Fair</h1>
<Typography className="font-heading text-4xl text-muted-foreground">Career Fair</Typography>
<Button className="rounded-full border px-4">Register</Button>
```

Use tailwind classes primarly for layout or true one-offs. If components geniunely need to be constantly styled with a bunch of parameters, this should be considered as a new component with these styles, or modifying the existing ones. However unless it is unavoidable shadcn/ui components should ideally not be modified.

## Components

If a page is being coded that needs a new component, you should first check if shadcn has a component for this and/or if it's already installed. Prefer installing shadcn components over rolling your own.
