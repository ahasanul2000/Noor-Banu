// Ported from the Laravel app's tests/Feature/AccountTest.php.
import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createAdmin, db, get, insert, one, post, put, resetDb } from "./helpers.mjs";

beforeEach(resetDb);
after(() => db.end());

const register = (overrides = {}) =>
    post("/api/auth/register", {
        name: "Rahima",
        phone: "+880 1712-345678",
        password: "secret123",
        password_confirmation: "secret123",
        ...overrides,
    });

describe("customer accounts", () => {
    test("register, login and profile", async () => {
        let res = await register();
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.phone, "01712345678");
        assert.ok(res.body.token);

        res = await register({ email: "x@example.com" });
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.phone);

        res = await post("/api/auth/login", { login: "01712345678", password: "secret123" });
        assert.equal(res.status, 200);
        const token = res.body.token;

        res = await post("/api/auth/login", { login: "01712345678", password: "wrong" });
        assert.equal(res.status, 422);

        res = await put("/api/account", {
            name: "Rahima Begum", phone: "01712345678", address: "Road 2", city: "Dhaka", shipping_area: "inside_dhaka",
        }, { token });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.city, "Dhaka");

        assert.equal((await get("/api/account")).status, 401);
        assert.equal((await get("/api/account", { token: "1|not-a-real-token" })).status, 401);
    });

    test("orders placed while logged in appear in history", async () => {
        const token = (await register()).body.token;
        const category = await insert("categories", { name: "Sarees", slug: "sarees" });
        const product = await insert("products", { category_id: category.id, name: "Saree", slug: "saree", price: 1000, stock: 5 });
        const order = {
            customer_name: "Rahima", customer_phone: "01712345678", shipping_address: "Road 2",
            city: "Dhaka", shipping_area: "inside_dhaka",
            items: [{ product_id: product.id, quantity: 1 }],
        };
        assert.equal((await post("/api/orders", order, { token })).status, 201);
        assert.equal((await post("/api/orders", order)).status, 201); // guest

        const res = await get("/api/account/orders", { token });
        assert.equal(res.status, 200);
        assert.equal(res.body.meta.total, 1);
        assert.equal(res.body.data[0].order_number, "NB000001");
    });

    test("staff can't sign in to the storefront", async () => {
        await createAdmin("a@example.com", "secret123");
        const res = await post("/api/auth/login", { login: "a@example.com", password: "secret123" });
        assert.equal(res.status, 422);
    });

    test("customer cannot mass-assign the admin flag", async () => {
        assert.equal((await register({ is_admin: true })).status, 201);
        assert.equal((await one("SELECT is_admin FROM users WHERE phone = '01712345678'")).is_admin, false);
    });

    test("changing the password signs out other devices", async () => {
        const first = (await register()).body.token;
        const second = (await post("/api/auth/login", { login: "01712345678", password: "secret123" })).body.token;

        let res = await put("/api/account/password", { current_password: "nope", password: "newpass1", password_confirmation: "newpass1" }, { token: second });
        assert.equal(res.status, 422);

        res = await put("/api/account/password", { current_password: "secret123", password: "newpass1", password_confirmation: "newpass1" }, { token: second });
        assert.equal(res.status, 200);
        assert.equal((await get("/api/account", { token: second })).status, 200);
        assert.equal((await get("/api/account", { token: first })).status, 401);
        assert.equal((await post("/api/auth/login", { login: "01712345678", password: "newpass1" })).status, 200);
    });

    test("logout revokes the token", async () => {
        const token = (await register()).body.token;
        assert.equal((await post("/api/auth/logout", undefined, { token })).status, 200);
        assert.equal((await get("/api/account", { token })).status, 401);
    });

    test("imported Laravel ($2y$) password hashes still work", async () => {
        // bcrypt hash of "password" produced by PHP's password_hash().
        await insert("users", {
            name: "Old Customer", phone: "01912345678",
            password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
        });
        const res = await post("/api/auth/login", { login: "01912345678", password: "password" });
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
});
