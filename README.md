<div align="center">

<h2>Deno Minilog</h2>

<p>The minimalistic logging companion for Deno projects.</p>

<p align="center">
  <a href="https://github.com/studiowebux/deno-minilog/issues">Report Bug</a>
  ·
  <a href="https://github.com/studiowebux/deno-minilog/issues">Request Feature</a>
</p>
</div>

---

## About

A minimalistic logging tool designed specifically for use with Deno,
supporting essential log levels such as `info`, `warn`, `error`, `debug`, `verbose`, `trace`.
This logger outputs to the terminal in either `text` or `json` format,
displaying messages with a prefix that includes the current local date and time.
It allows users to easily toggle the enabled log level and change the output format,
providing flexibility based on their preference or application needs.

---

## Installation and Usage

1. Install deno: https://deno.com
2. `deno add @studiowebux/deno-minilog`


```ts
const logger = new Logger(); // Logs everything by default
logger.info("This is an info log");
logger.info({ foo: "bar" });
logger.error(new Error("Oops"))
logger.warn("You should check the logs...")
logger.debug("Debug message.")
logger.verbose("Verbose message.")
logger.trace("Message with trace.")
```

```ts
const logger = new Logger({info: false});
logger.info("This info wont be showed.");
logger.error(new Error("Oops"))
logger.warn("You should check the logs...")
```

You can set the format to `json`, *usually required with observability tools.*

```ts
const jsonLogger = new Logger({ format: "json" });

// Prints
{"message":"...","level":"...","timestamp":"..."}
```

**Trace option**

This output will spread on multiple lines,
so might not be the best in production environment where each line is an entry.

see `tests/test.ts` for other examples.

**Forks**

This feature is useful to sort and isolate logs when wanting to troubleshoot part of the application.
And to let the logs there (even in production) the Logger instance can isolate and hide those forked logger instance.

`forkToPrint`: A list of the id to show, anything else is hidden.
`hideFork`: Hide all forks and show only the "normal" logs.

See `tests/flow.ts` for the examples.

```ts
const logger = new Logger({ forkToPrint: ["my_fn_logs"] });
```

**Prints:**

```bash
9/13/2024, 4:37:22 PM DEBUG [my_fn_logs]:   myFn
9/13/2024, 4:37:22 PM DEBUG [my_fn_logs]:   My Function
9/13/2024, 4:37:22 PM INFO [my_fn_logs]:   i'm doing stuff
9/13/2024, 4:37:22 PM WARN [my_fn_logs]:   Oops, stuff is now weird
9/13/2024, 4:37:22 PM VERBOSE [my_fn_logs]:   {"foo":"bar"}
9/13/2024, 4:37:22 PM DEBUG [my_fn_logs]:   I'm done.
```

---

```ts
const logger = new Logger();
```

**Prints:**

```bash
9/13/2024, 4:36:43 PM INFO:   Application is starting...
9/13/2024, 4:36:43 PM DEBUG [my_fn_logs]:   myFn
9/13/2024, 4:36:43 PM DEBUG [my_fn_logs]:   My Function
9/13/2024, 4:36:43 PM INFO [my_fn_logs]:   i'm doing stuff
9/13/2024, 4:36:43 PM WARN [my_fn_logs]:   Oops, stuff is now weird
9/13/2024, 4:36:43 PM VERBOSE [my_fn_logs]:   {"foo":"bar"}
9/13/2024, 4:36:43 PM DEBUG [my_fn_logs]:   I'm done.
9/13/2024, 4:36:43 PM DEBUG [my_second_fn]:   mySecondFn
9/13/2024, 4:36:43 PM DEBUG [my_second_fn]:   My Second Function
9/13/2024, 4:36:43 PM DEBUG [my_second_fn]:   I'm done.
9/13/2024, 4:36:43 PM INFO:   Application has ended.
```

---

```ts
const logger = new Logger({ forkToPrint: [], hideForks: true });
```

**Prints:**

```bash
9/13/2024, 4:35:07 PM INFO:   Application is starting...
9/13/2024, 4:35:07 PM INFO:   Application has ended.
```

---

### Releases and Github Actions

```bash
git tag -a X.Y.Z -m "Version X.Y.Z"
git push origin tags/X.Y.Z
```

---

## Contributing

1. Fork the project
2. Create a Feature Branch
3. Commit your changes
4. Push your changes
5. Create a PR

<details>
<summary>Working with your local branch</summary>

**Branch Checkout:**

```bash
git checkout -b <feature|fix|release|chore|hotfix>/prefix-name
```

> Your branch name must starts with [feature|fix|release|chore|hotfix] and use a / before the name;
> Use hyphens as separator;
> The prefix correspond to your Kanban tool id (e.g. abc-123)

**Keep your branch synced:**

```bash
git fetch origin
git rebase origin/master
```

**Commit your changes:**

```bash
git add .
git commit -m "<feat|ci|test|docs|build|chore|style|refactor|perf|BREAKING CHANGE>: commit message"
```

> Follow this convention commitlint for your commit message structure

**Push your changes:**

```bash
git push origin <feature|fix|release|chore|hotfix>/prefix-name
```

**Examples:**

```bash
git checkout -b release/v1.15.5
git checkout -b feature/abc-123-something-awesome
git checkout -b hotfix/abc-432-something-bad-to-fix
```

```bash
git commit -m "docs: added awesome documentation"
git commit -m "feat: added new feature"
git commit -m "test: added tests"
```

</details>

## License

Distributed under the MIT License. See LICENSE for more information.

## Contact

- Tommy Gingras @ tommy@studiowebux.com | Studio Webux

<div>
<b> | </b>
<a href="https://www.buymeacoffee.com/studiowebux" target="_blank"
      ><img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        style="height: 30px !important; width: 105px !important"
/></a>
<b> | </b>
<a href="https://webuxlab.com" target="_blank"
      ><img
        src="https://webuxlab-static.s3.ca-central-1.amazonaws.com/logoAmpoule.svg"
        alt="Webux Logo"
        style="height: 30px !important"
/> Webux Lab</a>
<b> | </b>
</div>
