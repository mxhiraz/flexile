import { db, takeOrThrow } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { usersFactory } from "@test/factories/users";
import { selectComboboxOption } from "@test/helpers";
import { login } from "@test/helpers/auth";
import { fillOutUsdBankAccountForm } from "@test/helpers/bankAccountOnboarding";
import { expect, test, withinModal } from "@test/index";
import { eq } from "drizzle-orm";
import { companies, userComplianceInfos, users, wiseRecipients } from "@/db/schema";

test.describe("Contractor onboarding - bank account", () => {
  let company: typeof companies.$inferSelect;
  let onboardingUser: typeof users.$inferSelect;

  test.beforeEach(async ({ page }) => {
    company = (await companiesFactory.createCompletedOnboarding()).company;

    onboardingUser = (await usersFactory.create({ state: "Hawaii" }, { withoutBankAccount: true })).user;
    await companyContractorsFactory.create(
      { companyId: company.id, userId: onboardingUser.id },
      { withUnsignedContract: true },
    );

    await login(page, onboardingUser);
  });

  test("trims whitespace from fields", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();

    await fillOutUsdBankAccountForm(page, {
      legalName: ` ${onboardingUser.legalName} `,
      routingNumber: `071004200 `,
      accountNumber: ` 12345678 `,
      country: "United States",
      city: ` ${onboardingUser.city} `,
      streetAddress: ` ${onboardingUser.streetAddress} `,
      state: `${onboardingUser.state}`,
      zipCode: ` ${onboardingUser.zipCode} `,
    });

    await withinModal(
      async (modal) => {
        await modal.getByRole("button", { name: "Save bank account" }).click();
      },
      { page, title: "Bank account" }
    );

    await expect(page.getByText("Account ending in 5678")).toBeVisible();
    await expect(page.getByRole("button", { name: "Set up" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Done" })).toBeDisabled();

    const wiseRecipient = await db.query.wiseRecipients
      .findFirst({ where: eq(wiseRecipients.userId, onboardingUser.id) })
      .then(takeOrThrow);
    expect(wiseRecipient.currency).toBe("USD");
    expect(wiseRecipient.lastFourDigits).toBe("5678");
    expect(wiseRecipient.accountHolderName).toBe(onboardingUser.legalName);
    expect(wiseRecipient.countryCode).toBe("US");
  });

  test("allows setting a bank account from Mexico", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "MXN (Mexican Peso)", modal);
        await modal.getByLabel("Full name of the account holder").fill(onboardingUser.legalName ?? "");
        await modal.getByLabel("CLABE").fill("032180000118359719");
        await modal.getByRole("button", { name: "Continue" }).click();
        await modal.getByLabel("Country").click();
        await page.getByRole("option", { name: "Mexico" }).click();
        await modal.getByLabel("City").fill(" San Andres Cholula ");
        await modal.getByLabel("Street address, apt number").fill(" 4 Oriente 820 ");
        await modal.getByLabel("Post code").fill(" 72810 ");
        await modal.getByRole("button", { name: "Save bank account" }).click();
      },
      { page, title: "Bank account" }
    );

    await expect(page.getByText("Account ending in 9719")).toBeVisible();

    const wiseRecipient = await db.query.wiseRecipients
      .findFirst({
        where: eq(wiseRecipients.userId, onboardingUser.id),
      })
      .then(takeOrThrow);
    expect(wiseRecipient.currency).toBe("MXN");
    expect(wiseRecipient.lastFourDigits).toBe("9719");
    expect(wiseRecipient.accountHolderName).toBe(onboardingUser.legalName);
    expect(wiseRecipient.countryCode).toBe("MX");
  });

  test("hides optional fields for USD", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
        await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
        await expect(modal.getByLabel("Email")).not.toBeVisible();
      },
      { page, title: "Bank account" }
    );
  });

  test("hides optional fields for AED", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "AED (United Arab Emirates Dirham)", modal);
        await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
        await expect(modal.getByLabel("Date of birth")).not.toBeVisible();
        await expect(modal.getByText("Recipient's Nationality")).not.toBeVisible();
      },
      { page, title: "Bank account" }
    );
  });

  test("prefills the user's information", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();

    await withinModal(
      async (modal) => {
        await expect(modal.getByLabel("Full name of the account holder")).toHaveValue(onboardingUser.legalName ?? "");
        await modal.getByRole("button", { name: "Continue" }).click();
        await expect(modal.getByLabel("State")).toHaveText("Hawaii"); // unabbreviated version
        await expect(modal.getByLabel("City")).toHaveValue(onboardingUser.city ?? "");
        await expect(modal.getByLabel("Street address, apt number")).toHaveValue(onboardingUser.streetAddress ?? "");
        await expect(modal.getByLabel("ZIP code")).toHaveValue(onboardingUser.zipCode ?? "");
      },
      { page, title: "Bank account" }
    );
  });

  test("validates name and bank account information", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();

    await withinModal(
      async (modal) => {
        await modal.getByLabel("Full name of the account holder").fill("Da R");
        await modal.getByRole("button", { name: "Continue" }).click();
        await modal.getByRole("button", { name: "Save bank account" }).click();
        await expect(modal.getByRole("button", { name: "Continue" })).toBeDisabled();
        await expect(modal.getByLabel("Full name of the account holder")).not.toBeValid();
        await expect(modal.getByLabel("Account number")).not.toBeValid();
        await expect(modal.getByLabel("Routing number")).not.toBeValid();
        await expect(modal.getByText("Please enter an account number.")).toBeVisible();
        await expect(modal.getByText("This doesn't look like a full legal name.")).toBeVisible();

        await modal.getByLabel("Full name of the account holder").fill("Jane Doe");
        await expect(modal.getByLabel("Full name of the account holder")).toBeValid();
        await modal.getByLabel("Routing number").fill("123456789");
        await modal.getByLabel("Account number").fill("1");
        await modal.getByRole("button", { name: "Continue" }).click();
        await modal.getByRole("button", { name: "Save bank account" }).click();

        await expect(modal.getByLabel("Account number")).not.toBeValid();
        await expect(modal.getByLabel("Routing number")).not.toBeValid();
        await expect(modal.getByText("Please enter a valid account number of between 4 and 17 digits.")).toBeVisible();
        await expect(modal.getByText("This doesn't look like a valid ACH routing number.")).toBeVisible();

        await modal.getByLabel("Account number").fill("abcd");
        await modal.getByLabel("Account number").fill("12345678");
        await modal.getByLabel("Routing number").fill("071004200");
        await modal.getByRole("button", { name: "Continue" }).click();
        await modal.getByRole("button", { name: "Save bank account" }).click();

        await expect(modal.getByText("Saving bank account...")).toBeVisible();
      },
      { page, title: "Bank account" }
    );
  });

  test("allows an EUR Recipient to submit bank account info", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "EUR (Euro)", modal);
        await expect(modal.getByLabel("Full name of the account holder")).toHaveValue(onboardingUser.legalName ?? "");
        await modal.getByLabel("IBAN").fill("HR7624020064583467589");
        await modal.getByRole("button", { name: "Continue" }).click();
        await expect(modal.getByLabel("Country")).toHaveText("United States");
        await modal.getByLabel("Country").click();
        await page.getByRole("option", { name: "Croatia" }).click();
        await modal.getByLabel("City").fill("Zagreb");
        await modal.getByLabel("Street address, apt number").fill("Ulica Suha Punta 3");
        await modal.getByLabel("Post code").fill("23000");
        await modal.getByRole("button", { name: "Save bank account" }).click();
      },
      { page, title: "Bank account" }
    );

    await expect(page.getByText("Account ending in 7589")).toBeVisible();
  });

  test("allows a CAD Recipient to submit bank account info", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "CAD (Canadian Dollar)", modal);
        await expect(modal.getByLabel("Full name of the account holder")).toHaveValue(onboardingUser.legalName ?? "");
        await modal.getByLabel("Institution number").fill("006");
        await modal.getByLabel("Transit number").fill("04841");
        await modal.getByLabel("Account number").fill("3456712");
        await modal.getByRole("button", { name: "Continue" }).click();
        await expect(modal.getByLabel("Country")).toHaveText("United States");
        await modal.getByLabel("Country").click();
        await page.getByRole("option", { name: "Canada" }).click();
        await modal.getByLabel("City").fill(onboardingUser.city ?? "");
        await modal.getByLabel("Street address, apt number").fill("59-720 Kamehameha Hwy");
        await modal.getByLabel("Province").click();
        await page.getByRole("option", { name: "Alberta" }).click();
        await modal.getByLabel("Post code").fill("A2A 2A2");
        await modal.getByRole("button", { name: "Save bank account" }).click();
      },
      { page, title: "Bank account" }
    );

    await expect(page.getByText("Account ending in 6712")).toBeVisible();
  });

  test("shows relevant account types for individual entity", async ({ page }) => {
    await page.getByRole("button", { name: "Set up" }).click();
    
    await withinModal(
      async (modal) => {
        await selectComboboxOption(page, "Currency", "KRW (South Korean Won)", modal);
        await expect(modal.getByLabel("Date of birth")).toBeVisible();
        await expect(modal.getByLabel("Bank name")).toBeVisible();
        await expect(modal.getByLabel("Account number (KRW accounts only)")).toBeVisible();
      },
      { page, title: "Bank account" }
    );
  });

  test.describe("when the user is a business entity", () => {
    test.beforeEach(async () => {
      await db
        .update(userComplianceInfos)
        .set({
          businessEntity: true,
          businessName: "Business Inc.",
        })
        .where(eq(userComplianceInfos.userId, onboardingUser.id));
    });

    test("shows relevant account types", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "KRW (South Korean Won)", modal);
          await expect(modal.getByLabel("Name of the business / organisation")).toBeVisible();
          await expect(modal.getByLabel("Bank name")).toBeVisible();
          await expect(modal.getByLabel("Account number (KRW accounts only)")).toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("prefills the account holder field with the business name", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
          await expect(modal.getByLabel("Name of the business / organisation")).toHaveValue("Business Inc.");
        },
        { page, title: "Bank account" }
      );
    });
  });

  test.describe("address fields", () => {
    test("shows state field", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "United States", exact: true }).click();
          await expect(modal.getByLabel("State")).toBeVisible();
          await expect(modal.getByLabel("ZIP code")).toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("shows province field", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "Canada" }).click();
          await expect(modal.getByLabel("Province")).toBeVisible();
          await expect(modal.getByLabel("Post code")).toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("only shows post code field for United Kingdom", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "United Kingdom" }).click();
          await expect(modal.getByLabel("Post code")).toBeVisible();
          await expect(modal.getByLabel("Province")).not.toBeVisible();
          await expect(modal.getByLabel("State")).not.toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("does not show state or post code fields for Bahamas", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "Bahamas" }).click();
          await expect(modal.getByLabel("Post code")).not.toBeVisible();
          await expect(modal.getByLabel("Province")).not.toBeVisible();
          await expect(modal.getByLabel("State")).not.toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("shows optional Prefecture field for Japan", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "Japan" }).click();
          await expect(modal.getByLabel("Prefecture (optional)")).toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test("shows optional Region field for New Zealand", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await modal.getByRole("button", { name: "Continue" }).click();
          await modal.getByLabel("Country").click();
          await page.getByRole("option", { name: "New Zealand" }).click();
          await expect(modal.getByLabel("Region (optional)")).toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });
  });

  test.describe("currency field", () => {
    test.describe("when user's country is United States", () => {
      test("should pre-fill currency with USD", async ({ page }) => {
        await page.getByRole("button", { name: "Set up" }).click();

        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Currency")).toContainText("USD (United States Dollar)");
          },
          { page, title: "Bank account" }
        );
      });
    });

    test.describe("when user's country is France", () => {
      test("should pre-fill currency with EUR", async ({ page }) => {
        await db.update(users).set({ countryCode: "FR" }).where(eq(users.id, onboardingUser.id));
        await page.getByRole("button", { name: "Set up" }).click();

        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Currency")).toContainText("EUR (Euro)");
          },
          { page, title: "Bank account" }
        );
      });
    });

    test.describe("when user's country is Germany", () => {
      test("should pre-fill currency with EUR", async ({ page }) => {
        await db.update(users).set({ countryCode: "DE" }).where(eq(users.id, onboardingUser.id));
        await page.getByRole("button", { name: "Set up" }).click();

        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Currency")).toContainText("EUR (Euro)");
          },
          { page, title: "Bank account" }
        );
      });
    });

    test.describe("when user's country is Canada", () => {
      test("should pre-fill currency with CAD", async ({ page }) => {
        await db.update(users).set({ countryCode: "CA" }).where(eq(users.id, onboardingUser.id));
        await page.getByRole("button", { name: "Set up" }).click();

        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Currency")).toContainText("CAD (Canadian Dollar)");
          },
          { page, title: "Bank account" }
        );
      });
    });

    test.describe("when user's country is Croatia", () => {
      test("pre-fills currency with EUR", async ({ page }) => {
        await db.update(users).set({ countryCode: "HR" }).where(eq(users.id, onboardingUser.id));
        await page.getByRole("button", { name: "Set up" }).click();

        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Currency")).toContainText("EUR (Euro)");
          },
          { page, title: "Bank account" }
        );
      });
    });
  });

  test.describe("account type selection", () => {
    test("hides account type and selects the only account type option for AED currency", async ({ page }) => {
      await page.getByRole("button", { name: "Set up" }).click();
      
      await withinModal(
        async (modal) => {
          await selectComboboxOption(page, "Currency", "AED (United Arab Emirates Dirham)", modal);
          await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
          await expect(modal.getByLabel("IBAN")).toBeVisible();
          await expect(modal.getByLabel("Account Type")).not.toBeVisible();
        },
        { page, title: "Bank account" }
      );
    });

    test.describe("when the user is from the United States", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Set up" }).click();
      });

      test("shows local bank account when the currency is GBP", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "GBP (British Pound)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("UK sort code")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use IBAN")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is HKD", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "HKD (Hong Kong Dollar)", modal);
            await modal.getByLabel("I'd prefer to use FPS ID").click();
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Bank name")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use FPS ID")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is HUF", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "HUF (Hungarian Forint)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use IBAN")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is IDR", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "IDR (Indonesian Rupiah)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Bank name")).toBeVisible();
            await expect(modal.getByLabel("Account number (IDR accounts only)")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is KES", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "KES (Kenyan Shilling)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Bank name")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is PHP", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "PHP (Philippine Peso)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Bank name")).toBeVisible();
            await expect(modal.getByLabel("Account number (PHP accounts only)")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows local bank account when the currency is PLN", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "PLN (Polish Złoty)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use IBAN")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows IBAN when the currency is UAH", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await selectComboboxOption(page, "Currency", "UAH (Ukrainian Hryvnia)", modal);
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("IBAN")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use PrivatBank card")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });
    });

    test.describe("when the user is from Germany", () => {
      test.beforeEach(async ({ page }) => {
        const countryCode = "DE";
        await db
          .update(users)
          .set({ countryCode, citizenshipCountryCode: countryCode })
          .where(eq(users.id, onboardingUser.id));
        await page.getByRole("button", { name: "Set up" }).click();
      });

      test("shows local bank account form by default", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await expect(modal.getByLabel("Full name of the account holder")).toBeVisible();
            await expect(modal.getByLabel("IBAN")).toBeVisible();
            await expect(modal.getByLabel("I'd prefer to use SWIFT")).toBeVisible();
            await expect(modal.getByLabel("Account Type")).not.toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });

      test("shows SWIFT account if prefer to use SWIFT checkbox is checked", async ({ page }) => {
        await withinModal(
          async (modal) => {
            await modal.getByLabel("I'd prefer to use SWIFT").check();
            await expect(modal.getByLabel("SWIFT / BIC code")).toBeVisible();
            await expect(modal.getByLabel("Account number")).toBeVisible();
          },
          { page, title: "Bank account" }
        );
      });
    });
  });
});
