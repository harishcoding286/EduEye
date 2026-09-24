#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.resolve(ROOT_DIR, 'skills');

const BANNER = [
  " ██╗   ██╗██╗      ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗",
  " ██║   ██║██║      ██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝",
  " ██║   ██║██║█████╗███████╗█████╔╝ ██║██║     ██║     ███████╗",
  " ██║   ██║██║╚════╝╚════██║██╔═██╗ ██║██║     ██║     ╚════██║",
  " ╚██████╔╝██║      ███████║██║  ██╗██║███████╗███████╗███████║",
  "  ╚═════╝ ╚═╝      ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝",
].join("\n");

const HELP = [
  BANNER,
  "",
  "Skills for Design Engineers (Installed in EduEye /skills)",
  "",
  "Usage:",
  "  ui-skills [command]",
  "",
  "Commands:",
  "  start                     Print the routing skill (ui-skills-root)",
  "  categories                List categories",
  "  list [--category <topic>] List skills",
  "  get <slug>                Print full skill markdown",
  "",
  "Available Skills:",
  "  • baseline-ui             Quickly deslop UI code by fixing spacing, hierarchy, typography",
  "  • create-design-md        Framework for crafting comprehensive DESIGN.md design system",
  "  • fixing-accessibility    Auditing and fixing accessibility issues (ARIA, WCAG)",
  "  • fixing-metadata         Open Graph, meta tags, and structured metadata",
  "  • fixing-motion-performance Smooth 60fps animations, GPU offloading, avoiding layout thrashing",
  "  • improve-ui              Comprehensive design audit & polish for layout and depth",
  "  • ui-skills-root          The router and overarching instruction layer",
  "",
  "Examples:",
  "  npx ui-skills start",
  "  npx ui-skills list",
  "  npx ui-skills get baseline-ui",
].join("\n");

const argv = process.argv.slice(2);
const command = argv[0] || "";

function getSkillMetadata(skillName) {
  const skillFile = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;
  const content = fs.readFileSync(skillFile, 'utf-8');
  const descMatch = content.match(/description:\s*(.+)/);
  const desc = descMatch ? descMatch[1].replace(/["']/g, '').trim() : "Design engineering skill";
  return { name: skillName, description: desc, file: skillFile };
}

function getAllSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter(name => fs.statSync(path.join(SKILLS_DIR, name)).isDirectory())
    .map(getSkillMetadata)
    .filter(Boolean);
}

if (!command || command === "--help" || command === "-h" || command === "help") {
  console.log(HELP);
  process.exit(0);
}

if (command === "start") {
  const rootSkill = path.join(SKILLS_DIR, "ui-skills-root", "SKILL.md");
  if (fs.existsSync(rootSkill)) {
    process.stdout.write(fs.readFileSync(rootSkill, "utf-8"));
  } else {
    console.error("ui-skills-root not found.");
    process.exit(1);
  }
  process.exit(0);
}

if (command === "categories") {
  console.log(["ui", "accessibility", "motion", "metadata", "design-system"].join("\n"));
  process.exit(0);
}

if (command === "list") {
  const skills = getAllSkills();
  for (const skill of skills) {
    console.log(`${skill.name} — ${skill.description}`);
  }
  process.exit(0);
}

if (command === "get") {
  const target = argv[1];
  if (!target) {
    console.error("Error: Missing skill slug. Example: npx ui-skills get baseline-ui");
    process.exit(1);
  }
  const skillPath = path.join(SKILLS_DIR, target, "SKILL.md");
  if (fs.existsSync(skillPath)) {
    process.stdout.write(fs.readFileSync(skillPath, "utf-8"));
    process.exit(0);
  } else {
    console.error(`Error: Skill '${target}' not found in ${SKILLS_DIR}`);
    process.exit(1);
  }
}

console.error(`Unknown command: ${command}\n\nRun 'npx ui-skills --help' for available commands.`);
process.exit(1);
