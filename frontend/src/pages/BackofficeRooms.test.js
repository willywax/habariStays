import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { RoomTypesSection } from "./BackofficeDashboard";

jest.mock("../App", () => ({ api: {}, useAuth: jest.fn(), useLang: jest.fn() }));
jest.mock("../components/PhotoManager", () => () => null);
jest.mock("react-router-dom", () => ({ Link: "a" }), { virtual: true });
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

let root, container;
const room = { id: "room-1", name: "Standard", total_rooms: 1, price_per_night: 50000 };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

const openForm = async (mode) => {
  await act(async () => root.render(<RoomTypesSection hotelId="hotel-1" rooms={mode === "edit" ? [room] : []} onChange={jest.fn()} lang="en" />));
  await act(async () => container.querySelector(`[data-testid="${mode === "edit" ? "edit-room-room-1" : "add-room-type-btn"}"]`).click());
};
const change = async (input, value, caret) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    if (caret !== undefined) input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe.each(["add", "edit"])("%s room form", (mode) => {
  test.each([[0, "Deluxe Suite"], [1, "123"], [2, "75000"]])("input %s retains focus and DOM identity for every keystroke", async (index, text) => {
    await openForm(mode);
    const input = container.querySelectorAll("input")[index];
    input.focus();
    await change(input, "");
    expect(document.activeElement).toBe(input);
    for (let length = 1; length <= text.length; length++) {
      await change(input, text.slice(0, length));
      expect(document.activeElement).toBe(input);
      expect(container.querySelectorAll("input")[index]).toBe(input);
      expect(input.value).toBe(text.slice(0, length));
    }
  });

  test("room name preserves the caret when inserting in the middle", async () => {
    await openForm(mode);
    const input = container.querySelector("input");
    input.focus();
    await change(input, "Deluxe Room", 6);
    await change(input, "Deluxe Family Room", 13);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(13);
    expect(input.selectionEnd).toBe(13);
  });
});
