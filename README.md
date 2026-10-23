# Graphy security lab repair

This is a working copy of the Apache-2.0 IBM Developer Skills Network
[graphy_server](https://github.com/ibm-developer-skills-network/graphy_server)
at commit `2b1f42a45c6d27741635aae6a489595fcf2a5445`.
The upstream LICENSE is retained.

The original server cannot parse because an instructional sentence is executable
JavaScript. Its session/CSRF example also refers to undeclared middleware and a
session store. This repair keeps the public, read-only city query API and removes
that nonfunctional scaffold. It preserves optional arguments: `cities` without a
state returns all cities, and `city` without a name returns null. It does not
introduce accounts or sessions. JSON-only browser POSTs, an Origin check, a
request-size limit, disabled GraphiQL, and response security headers reduce the
exposed surface. These changes are not a claim of a complete security audit.

## Reproducible container

The Dockerfile pins the official Linux/amd64 Node 24.22.1 Alpine image to
`sha256:1200d815de24f8dcca745fbf7651d166034a35adbcad8860a8538ffff44f1420`.
It installs locked application dependencies in a separate builder stage, omits
the unused global npm/Yarn toolchain from the runtime, and runs as `node`.

Build with `docker build --pull -t graphy-security-repair .`.
For local checks, run `npm ci --ignore-scripts --no-audit --no-fund`, then
`node verify.cjs`. All 12 functional/security checks passed locally and again
inside the final image on 2026-10-23, including the original optional-argument
contract, real data queries, JSON/Origin guards, request limits, and disabled
mutations/GraphiQL. The test container used no external network, ran as `node`,
and exited 0 without an OOM event.

## Actual scan results, 2026-10-23

Snyk CLI 1.1308.3 scanned the final built image archive, not just its base tag.
The command exited 0. Its system/binary scope reported 19 dependencies and zero
known vulnerabilities. Its separate application scope detected
`/app/node_modules`, reported 74 npm dependencies, and also found zero known
vulnerabilities. Runtime versions were Node 24.22.1, Alpine 3.24.3 and OpenSSL
3.5.9. These are dated scan results, not a guarantee against all vulnerabilities.

Final built image ID:
`sha256:08adbb039b85f485a626aef271775d3e3fab404e24b9e549005231e253a3720a`.

Docker archive SHA256:
`9cb4b7efb1bd65292f2c8ee3a21d00243edecfb7cbc9de52d4ccb1cf08dceaca`.

The lab Docker host could not resolve registry.npmjs.org during its builder
step. The verified image was therefore built with an explicit offline build
variant: the same package lock and integrity-checked public npm cache in the
builder, and the same runtime instructions and application files. The official
pinned base was transferred as an archive with a verified SHA256 because the
lab registry proxy lacked that version. No credentials were transferred, and no
DNS, network or security settings were changed. The ordinary online Dockerfile
in this repository uses the same official base digest and dependency lock.

## Scan history and limits

- The original `node:hydrogen-buster` image had four unique critical OS
  advisories (21 high, 13 medium, 372 low); it was not clean.
- A direct scan of the then-current `node:24-alpine` registry base had no OS
  findings, but its bundled npm toolchain still had known vulnerabilities. That
  base-only result was not treated as a clean application-image result.
- The lab host's floating `node:24-alpine` tag resolved to an older Node 24.11.1 /
  Alpine 3.23 image. Its first repaired build still had 92 unique findings:
  4 critical, 23 high, 21 medium and 44 low. This led to the explicit official
  version/digest above. The 74 application dependencies had no findings there.
- Snyk Code was unavailable for the current organization. No successful SAST
  result is claimed. Dependency/image scans and the 12 tests do not replace it.
- Upstream has no lockfile. The included lock is a current semver resolution;
  no historical dependency count or historical vulnerability result is claimed.

Original source, complete scan JSON, build logs, integrity proofs and runtime
checks are retained privately. Full reports, account metadata and credentials
are not published in this repository.