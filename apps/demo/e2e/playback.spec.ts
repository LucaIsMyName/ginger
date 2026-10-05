import { test, expect } from "@playwright/test";

test.describe("Ginger playback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the demo page with examples nav", async ({ page }) => {
    await expect(page.locator("nav[aria-label='Examples']")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Single track" })
    ).toBeVisible();
  });

  test("single track demo shows title and play button", async ({ page }) => {
    await page.getByRole("button", { name: "Single track" }).click();
    const main = page.getByRole("main");
    await expect(main.getByText("Single track", { exact: true })).toBeVisible();
    await expect(main.locator('[data-ginger-component="PlayPause"]')).toBeVisible();
  });

  test("playlist demo shows multiple tracks", async ({ page }) => {
    await page
      .getByRole("button", { name: "Playlist + controls" })
      .click();
    await expect(page.getByRole("main").getByText("Now playing")).toBeVisible();
  });

  test("navigating between demos works", async ({ page }) => {
    const main = page.getByRole("main");

    await page.getByRole("button", { name: "Single track" }).click();
    await expect(main.getByText("Single track", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "CSS variables" }).click();
    await expect(main.getByText("CSS variables on Provider")).toBeVisible();

    await page.getByRole("button", { name: "Unstyled showcase" }).click();
    await expect(main.getByText("Fully unstyled mode")).toBeVisible();
  });

  test("play/pause button toggles state", async ({ page }) => {
    await page.getByRole("button", { name: "Single track" }).click();
    const playPause = page.getByRole("main").locator('[data-ginger-component="PlayPause"]');
    await expect(playPause).toBeVisible();
    await expect(playPause).toHaveAttribute("aria-label", /play/i);
    await playPause.click();
    await expect(playPause).toHaveAttribute("aria-label", /pause/i, { timeout: 5000 });
  });
});
