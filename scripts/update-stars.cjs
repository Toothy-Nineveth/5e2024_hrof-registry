// scripts/update-stars.cjs
const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('GITHUB_TOKEN is not set');
  process.exit(1);
}

async function fetchStars(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!res.ok) {
    console.error(`Failed to fetch ${repo}: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  return data.stargazers_count ?? 0;
}

(async () => {
  const filePath = path.join(__dirname, '..', 'registry.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const registry = JSON.parse(raw);

  let changed = false;

  for (const entry of registry) {
    if (!entry.github_repo) {
      continue;
    }

    const stars = await fetchStars(entry.github_repo);
    if (stars === null) continue;

    if (entry.stars !== stars) {
      console.log(`Updating ${entry.id} (${entry.github_repo}): ${entry.stars} -> ${stars}`);
      entry.stars = stars;
      changed = true;
    }
  }

  if (!changed) {
    console.log('No changes, exiting.');
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  console.log('registry.json updated.');
})();

