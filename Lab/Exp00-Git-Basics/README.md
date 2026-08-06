# Experiment 0 — Git Basics (Part A) and Git Hands-on (optional Part B)

Manuals:

- `Lectures/Backend Development/Lab/001 Exp 0 Part A Git Basics.md`
- `Lectures/Backend Development/Lab/002 Exp 0 Part B Optional Git Hands-on/` — `001` (need for
  version control, installation), `002` (config, authentication, usage), `003` (branch, merge,
  rebase), `004` (remote, submodule), `005` (stash), `006` (summary)

This is a lab **report**: every command the two manuals ask for was actually run, and
[`git-lab-transcript.md`](git-lab-transcript.md) holds each command followed by its real output
(stdout and stderr) in the order it ran. A command that failed shows `[exit code N]`. Where it
failed on purpose (the manual's "common errors") the fix comes straight after it.

| File | What it is |
|------|------------|
| [`git-lab-transcript.md`](git-lab-transcript.md) | The report: 308 commands with their real output, in 40 sections |
| [`run-git-lab.sh`](run-git-lab.sh) | The script that runs everything and writes the transcript |

## What is covered

| Manual section | Transcript section |
|----------------|--------------------|
| Part A: version control, Git, SCM, CVCS vs DVCS, Git vs SVN vs Mercurial, snapshots vs deltas | Theory, summarised in the next section of this README |
| Part A §1 / B-002: username and email (`--global`, per repository, `--list`) | A1, *Repository-specific identity* |
| Part A §2-3 / B-002: `ssh-keygen` ed25519 (and the RSA 4096 alternative), `ssh-agent`, `ssh-add` | A2, A3 |
| Part A §4: public key, SSH **signing** (`gpg.format ssh`, `user.signingkey`, `commit.gpgsign`) | A4. Every commit in the run is signed, and the final section shows `Good "git" signature` |
| Part A §5: `ssh -T git@github.com` | A5 |
| Part A: Case 1 (fresh start) and Case 2 (existing repository) | B, B Case 2 |
| Part A: managing remotes (`-v`, add, remove, set-url) and both common errors | B |
| Part A Exp 2: branching (`feature-branch`, commit `-am`, merge) | Experiment 2 |
| Part A Exp 3: merge conflict, resolved by hand, `git add`, `git commit` | Experiment 3 |
| Part A Exp 4 / B-005: `stash`, `list`, `show`, `show -p`, `apply`, `pop`, `drop`, `clear`, `branch`, plus the bugfix workflow | Experiment 4, Part B 005 |
| Part A Exp 5: push, change made "on GitHub", pull | Experiment 5 |
| Part A Exp 6 / B-004 / B-006: `submodule add`, clone elsewhere, `update --init --recursive`, `init` + `update`, `clone --recurse-submodules`, `update --remote`, `foreach`, removal | Experiment 6 |
| Part A Exp 7: rebase with a **conflict**, resolved, `rebase --continue` | Experiment 7 |
| B-003: the conflict-free rebase example + fast-forward, a true merge commit, every branch subcommand (`switch`, `switch -c`, `checkout -b`, `-m`, `-d`, `-D`, `-r`, `-a`, `push --delete`), the feature-login workflow | Part B 003 sections |
| B-004: `remote show`, `rename`, `update`, `set-url`, `prune`, the forked-repository/`upstream` scenario | Part B 004 |
| B-002 / B-006: `status`, `add`, `commit`, `diff`, `diff --staged`, `diff c1 c2`, `log`, `--oneline`, `--graph --all`, detached HEAD, `checkout -- file` | Part B 002/006, Part B 006 |
| Optional challenges 1-10: add/commit, stash, push/pull, **fetch vs pull**, branching, rebase, submodules, conflicts, **tagging** (annotated tag, push, list, delete locally and remotely), **undo** (`reset`, `reset --soft`, `reset --hard`, `reflog` recovery, `revert`) | Optional challenge 4, 9, 10 and the sections above |

## Theory in brief (Part A, B-001)

- **Version control** records every change to a set of files: who made it, what changed and
  when. That makes team work, history, rollback and accountability possible, and it is the
  starting point of every CI/CD pipeline.
- **Git** is a *distributed* VCS that Linus Torvalds wrote in 2005. Every clone holds the full
  history, so commits, branches, logs and diffs all work offline. Git is the *tool*; **SCM**
  (source code management) is the *discipline* the tool serves.
- **Centralised (SVN)**: a single server holds the history. You need the network for most
  operations, and the server is a single point of failure. **Distributed (Git, Mercurial)**:
  every developer has the whole repository.
- Git stores **snapshots** of the whole tree for each commit. SVN stores **deltas** between
  versions. Because of snapshots, a Git branch is just a movable pointer, so creating and
  merging branches costs almost nothing.
- **Merge vs rebase**: merge keeps the real history and adds a merge commit. Rebase replays your
  commits on top of the target branch, which gives a straight line of history but rewrites
  commit IDs. Never rebase commits that other people already have.

## How it was run (and why not in this repository)

```bash
bash run-git-lab.sh        # Git Bash; about 2 minutes; rewrites git-lab-transcript.md
```

The manual's commands run **verbatim**, but inside a throwaway sandbox,
`%TEMP%\exp00-git-lab` (`/tmp/exp00-git-lab` in Git Bash). Nothing in this repository or in the
machine's real Git setup is touched:

- **`HOME` points at the sandbox** for the whole run. As a result `git config --global …` writes
  the sandbox's `~/.gitconfig`, and `ssh-keygen … ~/.ssh/id_ed25519` creates a new throwaway key.
  The machine's real identity, its global config (including the `commit.gpgsign true` the manual
  sets) and its real SSH keys are all left as they were.
- **"GitHub" is played by bare repositories** (`~/github/demo001.git`, `devops-library.git`,
  and so on). A second clone, `~/github-web`, commits and pushes to stand in for "make a change
  directly on GitHub". Every push, pull, fetch, prune, tag push and remote branch delete really
  goes through a remote. The manual's real `git@github.com:…` URL is used first, so the remote
  errors are real ones; then `git remote set-url` switches to the bare repository, which is
  itself one of the manual's steps.

### Deviations from the manual, and why

| Manual | What was run | Why |
|--------|--------------|-----|
| `ssh-keygen …` then "press Enter" twice | `ssh-keygen … -f ~/.ssh/id_ed25519 -N ""` | The same default path and an empty passphrase, without an interactive prompt |
| `git commit` (merge) and `git rebase --continue` open an editor | `GIT_EDITOR=true` | Accepts Git's default message (`Merge branch 'conflict-branch'`) without opening an editor |
| "Resolve the conflict by manually editing the file" | `printf … > README.md` | Writes the resolved file. The transcript shows the conflict markers just before |
| `git submodule add <url>` with a local path | `git -c protocol.file.allow=always submodule add …` | Since Git 2.38.1 (CVE-2022-39253), local-path submodules are refused by default. The transcript shows the real `fatal: transport 'file' not allowed` first. With a GitHub URL this never comes up |
| Removing a submodule: `--remove-section` then `git rm --cached` | `git add .gitmodules` in between | Current Git refuses `rm --cached` while `.gitmodules` has an unstaged edit (`fatal: please stage your changes to .gitmodules`), shown in the transcript |
| `ssh -T git@github.com` → "Hi username!" | Ran it; the answer was `Permission denied (publickey)` | Neither the sandbox key nor this machine's existing key is registered on the GitHub account. This machine pushes over **HTTPS with a token in a credential helper** (Part B 002, method 1), which the transcript shows working (`gh auth status`, `git ls-remote`). Adding a key means going to GitHub → Settings → SSH and GPG keys, once as an authentication key and once as a signing key |

The `LF will be replaced by CRLF` warnings in the transcript are real Git for Windows behaviour
(`core.autocrlf=true` in the system config, shown in A1). They are not errors.

## Checks run

- `bash run-git-lab.sh` finished. The transcript has **308 commands**. Eleven of them exit
  non-zero, and each of those is an intended demonstration followed by its fix:

  | Exit | Command | Why it is expected |
  |------|---------|--------------------|
  | 255 | `ssh -T git@github.com` (×2) | Key not registered on GitHub (see deviations) |
  | 3 | `git remote add origin …` (second time) | The manual's *"remote origin already exists"* |
  | 128 | `git push -u origin main` to `git@github.com` | The manual's *"permission denied (SSH)"* |
  | 1 | `git merge conflict-branch` | Experiment 3's conflict, resolved next |
  | 128 | `git submodule add <local path>` | `protocol.file.allow` hardening, fixed next |
  | 128 | `git rm --cached devops-library` | Unstaged `.gitmodules`, fixed next |
  | 1 | `git rebase main` | Experiment 7's conflict, resolved next |
  | 1 | `git branch -d feature-2-renamed` | Unmerged branch; `-D` is then used |
  | 2 | `ls mistake.txt` (×2) | Proves the file is gone after `reset --hard` and after `revert` |

- Signing works end to end:
  `Good "git" signature for suryansh.mishra.sm6@gmail.com with ED25519 key SHA256:…`
  (`git verify-commit HEAD` in section B and `git log --show-signature` in *Final state*).
- Final state: `nothing to commit, working tree clean`, `Your branch is up to date with
  'origin/main'`, the submodule is at the library's v2 commit, and the graph shows both merge
  commits plus the straight line left by the two rebases.
- `ssh-agent -k` at the end kills the agent the run started. The sandbox was deleted after the
  run; run the script again to recreate it.
