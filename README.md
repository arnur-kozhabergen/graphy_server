# Graphy security lab repair

This is a working copy of the Apache-2.0 IBM Developer Skills Network
[graphy_server](https://github.com/ibm-developer-skills-network/graphy_server)
at commit `2b1f42a45c6d27741635aae6a489595fcf2a5445`.
The upstream LICENSE is retained.

The original server cannot parse because an instructional sentence is executable
JavaScript. Its session/CSRF example also refers to undeclared middleware and a
session store. This repair keeps the actual public, read-only city query API and
removes that nonfunctional scaffold. It does not introduce accounts or sessions.
JSON-only browser POSTs, an Origin check, a request-size limit, disabled GraphiQL,
and response security headers reduce the exposed surface.

The container candidate replaces the unsupported Debian 10 / Node 18 base with
`node:24-alpine`, installs application dependencies in a builder stage, omits the
unused global npm/Yarn toolchain from the runtime, and runs as the `node` user.

## Checks

Run `npm ci --ignore-scripts --no-audit --no-fund`, then `node verify.cjs`.
All 12 functional/security checks passed locally on 2026-10-23, including the
upstream optional-argument behavior (all cities without a state; null city
without a name).

Actual Snyk scans on that date found four unique critical OS advisories in the
original `node:hydrogen-buster` image. The current application dependency lock
had 74 dependencies and no known open-source dependency vulnerabilities.
The candidate base had no OS findings, but its bundled npm toolchain still had
vulnerabilities. The Dockerfile removes that unused toolchain at runtime.

**The repaired image is not verified clean.** Docker Engine returned HTTP 500
from its local `_ping` endpoint, so the image could not be built or rescanned.
Snyk Code was unavailable for the current organization; no successful SAST
result is claimed. The original source and complete private scan reports are
retained outside this working copy. No historical or future security guarantee
is implied by the current scan results.
