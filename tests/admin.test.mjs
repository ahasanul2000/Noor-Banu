// Admin panel: sign-in, pages, order status (incl. restocking) and the generic editors.
// Ported from the Laravel app's tests/Feature/AdminOrderTest.php, plus the new editors.
import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { BASE_URL, call, createAdmin, db, get, insert, one, post, resetDb } from "./helpers.mjs";

beforeEach(resetDb);
after(() => db.end());

async function signIn(email = "admin@example.com", password = "secret123") {
    const res = await post("/api/admin/login", { email, password });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const cookie = res.headers.get("set-cookie").split(";")[0];
    return cookie;
}

async function adminSession() {
    await createAdmin();
    return signIn();
}

async function seedOrder() {
    const category = await insert("categories", { name: "Sarees", slug: "sarees" });
    const product = await insert("products", { category_id: category.id, name: "Saree", slug: "saree", price: 1000, stock: 3 });
    const res = await post("/api/orders", {
        customer_name: "Rahima", customer_phone: "01712345678", shipping_address: "Road 2",
        city: "Dhaka", shipping_area: "inside_dhaka",
        items: [{ product_id: product.id, quantity: 2 }],
    });
    assert.equal(res.status, 201);
    const order = await one("SELECT id FROM orders");
    return { product, order };
}

const stockOf = async (id) => (await one("SELECT stock FROM products WHERE id = $1", [id])).stock;

describe("admin access", () => {
    test("pages need an admin session", async () => {
        const res = await get("/admin/orders");
        assert.equal(res.status, 307);
        assert.match(res.headers.get("location"), /\/admin\/login$/);
        assert.equal((await post("/api/admin/products", { name: "x" })).status, 401);
    });

    test("customers and wrong passwords cannot sign in", async () => {
        await insert("users", { name: "C", email: "c@example.com", phone: "01812345678", password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi" });
        await createAdmin();
        assert.equal((await post("/api/admin/login", { email: "c@example.com", password: "password" })).status, 422);
        assert.equal((await post("/api/admin/login", { email: "admin@example.com", password: "nope" })).status, 422);
    });

    test("cross-site writes are refused", async () => {
        const cookie = await adminSession();
        const res = await fetch(`${BASE_URL}/api/admin/features`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "https://evil.example" },
            body: JSON.stringify({ title: "x", icon: "gem" }),
        });
        assert.equal(res.status, 403);
    });

    test("logout ends the session", async () => {
        const cookie = await adminSession();
        await call("POST", "/api/admin/logout", { cookie });
        assert.equal((await get("/admin", { cookie })).status, 307);
    });
});

describe("admin orders", () => {
    test("pages render and status updates restock on cancel", async () => {
        const cookie = await adminSession();
        const { product, order } = await seedOrder();
        assert.equal(await stockOf(product.id), 1);

        for (const page of ["/admin", "/admin/orders", "/admin/orders?status=pending", `/admin/orders/${order.id}`, `/admin/invoice/${order.id}`, "/admin/customers", "/admin/products"]) {
            assert.equal((await get(page, { cookie })).status, 200, page);
        }

        let res = await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { status: "confirmed" } });
        assert.equal(res.status, 200);
        res = await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { payment_status: "paid" } });
        assert.equal(res.status, 200);
        let row = await one("SELECT status, payment_status FROM orders WHERE id = $1", [order.id]);
        assert.deepEqual([row.status, row.payment_status], ["confirmed", "paid"]);

        await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { status: "cancelled" } });
        assert.equal(await stockOf(product.id), 3);
        // Cancelled -> returned keeps the stock as is (both are restocked statuses).
        await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { status: "returned" } });
        assert.equal(await stockOf(product.id), 3);
        // Reopening takes the stock again.
        await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { status: "pending" } });
        assert.equal(await stockOf(product.id), 1);

        res = await call("PATCH", `/api/admin/orders/${order.id}`, { cookie, body: { status: "bogus" } });
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.status);
    });
});

describe("admin editors", () => {
    test("products: slug, sizes and validation", async () => {
        const cookie = await adminSession();
        const category = await insert("categories", { name: "Kurtis", slug: "kurtis" });
        const base = { name: "Silk Kurti", category_id: category.id, price: "2500", image: "products/a.jpg", is_active: true };

        let res = await call("POST", "/api/admin/products", {
            cookie,
            body: { ...base, variants: [{ size: " M ", stock: "4" }, { size: "", stock: 9 }, { size: "M", stock: 1 }, { size: "L", stock: "-2" }] },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.slug, "silk-kurti");
        assert.deepEqual(res.body.data.variants, [{ size: "M", stock: 4 }, { size: "L", stock: 0 }]);

        // Same name again gets a unique slug.
        res = await call("POST", "/api/admin/products", { cookie, body: base });
        assert.equal(res.body.data.slug, "silk-kurti-2");

        res = await call("POST", "/api/admin/products", { cookie, body: { ...base, sale_price: "3000" } });
        assert.equal(res.status, 422);
        assert.equal(res.body.errors.sale_price[0], "Sale price must be lower than the regular price.");

        res = await call("POST", "/api/admin/products", { cookie, body: { ...base, slug: "silk-kurti" } });
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.slug);

        res = await call("POST", "/api/admin/products", { cookie, body: { name: "", price: "" } });
        assert.equal(res.status, 422);
        for (const field of ["name", "price", "category_id", "image"]) assert.ok(res.body.errors[field], field);

        // The new product shows up in the shop API with its computed fields.
        const shop = await get("/api/products/silk-kurti");
        assert.equal(shop.body.data.total_stock, 4);
        assert.equal(shop.body.data.final_price, 2500);
    });

    test("coupons: saved in capitals, percent capped at 100", async () => {
        const cookie = await adminSession();
        let res = await call("POST", "/api/admin/coupons", { cookie, body: { code: "eid20", type: "percent", value: "20", is_active: true } });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.code, "EID20");
        assert.equal(res.body.data.min_order_amount, 0);

        res = await call("POST", "/api/admin/coupons", { cookie, body: { code: "EID20", type: "percent", value: "10" } });
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.code);

        res = await call("POST", "/api/admin/coupons", { cookie, body: { code: "BIG", type: "percent", value: "150" } });
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.value);
    });

    test("update and delete, unknown sections 404", async () => {
        const cookie = await adminSession();
        let res = await call("POST", "/api/admin/features", { cookie, body: { title: "Free delivery", icon: "truck", is_active: true } });
        const id = res.body.data.id;
        res = await call("PUT", `/api/admin/features/${id}`, { cookie, body: { title: "Fast delivery", icon: "truck", is_active: false } });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.title, "Fast delivery");
        assert.equal((await get("/api/features")).body.data.length, 0); // inactive is hidden from the shop

        assert.equal((await call("DELETE", `/api/admin/features/${id}`, { cookie })).status, 200);
        assert.equal((await call("DELETE", `/api/admin/features/${id}`, { cookie })).status, 404);
        assert.equal((await call("POST", "/api/admin/users", { cookie, body: {} })).status, 404);
    });

    test("image upload stores the file and rejects non-images", async () => {
        const cookie = await adminSession();
        // 1×1 transparent PNG
        const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        let form = new FormData();
        form.append("file", new Blob([png], { type: "image/png" }), "dot.png");
        form.append("folder", "products");
        let res = await call("POST", "/api/admin/upload", { cookie, form });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.match(res.body.path, /^products\/.+\.png$/);
        const served = await fetch(`${BASE_URL}/uploads/${res.body.path}`);
        assert.equal(served.status, 200);

        form = new FormData();
        form.append("file", new Blob(["hello"], { type: "text/plain" }), "x.txt");
        form.append("folder", "products");
        res = await call("POST", "/api/admin/upload", { cookie, form });
        assert.equal(res.status, 422);

        form = new FormData();
        form.append("file", new Blob([png], { type: "image/png" }), "dot.png");
        form.append("folder", "../../etc");
        res = await call("POST", "/api/admin/upload", { cookie, form });
        assert.equal(res.status, 422);
    });
});
