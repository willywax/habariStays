import React, { act } from "react";
import { createRoot } from "react-dom/client";
import AdminPasswordReset from "./AdminPasswordReset";
import { api } from "../App";
import { toast } from "sonner";
jest.mock("../App", () => ({ api: { post: jest.fn() } }));
jest.mock("sonner", () => ({ toast: { success: jest.fn() } }));
let root, container, close;
const fill = async (id, value) => { await act(async () => {
 const input = document.getElementById(id);
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
 input.dispatchEvent(new Event("input", { bubbles: true }));
}); };
const submit = async () => { await act(async () => document.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); };
beforeEach(async () => {
 global.IS_REACT_ACT_ENVIRONMENT = true;
 api.post.mockReset().mockResolvedValue({data:{message:"Password updated"}});
 toast.success.mockClear(); close=jest.fn();
 container=document.createElement("div");document.body.appendChild(container);root=createRoot(container);
 await act(async () => root.render(<AdminPasswordReset user={{id:"u1",full_name:"Test User"}} onClose={close} />));
});
afterEach(async () => { await act(async () => root.unmount());container.remove(); });
test("validates matching passwords before making a request", async () => {
 await fill("admin-new-password","NewSecure123"); await fill("admin-confirm-password","Different123"); await submit();
 expect(api.post).not.toHaveBeenCalled();expect(document.querySelector('[role="alert"]').textContent).toBe("Passwords do not match.");
});
test("updates the selected user, shows success, and closes", async () => {
 expect(document.body.textContent).toContain("Reset password for Test User");
 await fill("admin-new-password","NewSecure123");await fill("admin-confirm-password","NewSecure123");await submit();
 expect(api.post).toHaveBeenCalledWith("/admin/users/u1/reset-password",{new_password:"NewSecure123"});
 expect(toast.success).toHaveBeenCalledWith("Password updated");expect(close).toHaveBeenCalledTimes(1);
});
test("keeps API errors in the modal and allows retry", async () => {
 api.post.mockRejectedValueOnce({response:{data:{detail:"User not found"}}});
 await fill("admin-new-password","NewSecure123");await fill("admin-confirm-password","NewSecure123");await submit();
 expect(document.querySelector('[role="alert"]').textContent).toBe("User not found");expect(close).not.toHaveBeenCalled();
 await submit();expect(close).toHaveBeenCalledTimes(1);
});
test("show/hide changes visibility without losing entered text", async () => {
 await fill("admin-new-password","NewSecure123");
 await act(async () => document.querySelector('[aria-label="Show password"]').click());
 expect(document.getElementById("admin-new-password").type).toBe("text");
 expect(document.getElementById("admin-new-password").value).toBe("NewSecure123");
 expect(document.getElementById("admin-confirm-password").type).toBe("password");
});
