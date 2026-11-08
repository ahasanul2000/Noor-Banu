// Ported from the Laravel app's tests/Feature/CheckoutTest.php.
import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { db, get, insert, one, post, resetDb } from "./helpers.mjs";

let kurti;
let saree;

beforeEach(async () => {
    await resetDb();
    const category = await insert("categories", { name: "Kurtis", slug: "kurtis" });
    kurti = await insert("products", {
        category_id: category.id, name: "Kurti", slug: "kurti", price: 1000,
        variants: [{ size: "M", stock: 3 }, { size: "L", stock: 0 }],
    });
    saree = await insert("products", {
        category_id: category.id, name: "Saree", slug: "saree", price: 5000, sale_price: 4000, stock: 2,
        colors: [{ name: "Red" }],
    });
    for (const [key, value] of [["shipping_inside_dhaka", "70"], ["shipping_outside_dhaka", "130"], ["free_shipping_threshold", "5000"]]) {
        await insert("site_settings", { key, value });
    }
});

after(() => db.end());

const customer = (overrides = {}) => ({
    customer_name: "Rahima",
    customer_phone: "01712345678",
    shipping_address: "House 1, Road 2",
    city: "Dhaka",
    shipping_area: "outside_dhaka",
    ...overrides,
});

const sizeStock = async (id, size) => {
    const p = await one("SELECT variants, stock FROM products WHERE id = $1", [id]);
    return size ? p.variants.find((v) => v.size === size).stock : p.stock;
};

describe("checkout", () => {
    test("order is priced on the server and stock is reserved", async () => {
        const res = await post("/api/orders", customer({
            total: 1,
            items: [{ product_id: kurti.id, size: "M", quantity: 2, price: 1 }],
        }));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.subtotal, 2000);
        assert.equal(res.body.data.shipping_cost, 130);
        assert.equal(res.body.data.total, 2130);
        assert.equal(res.body.data.payment_method, "cod");
        assert.equal(await sizeStock(kurti.id, "M"), 1);
        assert.equal((await one("SELECT order_number FROM orders")).order_number, "NB000001");
    });

    test("sale price and free shipping threshold apply", async () => {
        const res = await post("/api/checkout/quote", {
            items: [{ product_id: saree.id, quantity: 2 }],
            shipping_area: "inside_dhaka",
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.subtotal, 8000);
        assert.equal(res.body.data.shipping_cost, 0);
        assert.equal(res.body.data.total, 8000);
    });

    test("cannot order more than stock or without a size", async () => {
        let res = await post("/api/orders", customer({ items: [{ product_id: kurti.id, size: "M", quantity: 4 }] }));
        assert.equal(res.status, 422);
        assert.ok(res.body.errors["items.0"]);

        res = await post("/api/orders", customer({ items: [{ product_id: kurti.id, size: "L", quantity: 1 }] }));
        assert.equal(res.status, 422);

        res = await post("/api/orders", customer({ items: [{ product_id: kurti.id, quantity: 1 }] }));
        assert.equal(res.status, 422);

        // Two lines for the same size can't jointly exceed stock either.
        res = await post("/api/orders", customer({
            items: [
                { product_id: kurti.id, size: "M", quantity: 2 },
                { product_id: kurti.id, size: "M", quantity: 2 },
            ],
        }));
        assert.equal(res.status, 422);

        assert.equal((await one("SELECT COUNT(*)::int AS n FROM orders")).n, 0);
        assert.equal(await sizeStock(kurti.id, "M"), 3);
    });

    test("coupon discount, minimum and usage limit", async () => {
        await insert("coupons", { code: "SAVE10", type: "percent", value: 10, min_order_amount: 1500, max_discount: 150, usage_limit: 1 });

        let res = await post("/api/checkout/quote", {
            items: [{ product_id: kurti.id, size: "M", quantity: 1 }],
            coupon_code: "SAVE10",
        });
        assert.equal(res.body.data.discount, 0);
        assert.equal(res.body.data.coupon_code, null);
        assert.match(res.body.data.coupon_error, /Minimum order amount/);

        res = await post("/api/orders", customer({ coupon_code: "save10", items: [{ product_id: kurti.id, size: "M", quantity: 2 }] }));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.discount, 150);
        assert.equal(res.body.data.total, 1980);

        res = await post("/api/orders", customer({ coupon_code: "SAVE10", items: [{ product_id: saree.id, quantity: 1 }] }));
        assert.equal(res.status, 422);
        assert.ok(res.body.errors.coupon_code);
        assert.equal((await one("SELECT used_count FROM coupons")).used_count, 1);
    });

    test("order tracking requires matching phone", async () => {
        const res = await post("/api/orders", customer({ items: [{ product_id: kurti.id, size: "M", quantity: 1 }] }));
        assert.equal(res.status, 201);

        let track = await get("/api/orders/track?order_number=nb000001&phone=%2B8801712345678");
        assert.equal(track.status, 200);
        assert.equal(track.body.data.status, "pending");
        assert.equal(track.body.data.admin_note, undefined);

        track = await get("/api/orders/track?order_number=NB000001&phone=01811111111");
        assert.equal(track.status, 404);
    });

    test("price filter uses the sale price", async () => {
        assert.equal((await get("/api/products?min_price=0")).body.data.length, 2);
        assert.equal((await get("/api/products?max_price=4500")).body.data.length, 2);
        const res = await get("/api/products?min_price=2000&max_price=4500");
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].name, "Saree");
    });

    test("inactive products are hidden", async () => {
        await db.query("UPDATE products SET is_active = false WHERE id = $1", [saree.id]);
        assert.equal((await get("/api/products")).body.data.length, 1);
        assert.equal((await get(`/api/products/${saree.id}`)).status, 404);
    });

    test("validation errors use the Laravel shape", async () => {
        const res = await post("/api/orders", customer({ customer_phone: "12345", items: [{ product_id: kurti.id, size: "M", quantity: 1 }] }));
        assert.equal(res.status, 422);
        assert.deepEqual(res.body.errors.customer_phone, ["Please enter a valid Bangladeshi mobile number (e.g. 01712345678)."]);
    });
});
