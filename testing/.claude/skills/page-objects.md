# Skill: Page Object Patterns for eRegistrations

## When to use
When creating a new Page Object for an eRegistrations service. Page Objects encapsulate selectors and common actions.

## Process

### 1. Get component keys from the form
Request from Manual Agent or use MCP: `form_get(service_id)`

### 2. Base structure
```typescript
import { Page, Locator } from '@playwright/test';

export class BitacoraPage {
  readonly page: Page;
  readonly empresasTab: Locator;
  readonly serviciosTab: Locator;
  readonly solicitudesTab: Locator;
  readonly companyCard: (name: string) => Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.empresasTab = page.locator('a:not(.dropdown-item):has-text("Empresas")');
    this.serviciosTab = page.locator('a:not(.dropdown-item):has-text("Servicios")');
    this.solicitudesTab = page.locator('a:not(.dropdown-item):has-text("Mis solicitudes")');
    this.companyCard = (name: string) => page.locator(`text=${name}`);
    this.confirmButton = page.locator('text=Confirmar y continuar');
  }

  async selectCompany(name: string) {
    await this.empresasTab.click();
    await this.companyCard(name).click();
    await this.confirmButton.click();
  }

  async navigateToServicios() {
    await this.serviciosTab.click();
    await this.page.waitForLoadState('networkidle');
  }
}
```

### 3. Naming conventions
- File: `tests/pages/[Service]Page.ts` (PascalCase)
- Class: `[Service]Page`
- Locators: descriptive camelCase (`submitButton`, `nitField`, `empresaDropdown`)
- Actions: verbs (`fillForm`, `submit`, `selectCompany`, `expandPermisos`)

## Common mistakes
- DO NOT hardcode accented Spanish text — it may change
- Use `[ref="key"]` when possible — more stable than text-based selectors
- EditGrids render async — always wait before interacting
- Some components are hidden by determinants — verify visibility first
