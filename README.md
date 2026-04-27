# NexusFlow App

A multi-page project & team management dashboard with built-in error reporting to an AI-powered triaging system.

## What It Does

When an error occurs anywhere in the app, the `errorReporter.js` utility automatically collects error details and sends them as a structured JSON payload to a webhook. The payload includes the GitHub repository owner and name, so the AI agent on the other end can fetch the actual source code, analyze the bug, identify the root cause, and generate a resolution.

## Project Structure

```
├── index.html              # Dashboard — project search with live filter
├── projects.html            # Project management — create new projects
├── team.html                # Team management — assign roles to members
├── invoices.html            # Invoicing — generate invoices for clients
├── settings.html            # App settings — configure custom widgets
├── css/
│   └── styles.css           # Shared stylesheet
├── js/
│   ├── errorReporter.js     # Error reporting utility (config + logic)
│   ├── utils.js             # Shared utility functions
│   └── auth.js              # Auth & permission simulation
└── README.md
```

## Quick Start

1. Clone the repo
2. Open `index.html` in a browser (or deploy to Vercel)
3. Navigate to any page and trigger the action described on that page
4. Check the **Live Error Console** panel to see the JSON payload sent to the webhook

## Pages & Actions

| Page | Action | What Happens |
|------|--------|--------------|
| **Dashboard** (`index.html`) | Type `[` in the search bar and click Search | Triggers a regex SyntaxError |
| **Projects** (`projects.html`) | Fill in fields and click "Create Project" | Triggers a null reference TypeError |
| **Team** (`team.html`) | Select a member + role, click "Assign Role" | Triggers a null reference TypeError |
| **Invoices** (`invoices.html`) | Fill in fields and click "Generate Invoice" | Triggers a type error on string |
| **Settings** (`settings.html`) | Type `hello` in the config box and click "Apply" | Triggers a SyntaxError via eval() |

## How errorReporter.js Works

Edit the CONFIG section in `js/errorReporter.js` to point to your webhook and repository:

```js
var CONFIG = {
  webhookUrl:  "https://your-n8n-instance.com/webhook/your-endpoint",
  appName:     "NexusFlow",
  environment: "production",
  repoOwner:   "your-github-username",
  repoName:    "your-repo-name"
};
```

Then use `ErrorReporter.report()` in any catch block:

```js
try {
  doSomething();
} catch (e) {
  ErrorReporter.report({
    error: e,
    source_file: "myFile.js",
    priority: "critical",
    title: "Short description of what failed",
    context: { module: "ModuleName", action: "functionName" }
  });
}
```

## Built For

This project is part of a demo showcasing an **Autonomous Issue Triaging and Resolution** pipeline:

**Error occurs** → **Webhook catches it** → **AI Agent fetches source code from GitHub** → **Root cause analysis** → **GitHub issue created** → **Fix branch + PR opened** → **Team notification sent**

## Deployment

Deploy on [Vercel](https://vercel.com) — any push to `main` triggers automatic redeployment. No build step required.

## License

MIT
