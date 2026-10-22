import { expect, test } from "@playwright/test";

test("public discovery pages reflow without horizontal overflow at supported widths in both themes", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = ["/", "/tools", "/tools/typescript", "/search?q=devatlas-audit-no-match", "/stacks?q=devatlas-audit-no-match", "/stacks/devatlas-audit-no-stack", "/builds?q=devatlas-audit-no-match", "/builds/devatlas-audit-no-build", "/whats-new?technologySlug=devatlas-audit-no-match", "/releases/devatlas-audit-no-release"];
  for (const theme of ["light", "dark"]) {
    await page.addInitScript((value) => window.localStorage.setItem("devatlas-theme", value), theme);
    for (const route of routes) {
      await page.goto(route);
      for (const width of [320, 375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} overflowed at ${width}px in ${theme} theme`).toBe(true);
      }
    }
  }
});

test("mobile navigation exposes unified search", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Search" })).toHaveAttribute("href", "/search");
});

test("text tokens meet WCAG AA normal-text contrast in both themes", async ({ page }) => {
  await page.goto("/");
  const ratios = await page.evaluate(() => {
    const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (value: string) => rgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (a: string, b: string) => {
      const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return ["light", "dark"].map((theme) => {
      document.documentElement.dataset.theme = theme;
      const canvas = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();
      const surface = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim();
      const soft = getComputedStyle(document.documentElement).getPropertyValue("--text-soft").trim();
      const faint = getComputedStyle(document.documentElement).getPropertyValue("--text-faint").trim();
      const parseHex = (hex: string) => {
        const expanded = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
        return `rgb(${parseInt(expanded.slice(1, 3), 16)}, ${parseInt(expanded.slice(3, 5), 16)}, ${parseInt(expanded.slice(5, 7), 16)})`;
      };
      return { theme, soft, faint, canvas, surface, softCanvas: ratio(parseHex(soft), parseHex(canvas)), faintCanvas: ratio(parseHex(faint), parseHex(canvas)), softSurface: ratio(parseHex(soft), parseHex(surface)), faintSurface: ratio(parseHex(faint), parseHex(surface)) };
    });
  });
  for (const theme of ratios) {
    const evidence = JSON.stringify(theme);
    expect(theme.softCanvas, `${theme.theme} text-soft on canvas ${evidence}`).toBeGreaterThanOrEqual(4.5);
    expect(theme.faintCanvas, `${theme.theme} text-faint on canvas ${evidence}`).toBeGreaterThanOrEqual(4.5);
    expect(theme.softSurface, `${theme.theme} text-soft on surface ${evidence}`).toBeGreaterThanOrEqual(4.5);
    expect(theme.faintSurface, `${theme.theme} text-faint on surface ${evidence}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("code controls retain readable contrast on the fixed dark code surface in both themes", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.addInitScript((value) => window.localStorage.setItem("devatlas-theme", value), theme);
    await page.goto("/tools/typescript");
    const copy = page.getByRole("button", { name: "Copy" });
    const colors = await copy.evaluate((element) => ({ foreground: getComputedStyle(element).color, background: getComputedStyle(element.closest("figure")!).backgroundColor }));
    const ratio = await page.evaluate(({ foreground, background }) => {
      const luminance = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const pair = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (pair[0] + 0.05) / (pair[1] + 0.05);
    }, colors);
    expect(ratio, `${theme} code copy text`).toBeGreaterThanOrEqual(4.5);
  }
});

test("syntax code can be scrolled and read by keyboard users", async ({ page }) => {
  await page.goto("/tools/typescript");
  const code = page.getByRole("group", { name: /code example/i }).first();
  await expect(code).toHaveAttribute("tabindex", "0");
  await code.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(code).toBeFocused();
  await expect(code).toHaveCSS("outline-width", "3px");
  await expect(code).toHaveCSS("outline-style", "solid");
});

test("search and technology filters retain a visible keyboard focus indicator", async ({ page }) => {
  for (const route of ["/tools", "/search", "/stacks", "/builds"]) {
    await page.goto(route);
    const controls = page.locator("main input, main select");
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index);
      await control.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
      expect(await control.evaluate((element) => getComputedStyle(element).outlineWidth)).not.toBe("0px");
    }
  }
});

test("guide filters present technology names while preserving slug query parameters", async ({ page }) => {
  for (const route of ["/stacks", "/builds"]) {
    await page.goto(route);
    const filter = page.getByRole("combobox", { name: "Filter by technology" });
    await expect(filter.locator("option").filter({ hasText: "React" })).toHaveAttribute("value", "react");
    await filter.selectOption("react");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/technologySlug=react/);
  }
});

test("Tailwind heading utilities control page heading sizes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/stacks");
  await expect(page.locator("main h1")).toHaveCSS("font-size", "48px");
  await page.goto("/search");
  await expect(page.locator("main h1")).toHaveCSS("font-size", "48px");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("main h1")).toHaveCSS("font-size", "36px");
});

test("a populated published release remains readable and its detail page has responsive code", async ({ page, request }) => {
  const response = await request.get("/api/releases?limit=1");
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { items: Array<{ slug: string }> };
  test.skip(body.items.length === 0, "No published release is available in the configured database");
  await page.goto(`/releases/${body.items[0].slug}`);
  await expect(page.locator("main h1")).toBeVisible();
  const code = page.locator("main pre");
  if (await code.count()) {
    await expect(code.first()).toHaveAttribute("tabindex", "0");
    await code.first().focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(code.first()).toBeFocused();
  }
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

for (const [type, endpoint, route] of [["stack", "/api/stacks?limit=1", "/stacks/"], ["build", "/api/builds?limit=1", "/builds/"]] as const) {
  test(`populated published ${type} guide is responsive and code can receive keyboard focus`, async ({ page, request }) => {
    const response = await request.get(endpoint);
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { items: Array<{ slug: string }> };
    test.skip(body.items.length === 0, `No published ${type} guide is available in the configured database`);
    await page.goto(`${route}${body.items[0].slug}`);
    await expect(page.locator("main h1")).toBeVisible();
    const code = page.getByRole("group", { name: /code example/i }).first();
    await expect(code).toHaveAttribute("tabindex", "0");
    await code.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(code).toBeFocused();
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
