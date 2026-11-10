import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(packageRoot, "..", "..", "skills", "angular-doctor");
const skillsRoot = join(packageRoot, "skills");
const destination = join(skillsRoot, "angular-doctor");

rmSync(skillsRoot, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
