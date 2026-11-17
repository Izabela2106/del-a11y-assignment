import { readFileSync } from "node:fs";
import path from "node:path";

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { App } from "./App";

const pandaStyles = readFileSync(
	path.join(process.cwd(), ".panda/styles.css"),
	"utf8",
);

const columnHeaderFor = (sortLabel: string): HTMLElement => {
	const button = screen.getByRole("button", { name: sortLabel });
	const header = button.closest("th");
	if (header === null) {
		throw new Error(`Expected ${sortLabel} to sit in a column header`);
	}

	return header;
};

const openResults = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole("tab", { name: "Results" }));
};

describe("Championship Day", () => {
	it("renders the page heading", () => {
		render(<App />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Championship Day" }),
		).toBeInTheDocument();
	});

	it("shows every heat on the schedule", () => {
		render(<App />);

		expect(screen.getByRole("heading", { name: "Heat 1" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Heat 2" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Heat 3" })).toBeInTheDocument();
	});

	it("shows finished sessions when Finished is chosen", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Finished" }));

		expect(screen.getByRole("heading", { name: "Heat 2" })).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Heat 1" }),
		).not.toBeInTheDocument();
	});

	it("shows an athlete when Results is chosen", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		expect(screen.getByText("Lena Berg")).toBeInTheDocument();
	});

	it("shows the medal ceremonies note when Medals is chosen", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("tab", { name: "Medals" }));

		expect(
			screen.getByText("Medal ceremonies are published after the final heat."),
		).toBeInTheDocument();
	});

	it("shows the heat detail when Details is activated", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Heat 1 Details" }));

		expect(screen.getByText("First run starts at 10:15.")).toBeInTheDocument();
	});

	it("opens and closes alert preferences", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Manage alerts" }));
		expect(
			screen.getByRole("dialog", { name: "Alert preferences" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Close" }));
		expect(
			screen.queryByRole("dialog", { name: "Alert preferences" }),
		).not.toBeInTheDocument();
	});

	it("shows a confirmation when the share control is used", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Copy link" }));

		expect(screen.getByText("Link copied")).toBeInTheDocument();
	});
});

describe("Accessibility findings", () => {
	it("makes every session filter a keyboard button", async () => {
		const user = userEvent.setup();
		render(<App />);

		const liveOnly = screen.getByRole("button", { name: "Live only" });
		const allSessions = screen.getByRole("button", { name: "All sessions" });
		const finished = screen.getByRole("button", { name: "Finished" });

		for (const filter of [liveOnly, allSessions, finished]) {
			expect(filter.tagName).toBe("BUTTON");
			expect(filter).not.toHaveAttribute("tabindex");
		}

		liveOnly.focus();
		await user.tab();
		expect(allSessions).toHaveFocus();
		await user.tab();
		expect(finished).toHaveFocus();

		liveOnly.focus();
		await user.keyboard("{Enter}");

		expect(screen.getByRole("heading", { name: "Heat 1" })).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Heat 2" }),
		).not.toBeInTheDocument();
	});

	it("exposes which session filter is pressed", async () => {
		const user = userEvent.setup();
		render(<App />);

		expect(
			screen.getByRole("button", { name: "All sessions" }),
		).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "Live only" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);

		await user.click(screen.getByRole("button", { name: "Finished" }));

		expect(screen.getByRole("button", { name: "Finished" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(
			screen.getByRole("button", { name: "All sessions" }),
		).toHaveAttribute("aria-pressed", "false");
	});

	it("shows standing as text instead of a colour-only mark", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		expect(screen.getAllByRole("cell", { name: "Qualified" })).toHaveLength(2);
		expect(screen.getAllByRole("cell", { name: "Eliminated" })).toHaveLength(2);
		expect(screen.queryByText("—")).not.toBeInTheDocument();
		expect(screen.getAllByRole("table")).toHaveLength(1);
	});

	it("names the bib sort button Sort by bib", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		expect(
			screen.getByRole("button", { name: "Sort by bib" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: "Sort by rank" }),
		).toHaveLength(1);
	});

	it("exposes the active sort column and direction", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		expect(columnHeaderFor("Sort by rank")).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
		expect(columnHeaderFor("Sort by bib")).not.toHaveAttribute("aria-sort");

		await user.click(screen.getByRole("button", { name: "Sort by bib" }));

		expect(columnHeaderFor("Sort by bib")).toHaveAttribute(
			"aria-sort",
			"descending",
		);
		expect(columnHeaderFor("Sort by rank")).not.toHaveAttribute("aria-sort");
	});

	it("names the athlete column", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		expect(
			screen.getByRole("columnheader", { name: "Athlete" }),
		).toBeInTheDocument();
	});

	it("lets the keyboard reach the horizontally scrolling results", async () => {
		const user = userEvent.setup();
		render(<App />);

		await openResults(user);

		const scroller = screen.getByLabelText("Results table");
		expect(scroller).toHaveAttribute("tabindex", "0");
		scroller.focus();
		expect(scroller).toHaveFocus();
	});

	it("gives each Details button the session name", () => {
		render(<App />);

		expect(
			screen.getByRole("button", { name: "Heat 1 Details" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Heat 2 Details" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Heat 3 Details" }),
		).toBeInTheDocument();
	});

	it("exposes the schedule as a list", () => {
		render(<App />);

		const list = screen.getByRole("list", { name: "Schedule list" });
		expect(list).toHaveAttribute("role", "list");
		expect(within(list).getAllByRole("listitem")).toHaveLength(3);
	});

	it("moves between view tabs with arrow keys and a roving tabindex", async () => {
		const user = userEvent.setup();
		render(<App />);

		const schedule = screen.getByRole("tab", { name: "Schedule" });
		const results = screen.getByRole("tab", { name: "Results" });
		const medals = screen.getByRole("tab", { name: "Medals" });

		expect(schedule.tagName).toBe("BUTTON");
		expect(results.tagName).toBe("BUTTON");
		expect(medals.tagName).toBe("BUTTON");
		expect(schedule).toHaveAttribute("tabindex", "0");
		expect(results).toHaveAttribute("tabindex", "-1");
		expect(medals).toHaveAttribute("tabindex", "-1");

		schedule.focus();
		await user.keyboard("{ArrowRight}");

		expect(results).toHaveAttribute("aria-selected", "true");
		expect(results).toHaveAttribute("tabindex", "0");
		expect(results).toHaveFocus();
		expect(schedule).toHaveAttribute("tabindex", "-1");
		expect(screen.getByText("Lena Berg")).toBeInTheDocument();

		await user.keyboard("{ArrowRight}");
		expect(medals).toHaveAttribute("aria-selected", "true");

		await user.keyboard("{ArrowRight}");
		expect(schedule).toHaveAttribute("aria-selected", "true");
		expect(schedule).toHaveFocus();
	});

	it("announces how many sessions the filter is showing", async () => {
		const user = userEvent.setup();
		render(<App />);

		expect(
			screen.getByRole("status", { name: "3 sessions shown" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Finished" }));

		expect(
			screen.getByRole("status", { name: "1 session shown" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("status", { name: "3 sessions shown" }),
		).not.toBeInTheDocument();
	});

	it("presents the course mark as text", () => {
		render(<App />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.getByText("Alpine skiing")).toBeInTheDocument();
		expect(
			screen.getByText("Course: 58 gates, 180 m vertical drop"),
		).toBeInTheDocument();
	});

	it("names the favourite button and exposes whether it is pressed", async () => {
		const user = userEvent.setup();
		render(<App />);

		const favourite = screen.getByRole("button", { name: "Add to favorites" });
		expect(favourite).toHaveAttribute("aria-pressed", "false");

		await user.click(favourite);

		expect(favourite).toHaveAttribute("aria-pressed", "true");
	});

	it("names the share button Copy link", () => {
		render(<App />);

		expect(
			screen.getByRole("button", { name: "Copy link" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Menu" }),
		).not.toBeInTheDocument();
	});

	it("connects each view tab to its tab panel", async () => {
		const user = userEvent.setup();
		render(<App />);

		const pairs = [
			["Schedule", "schedule-tab", "schedule-panel"],
			["Results", "results-tab", "results-panel"],
			["Medals", "medals-tab", "medals-panel"],
		] as const;

		for (const [label, tabId, panelId] of pairs) {
			const tab = screen.getByRole("tab", { name: label });
			const panel = document.getElementById(panelId);

			expect(tab).toHaveAttribute("aria-controls", panelId);
			expect(panel).toHaveAttribute("role", "tabpanel");
			expect(panel).toHaveAttribute("aria-labelledby", tabId);
		}

		expect(screen.getByRole("tabpanel")).toHaveAttribute(
			"id",
			"schedule-panel",
		);

		await user.click(screen.getByRole("tab", { name: "Results" }));

		expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "results-panel");
	});

	it("names the alert dialog and opens it as a modal", async () => {
		const user = userEvent.setup();
		const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Manage alerts" }));

		const dialog = screen.getByRole("dialog", { name: "Alert preferences" });
		expect(dialog.tagName).toBe("DIALOG");
		expect(dialog).toHaveAttribute("open");
		expect(showModal).toHaveBeenCalled();
		expect(
			screen.getByRole("checkbox", { name: "Heat changes" }),
		).toHaveFocus();

		showModal.mockRestore();
	});

	it("closes alert preferences from the dialog cancel event", async () => {
		const user = userEvent.setup();
		render(<App />);

		await user.click(screen.getByRole("button", { name: "Manage alerts" }));
		const dialog = screen.getByRole("dialog", { name: "Alert preferences" });

		fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));

		expect(
			screen.queryByRole("dialog", { name: "Alert preferences" }),
		).not.toBeInTheDocument();
	});

	it("returns focus to Manage alerts when alert preferences close", async () => {
		const user = userEvent.setup();
		render(<App />);

		const manageAlerts = screen.getByRole("button", { name: "Manage alerts" });
		await user.click(manageAlerts);
		await user.click(screen.getByRole("button", { name: "Close" }));

		expect(manageAlerts).toHaveFocus();
	});

	it("uses a visible light-theme border on chips, cards, and the dialog", async () => {
		const user = userEvent.setup();
		render(<App />);

		expect(pandaStyles).toContain("--colors-border-primary: #7a8091;");
		expect(pandaStyles).toContain("--colors-border-secondary: #7a8091;");

		const chip = screen.getByRole("button", { name: "Live only" });
		const card = screen.getByRole("heading", { name: "Heat 1" }).closest("li");
		if (card === null) {
			throw new Error("Expected Heat 1 to sit in a session card");
		}

		expect(chip.className).toContain("bd-c_border.primary");
		expect(card.className).toContain("bd-c_border.secondary");

		await user.click(screen.getByRole("button", { name: "Manage alerts" }));
		expect(
			screen.getByRole("dialog", { name: "Alert preferences" }).className,
		).toContain("bd-c_border.secondary");
	});
});
