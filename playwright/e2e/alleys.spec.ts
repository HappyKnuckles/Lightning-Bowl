import type { Locator, Page } from '@playwright/test';
import { test, expect } from './lib/app';
import { AddGamePage } from '../screenshots/pages/add-game.page';
import { HistoryPage } from '../screenshots/pages/history.page';
import { settle, waitForAppReady } from '../screenshots/lib/stabilize';
import { CLASSIC_ALLEY, MONDAY_ALLEY } from '../screenshots/fixtures-data/seed-profiles';
import { ALLEY_TOWN, ALLEYS } from './fixtures/alleys';

/**
 * The alley a game was played at: picked through the alley search (add game,
 * history edit), shown on the game cards, narrowed by the filter, and ranked in
 * the stats highlights. The search is network-backed, so every picker test runs
 * against `mockApi: 'alleys'` (fixtures/alleys.ts). The seed plays the
 * "Monday Night League" sessions at MONDAY_ALLEY (5 × 3 games), the "City
 * Classic" sessions at CLASSIC_ALLEY (11 games) and the practice session (3
 * games) at no alley.
 */

const [SUNSET, LUCKY] = ALLEYS;

function picker(page: Page): Locator {
  return page.locator('ion-modal.show-modal app-alley-select');
}

/** A picker row by alley name — clicked on its title, so the heart button isn't hit. */
function pickerRow(page: Page, name: string): Locator {
  return picker(page).locator('ion-item', { has: page.locator('h2', { hasText: name }) });
}

/**
 * Type a term and submit it. The searchbar's `ionInput` is debounced 500ms, and
 * Enter only searches the term once that has landed, so wait it out first.
 */
async function searchAlley(page: Page, term: string): Promise<void> {
  const input = picker(page).locator('ion-searchbar input');
  await input.fill(term);
  await settle(page, 700);
  await input.press('Enter');
}

async function pickAlley(page: Page, name: string): Promise<void> {
  await pickerRow(page, name).locator('h2').click();
  await expect(picker(page)).toHaveCount(0);
}

/** Open the add page's collapsed "Game Details" section and the alley picker inside it. */
async function openAddGameAlleyPicker(app: { page: Page; active: () => Locator }): Promise<void> {
  const details = app.active().locator('app-game ion-accordion');
  if ((await details.getAttribute('class'))?.includes('accordion-expanded') !== true) {
    await details.locator('ion-item[slot="header"]').click();
    await settle(app.page, 400);
  }
  await app.active().locator('app-game .alley-selector').click();
  await expect(picker(app.page)).toBeVisible();
}

test.describe('alleys — add game', () => {
  test('picks an alley from the search, saves it, and history shows it', async ({ app }) => {
    await app.boot('/tabs/add', { seed: 'empty', mockApi: 'alleys', extraLocal: { pinInputMode: 'true' } });

    await openAddGameAlleyPicker(app);
    await searchAlley(app.page, ALLEY_TOWN.name);
    await expect(pickerRow(app.page, SUNSET.name)).toBeVisible();
    await expect(pickerRow(app.page, LUCKY.name)).toBeVisible();
    await pickAlley(app.page, SUNSET.name);

    await expect(app.active().locator('app-game .alley-selector')).toContainText(SUNSET.name);

    const addGame = new AddGamePage(app.page);
    await addGame.recordGutterGame();
    await addGame.saveSingleGame();

    await app.tapTab('history');
    await expect(app.active().locator('ion-accordion')).toHaveCount(1);
    await expect(app.active().locator('ion-accordion p.score', { hasText: SUNSET.name })).toBeVisible();
  });

  test('offers the typed name when the search finds nothing', async ({ app }) => {
    await app.boot('/tabs/add', { seed: 'empty', mockApi: 'alleys' });

    await openAddGameAlleyPicker(app);
    await searchAlley(app.page, 'Nowhere Lanes');
    await expect(picker(app.page).getByText('No alley found for "Nowhere Lanes".')).toBeVisible();

    await picker(app.page).locator('ion-item', { hasText: 'Use "Nowhere Lanes"' }).click();
    await expect(picker(app.page)).toHaveCount(0);
    await expect(app.active().locator('app-game .alley-selector')).toContainText('Nowhere Lanes');
  });

  test('remembers a picked alley as recent and a hearted one as saved', async ({ app }) => {
    await app.boot('/tabs/add', { seed: 'empty', mockApi: 'alleys' });

    await openAddGameAlleyPicker(app);
    await searchAlley(app.page, ALLEY_TOWN.name);
    await pickAlley(app.page, SUNSET.name);

    // Reopened, the picked alley is listed under "Recently used" and marked as the current one.
    await openAddGameAlleyPicker(app);
    await expect(picker(app.page).getByText('Recently used')).toBeVisible();
    await expect(pickerRow(app.page, SUNSET.name)).toHaveClass(/is-selected/);

    // The heart saves it without picking it: the row moves to "Saved alleys" and the picker stays open.
    await pickerRow(app.page, SUNSET.name).locator('ion-button').click();
    await expect(picker(app.page).getByText('Saved alleys')).toBeVisible();
    await expect(picker(app.page).getByText('Recently used')).toHaveCount(0);
    await expect(pickerRow(app.page, SUNSET.name).locator('ion-icon[name="heart"]')).toBeVisible();

    // Clear empties the game's alley again.
    await picker(app.page).locator('ion-button', { hasText: 'Clear' }).click();
    await expect(app.active().locator('app-game .alley-selector')).toContainText('None');
  });

  test('lists the alleys near the device position with their distance', async ({ app }) => {
    await app.page.context().grantPermissions(['geolocation']);
    await app.page.context().setGeolocation({ latitude: ALLEY_TOWN.lat, longitude: ALLEY_TOWN.lon });
    await app.boot('/tabs/add', { seed: 'empty', mockApi: 'alleys' });

    await openAddGameAlleyPicker(app);
    await picker(app.page).locator('ion-item', { hasText: 'Alleys near me' }).click();

    await expect(pickerRow(app.page, SUNSET.name)).toBeVisible();
    await expect(pickerRow(app.page, LUCKY.name)).toBeVisible();
    await expect(picker(app.page).locator('.distance-note')).toHaveCount(ALLEYS.length);
  });
});

test.describe('alleys — history', () => {
  test('series headers show the seeded alley', async ({ app }) => {
    await app.boot('/tabs/history');
    await new HistoryPage(app.page).waitForGames();

    const alleyMeta = app.active().locator('.series-meta:has(ion-icon[name="location-outline"])');
    await expect(alleyMeta.filter({ hasText: CLASSIC_ALLEY }).first()).toBeVisible();
    await expect(alleyMeta.filter({ hasText: MONDAY_ALLEY }).first()).toBeAttached();
  });

  test('editing a series changes its alley and the change survives a reload', async ({ app }) => {
    // A saved alley lets the picker offer it without a search.
    await app.boot('/tabs/history', { mockApi: 'alleys', extraLocal: { favoriteAlleys: JSON.stringify([SUNSET]) } });
    await new HistoryPage(app.page).waitForGames();

    // The newest series is a City Classic one. Its edit action sits behind the
    // swipe/long-press gesture; trigger the option's click handler directly.
    const series = app.active().locator('.series-container').first();
    await expect(series.locator('.series-meta', { hasText: CLASSIC_ALLEY })).toBeVisible();
    await series.locator('.series-sliding > ion-item-options[side="start"] ion-item-option').dispatchEvent('click');

    const editFields = series.locator('.series-edit-fields');
    await editFields.locator('.alley-selector').click();
    await expect(picker(app.page).getByText('Saved alleys')).toBeVisible();
    await pickAlley(app.page, SUNSET.name);
    await expect(editFields.locator('.alley-selector')).toContainText(SUNSET.name);
    await editFields.locator('ion-button', { hasText: 'Save' }).click();

    await expect(series.locator('.series-meta', { hasText: SUNSET.name })).toBeVisible();

    await app.page.reload();
    await waitForAppReady(app.page);
    await expect(app.active().locator('.series-container').first().locator('.series-meta', { hasText: SUNSET.name })).toBeVisible();
  });
});

test.describe('alleys — filter', () => {
  /** Pick options in the filter modal's "Alleys" select (an Ionic alert), replacing the default "All". */
  async function selectAlleys(page: Page, names: string[]): Promise<void> {
    await page.locator('ion-modal.show-modal ion-select[name="alleys"]').click();
    const alert = page.locator('ion-alert');
    await expect(alert).toBeVisible();
    const option = (name: string) => alert.locator('button[role="checkbox"]', { hasText: new RegExp(`^\\s*${name}\\s*$`) });
    await option('All').click();
    for (const name of names) await option(name).click();
    await alert.locator('.alert-button-group button', { hasText: 'OK' }).click();
    await expect(alert).toHaveCount(0);
  }

  async function confirmCount(page: Page): Promise<number> {
    const confirm = page.locator('ion-modal.show-modal ion-footer ion-button');
    await expect(confirm).toContainText(/\(\d+ Games\)/);
    return parseInt(/\((\d+) Games\)/.exec((await confirm.textContent()) ?? '')![1], 10);
  }

  test('narrows the list to one alley and shows it as a chip', async ({ app }) => {
    await app.boot('/tabs/history');
    const history = new HistoryPage(app.page);
    await history.waitForGames();

    await history.openFilter();
    await selectAlleys(app.page, [MONDAY_ALLEY]);
    expect(await confirmCount(app.page)).toBe(15);
    await app.page.locator('ion-modal.show-modal ion-footer ion-button').click();

    await expect(app.active().locator('ion-header ion-badge').first()).toHaveText('15');
    await expect(app.active().locator('app-generic-filter-active ion-chip', { hasText: MONDAY_ALLEY })).toBeVisible();
    await expect(app.active().locator('.series-meta', { hasText: CLASSIC_ALLEY })).toHaveCount(0);
  });

  test('"None" keeps only the games without an alley', async ({ app }) => {
    await app.boot('/tabs/history');
    const history = new HistoryPage(app.page);
    await history.waitForGames();

    await history.openFilter();
    await selectAlleys(app.page, ['None']);
    expect(await confirmCount(app.page)).toBe(3);
    await app.page.locator('ion-modal.show-modal ion-footer ion-button').click();

    await expect(app.active().locator('ion-header ion-badge').first()).toHaveText('3');
    await expect(app.active().locator('app-generic-filter-active ion-chip', { hasText: 'No Alleys' })).toBeVisible();
  });
});

test.describe('alleys — stats', () => {
  /** A highlight card on the Overall tab. The Sessions tab renders its own set further down the DOM. */
  const overallHighlight = (app: { active: () => Locator }, title: string) =>
    app.active().locator('app-stat-highlight-item', { hasText: title }).first();

  test('highlights the most played alley and lists every alley', async ({ app }) => {
    await app.boot('/tabs/stats');

    const mostPlayed = overallHighlight(app, 'Most played alley');
    await expect(mostPlayed.locator('.item-card .item-name')).toHaveText(MONDAY_ALLEY);
    await expect(mostPlayed.locator('.item-card .item-extra')).toContainText('5 visits');

    const best = overallHighlight(app, 'Best alley');
    await expect(best.locator('.item-card .item-name')).toHaveText(new RegExp(`^(${MONDAY_ALLEY}|${CLASSIC_ALLEY})$`));

    await mostPlayed.locator('.item-card').click();
    const modal = app.page.locator('ion-modal.show-modal');
    await expect(modal.locator('ion-title')).toHaveText('All most played alley');
    await expect(modal.locator('.modal-card .item-name')).toHaveText([MONDAY_ALLEY, CLASSIC_ALLEY]);
  });

  test('shows the empty message when no game has an alley', async ({ app }) => {
    // Play one game without picking an alley — stats exist, alley stats don't.
    await app.boot('/tabs/add', { seed: 'empty', extraLocal: { pinInputMode: 'true' } });
    const addGame = new AddGamePage(app.page);
    await addGame.recordGutterGame();
    await addGame.saveSingleGame();

    await app.tapTab('stats');
    const mostPlayed = overallHighlight(app, 'Most played alley');
    await expect(mostPlayed.locator('.empty-msg')).toHaveText('No Games with alleys saved.');
  });
});
