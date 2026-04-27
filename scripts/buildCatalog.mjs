// Builds scripts/exercises_catalog.json from scripts/routine_exercises.json.
// Run: `node scripts/buildCatalog.mjs`. Then `node scripts/buildSeed.mjs` to regenerate supabase/seed.sql.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arr = JSON.parse(fs.readFileSync(path.join(here, 'routine_exercises.json'), 'utf8'));

// --- Canonical-name remaps ---
// Side-split pairs and superset-prefix variants that should merge.
const REMAP = {
  // Side splits
  '90/90 stretch — right lead': { canon: '90/90 stretch', side: 'Right lead' },
  '90/90 stretch — left lead': { canon: '90/90 stretch', side: 'Left lead' },
  '90/90 active lift-offs — right': { canon: '90/90 active lift-offs', side: 'Right' },
  '90/90 active lift-offs — left': { canon: '90/90 active lift-offs', side: 'Left' },
  'Half pigeon with forward fold (right)': { canon: 'Half pigeon with forward fold', side: 'Right' },
  'Half pigeon with forward fold (left)': { canon: 'Half pigeon with forward fold', side: 'Left' },
  'Pigeon pose right': { canon: 'Pigeon pose', side: 'Right' },
  'Pigeon pose left': { canon: 'Pigeon pose', side: 'Left' },
  '90/90 right — passive then 5 lift-offs': { canon: '90/90 passive + lift-offs', side: 'Right' },
  '90/90 left — passive then 5 lift-offs': { canon: '90/90 passive + lift-offs', side: 'Left' },
  'Pigeon left (with fold)': { canon: 'Pigeon pose with fold', side: 'Left' },
  'Pigeon right (with fold)': { canon: 'Pigeon pose with fold', side: 'Right' },
  'Pigeon pose right (active — lift back knee 5x, then relax)': { canon: 'Pigeon pose (active lift-offs)', side: 'Right' },
  'Pigeon pose left (active — lift back knee 5x, then relax)': { canon: 'Pigeon pose (active lift-offs)', side: 'Left' },
  // Superset prefix removal (yael-upper-superset-volume) — same canonical movements as elsewhere in catalog
  'A1: Lat pulldown': { canon: 'Lat pulldown' },
  'A2: DB shoulder press': { canon: 'DB shoulder press' },
  'B1: Seated cable row': { canon: 'Seated cable row' },
  'B2: Incline DB press': { canon: 'Incline DB press' },
  'C1: Face pull': { canon: 'Face pull' },
  'C2: DB lateral raise': { canon: 'DB lateral raise' },
  'D1: DB bicep curl': { canon: 'DB bicep curl' },
  'D2: Triceps pushdown': { canon: 'Triceps pushdown' },
};

const SIDE_FROM = name => REMAP[name]?.side ?? null;
const canonOf = name => REMAP[name]?.canon ?? name;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[—–]/g, '-')
    .replace(/&/g, 'and')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function classifyCategory(name) {
  const n = name.toLowerCase();
  // KB
  if (/\bkb\b|kettlebell|halo|halos|turkish get-up|two-hand kb|2-hand swing|kb swing|swings? emom|kb deadlift|kb halo|kb row|kb press|kb push-press|kb military|kb front squat|goblet squat|kb walking lunge|kb suitcase carry|kb overhead carry|kb front-rack|kb windmill|single-arm kb|double kb|arm bars|emom min/.test(n)) return 'kb';
  // Gym (barbell / DB / cable / machine / specific gym lifts)
  if (/(^|\W)(bb|barbell|smith)\b|deadlift|sumo deadlift|hip thrust|romanian deadlift|\brdl\b|bench press|overhead press|push press|power clean|lat pulldown|cable|machine|seated cable row|barbell row|bent-over.*row|hammer curl|face pull|reverse pec-deck|pec.deck|tricep.*pushdown|triceps pushdown|triceps rope|triceps rope pushdown|front raise|rear delt fly|reverse pec|seated db|incline db|db bench|db row|db reverse lunge|db walking lunge|single-leg rdl|leg press|preacher curl|skullcrusher|sled push|rower 250m|farmer carry|hip abductor machine|lying hamstring curl|cable pull-through|cable woodchopper|cable hip abduction|cable rope|cable bicep|cable chest fly|cable glute kickback|standing cable kickback|standing overhead press/.test(n)) return 'gym';
  if (/back squat|front squat/.test(n)) return 'gym';
  if (/\bdb\b|dumbbell/.test(n)) return 'gym';
  if (/glute bridge|barbell glute bridge|smith machine|step-up \(db\)|high step-up \(db\)|bulgarian split squat \(db\)|monster walk|clamshell|banded clamshell/.test(n)) return 'gym';
  // Body weight
  if (/\bplank\b|^side plank$|push-?up|pull-?up|burpee|box jump|mountain climber|hollow hold|hanging knee raise|hanging leg raise|inverted row|bodyweight reverse lunge|push-up variations|inchworm|frog pump|russian twist \(plate\)|kb russian twist|jump rope|jump squat|shadow kicks|knee drive|a-skips|leg swings/.test(n)) return 'body_weight';
  // Stretch & mobility (default)
  return 'stretch_mobility';
}

function bodyParts(name) {
  const n = name.toLowerCase();
  const p = new Set();
  const add = (...xs) => xs.forEach(x => p.add(x));

  // === Specific lifts (highest priority) ===
  if (/back squat|front squat|smith machine sumo squat|bulgarian split squat|walking lunge|db walking lunge|db reverse lunge|bodyweight reverse lunge|high step-up|goblet squat|kb walking lunge|jump squat|box jump|deep squat hold/.test(n)) add('quads','glutes','hamstrings','core');
  if (/\bdeadlift\b|sumo deadlift|romanian deadlift|\brdl\b|single-leg rdl/.test(n)) add('glutes','hamstrings','lower_back','core','forearms');
  if (/cable pull-through/.test(n)) add('glutes','hamstrings','lower_back');
  if (/lying hamstring curl/.test(n)) add('hamstrings');
  if (/hip thrust|barbell hip thrust|barbell glute bridge|glute bridge/.test(n)) add('glutes','hamstrings','hips');
  if (/cable glute kickback|standing cable kickback|frog pump/.test(n)) add('glutes','hips');
  if (/hip abductor machine|cable hip abduction/.test(n)) add('glutes','hips');
  if (/monster walk|banded clamshell|clamshell|glute activation/.test(n)) add('glutes','hips');
  if (/bench press|db bench press|incline db press|cable chest fly|push-?up/.test(n)) add('chest','shoulders','triceps');
  if (/overhead press|standing overhead press|push press|military press|kb push-press|push-press|seated db shoulder press|db shoulder press|single-arm kb press/.test(n)) add('shoulders','triceps','core');
  if (/lat pulldown|pull-?up|inverted row/.test(n)) add('lats','mid_back','biceps','forearms');
  if (/seated cable row|barbell row|bent-over.*row|cable row|db row|kb row|single-arm kb row|single-arm db row|double kb bent-over row/.test(n)) add('mid_back','rear_delts','biceps','forearms');
  if (/face pull|reverse pec-deck|reverse pec|rear delt fly|band pull-?aparts/.test(n)) add('rear_delts','mid_back');
  if (/lateral raise|front raise/.test(n)) add('shoulders');
  if (/triceps|tricep|skullcrusher|overhead triceps|push-?down|pushdown/.test(n)) add('triceps');
  if (/bicep curl|hammer curl|cable bicep|preacher curl|db bicep/.test(n)) add('biceps','forearms');
  if (/cable woodchopper|russian twist|woodchopper/.test(n)) add('core','obliques');
  if (/hanging.*raise|hollow hold/.test(n)) add('core','forearms');
  if (/^plank|^side plank|^push-up$|^push-up variations/.test(n)) add('core');
  if (/side plank/.test(n)) add('obliques');
  if (/mountain climber|inchworm|burpee/.test(n)) add('core','full_body');
  if (/dead bug|bird dog/.test(n)) add('core','lower_back');
  // KB specific
  if (/kb swing|2-hand swing|two-hand kb swing|single-arm kb swing|warmup: 2-hand swing/.test(n)) add('glutes','hamstrings','lower_back','hips','core','forearms');
  if (/kb halo|halos/.test(n)) add('shoulders','t_spine','core');
  if (/kb deadlift/.test(n)) add('glutes','hamstrings','lower_back','forearms');
  if (/turkish get-up/.test(n)) add('full_body','shoulders','core');
  if (/kb suitcase carry|farmer carry/.test(n)) add('forearms','core','glutes');
  if (/kb overhead carry/.test(n)) add('shoulders','core','forearms');
  if (/kb front-rack carry/.test(n)) add('core','forearms','shoulders');
  if (/kb windmill/.test(n)) add('shoulders','obliques','hips');
  if (/clean.*press|power clean|kb clean/.test(n)) add('full_body','shoulders','core');
  // Stretch / mobility specifics
  if (/90.90|shin box|external rotation|internal rotation|lift-off/.test(n)) add('hip_rotators','hips');
  if (/pigeon/.test(n)) add('hip_rotators','hips','glutes');
  if (/cossack/.test(n)) add('adductors','hips','glutes','quads');
  if (/figure-4/.test(n)) add('hip_rotators','glutes');
  if (/frog pose|frog rocks|deep butterfly|butterfly|seated straddle|wide squat hold|wide straddle|side lunge stretch/.test(n)) add('adductors','hips');
  if (/forward fold|seated single-leg forward fold|standing forward fold|standing hamstring stretch|supine.*hamstring|hamstring/.test(n)) add('hamstrings','lower_back');
  if (/couch stretch|hip flexor|kneeling.*flexor|side-lying quad|standing quad|cobra|upward dog/.test(n)) add('quads','hip_flexors');
  if (/calf|calves|soleus|gastroc/.test(n)) add('calves','ankles');
  if (/ankle|dorsiflex|heel drop|deep squat hold \+ ankle/.test(n)) add('ankles','calves');
  if (/toe spread|tops of feet|seated shin stretch/.test(n)) add('feet','ankles');
  if (/cat-cow|thread the needle|quadruped.*rotation|foam roller t-spine|thoracic|t-spine|prayer stretch|puppy pose|wall angels|behind-back towel/.test(n)) add('t_spine','shoulders');
  if (/doorway pec|cross-body shoulder/.test(n)) add('chest','shoulders');
  if (/lat stretch|child.s pose with arms extended/.test(n)) add('lats');
  if (/shoulder cars|shoulder car|arm circles/.test(n)) add('shoulders');
  if (/forearm/.test(n)) add('forearms');
  if (/wrist/.test(n)) add('forearms');
  if (/neck|chin tuck|levator scap|upper trap/.test(n)) add('neck');
  if (/supine twist|supine internal rotation|child.s pose|legs-up-the-wall|happy baby/.test(n)) add('lower_back','hips');
  if (/happy baby/.test(n)) add('adductors');
  if (/standing leg swings|leg swings|hip cars|hip circles|hip car\b|standing hip car/.test(n)) add('hips','hip_rotators');
  if (/world.s greatest|lunge with rotation/.test(n)) add('hips','t_spine','full_body');
  if (/standing side bends/.test(n)) add('obliques','lower_back');
  if (/down dog.*plank.*up dog|down dog → plank → up dog|inchworm to plank/.test(n)) add('full_body');
  if (/jump rope|a-skips|knee drive|jump rope.*jog/.test(n)) add('calves','full_body');
  if (/shadow kicks/.test(n)) add('hips','core','full_body');
  if (/kneeling with shins rotated out/.test(n)) add('hip_rotators','quads');
  if (/wide squat hold/.test(n)) add('adductors','hips','glutes');
  if (/deep squat \+ reach up|deep squat hold \+ pulse|deep squat with knees pressed out/.test(n)) add('hips','ankles','adductors');
  if (/windshield wipers/.test(n)) add('core','obliques','hip_rotators');
  if (/hip cars\b|hip car\b/.test(n)) add('hips','hip_rotators');
  if (/sled push|rower 250m/.test(n)) add('full_body','quads','glutes');
  if (/^cooldown$|cooldown walk|cooldown:|cooldown |^cooldown/.test(n)) add('full_body');
  if (/warmup:/.test(n) && p.size === 0) add('full_body');
  if (/^15-min amrap/.test(n) || /round structure/.test(n)) add('full_body');

  if (p.size === 0) p.add('full_body');
  return [...p].sort();
}

function modal(values) {
  const counts = new Map();
  for (const v of values) {
    const k = JSON.stringify(v);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = null, bestCount = -1;
  for (const [k, c] of counts) if (c > bestCount) { bestCount = c; best = JSON.parse(k); }
  return best;
}

const firstSeen = {};
for (const r of arr) if (!firstSeen[r.name]) firstSeen[r.name] = r.routine_id;

const byCanon = {};
for (const r of arr) {
  const canon = canonOf(r.name);
  if (!byCanon[canon]) byCanon[canon] = [];
  byCanon[canon].push(r);
}

const catalog = [];
for (const [canon, rows] of Object.entries(byCanon)) {
  const types = rows.map(r => r.type);
  const type = modal(types);
  const durs = rows.filter(r => r.type === 'time').map(r => r.duration_sec);
  const reps = rows.filter(r => r.type === 'reps').map(r => r.reps);
  const isSideMerged = rows.some(r => SIDE_FROM(r.name));
  const segs = isSideMerged ? null : modal(rows.map(r => r.segments));
  catalog.push({
    id: slugify(canon),
    name: canon,
    category: classifyCategory(canon),
    body_parts: bodyParts(canon),
    type,
    default_duration_sec: type === 'time' ? modal(durs) : null,
    default_reps: type === 'reps' ? modal(reps) : null,
    default_segments: segs ?? null,
  });
}

catalog.sort((a, b) => a.id.localeCompare(b.id));

// Slug uniqueness
const slugs = new Map();
for (const e of catalog) slugs.set(e.id, (slugs.get(e.id) || 0) + 1);
const dupes = [...slugs].filter(([_, c]) => c > 1);
if (dupes.length) { console.error('SLUG COLLISIONS:', dupes); process.exit(1); }

fs.writeFileSync(path.join(here, 'exercises_catalog.json'), JSON.stringify(catalog, null, 2));
console.log('Total canonical exercises:', catalog.length);
const byCat = {};
for (const e of catalog) byCat[e.category] = (byCat[e.category] || 0) + 1;
console.log('Category counts:', byCat);

// Spot-check a few key exercises
const checks = ['back-squat', 'deadlift', 'bench-press', 'pull-up', 'plank', 'kb-swing', 'turkish-get-up', 'goblet-squat', 'pigeon-pose', '90-90-stretch', 'cossack-squats', 'frog-pose-light-60', 'lat-pulldown', 'romanian-deadlift', 'sumo-deadlift', 'hip-thrust-moderate', 'barbell-hip-thrust', 'face-pull', 'db-lateral-raise', 'farmer-carry', 'hanging-leg-raise', 'hollow-hold', 'world-s-greatest-stretch', 'cooldown', 'warmup-bike-or-row'];
console.log('\nSpot checks:');
for (const id of checks) {
  const e = catalog.find(x => x.id === id);
  if (!e) { console.log('  '+id+' NOT FOUND'); continue; }
  console.log(`  ${id}\t[${e.category}]\t${e.body_parts.join(',')}\ttype=${e.type}\tdef=(reps=${e.default_reps}, dur=${e.default_duration_sec})`);
}

// Also list all `full_body`-only exercises so we can verify those are intentional
console.log('\nfull_body-only exercises (sanity-check):');
for (const e of catalog) if (e.body_parts.length === 1 && e.body_parts[0] === 'full_body') console.log('  '+e.id);
