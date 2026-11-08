/**
 * Fill every section with realistic demo content for showing the store to a client:
 * products, category photos, blog posts, testimonials, lookbook, Instagram posts, a hero slide,
 * coupons, customers, subscribers and ~30 orders spread over the last 30 days.
 *
 *   node scripts/seed-demo.mjs                 # uses DATABASE_URL
 *
 * It only ADDS rows (existing data is kept) and runs once per database: it records a
 * `demo_seeded` site setting and stops if that is already there.
 * Images are stored as "demo/<file>" paths (public/uploads/demo). For the live site, run
 * `npm run db:images-to-blob` afterwards to move them to Vercel Blob.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const all = async (sql, params = []) => (await db.query(sql, params)).rows;

if (await one("SELECT 1 FROM site_settings WHERE key = 'demo_seeded'")) {
    console.log("Demo data is already in this database — nothing to do.");
    await db.end();
    process.exit(0);
}

// Deterministic "random" so every run produces the same demo.
let seed = 20261108;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pickOne = (list) => list[Math.floor(rand() * list.length)];
// Most demo photos are 1200px wide; these few only exist in another size.
const SIZE = { 13661845: 800, 28316406: 800, 37628619: 800, 7326221: 800, 12791932: 1400, 22064201: 1400 };
const img = (id) => `demo/pexels-${id}-${SIZE[id] ?? 1200}.jpg`;
const DAY = 86400_000;

async function insert(table, row) {
    const cols = Object.keys(row);
    const values = cols.map((c) => (row[c] !== null && typeof row[c] === "object" && !(row[c] instanceof Date) ? JSON.stringify(row[c]) : row[c]));
    return one(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`, values);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

await db.query("BEGIN");
try {
    // ---------- Categories: real photos instead of placeholders ----------
    const categories = Object.fromEntries((await all("SELECT id, slug FROM categories")).map((c) => [c.slug, c.id]));
    const categoryPhotos = {
        sarees: [img(20161456), "Handwoven Jamdani, Muslin, Katan and Rajshahi silk."],
        "three-piece": [img(20407198), "Everyday lawn, cotton and embroidered three pieces."],
        kurtis: [img(33824984), "Easy kurtis for work, campus and Friday prayers."],
        lehengas: [img(12791932), "Bridal and party lehengas, made to be remembered."],
    };
    for (const [slug, [image, description]] of Object.entries(categoryPhotos)) {
        if (categories[slug]) {
            await db.query("UPDATE categories SET image = $1, description = COALESCE(description, $2), updated_at = now() WHERE id = $3", [image, description, categories[slug]]);
        }
    }

    // ---------- Products ----------
    const sizes = (spec) => spec.split(" ").map((p) => {
        const [size, stock] = p.split(":");
        return { size, stock: Number(stock) };
    });
    const CARE = {
        sarees: ["Handwoven in Bangladesh", "Dry clean recommended", "Comes with an unstitched blouse piece"],
        lehengas: ["Lehenga, blouse and dupatta included", "Can-can lining for full flare", "Dry clean only"],
        "three-piece": ["Kameez, salwar and dupatta", "Gentle machine wash, cold", "Colour may vary slightly due to lighting"],
        kurtis: ["Breathable cotton blend", "Gentle machine wash, cold", "Pairs with jeans or palazzo"],
    };
    const PRODUCTS = [
        // name, category, price, sale, images, stock|sizes, colours, badge, featured, trending, description
        ["Lavender Tissue Jamdani", "sarees", 7800, null, [28058186], 9, ["Lavender"], "New", false, true, "A feather-light tissue Jamdani in soft lavender with silver motifs woven by hand in Rupganj."],
        ["Midnight Navy Tant Saree", "sarees", 3400, 2950, [28316406], 14, ["Navy", "Red"], null, false, true, "Crisp Tangail tant cotton in midnight navy with a bold red border — made for long summer days."],
        ["Black Gold Katan Silk Saree", "sarees", 11500, null, [30004204, 29172782], 6, ["Black"], "Bestseller", true, false, "Rich black Katan silk with a gold zari pallu. An evening classic that never dates."],
        ["Golden Ivory Benarasi", "sarees", 14800, 12900, [37054322], 4, ["Ivory", "Gold"], "Festive", true, true, "Ivory Benarasi with an all-over golden weave — our pick for Eid and holud evenings."],
        ["Crimson Georgette Saree", "sarees", 4200, null, [37880205], 11, ["Red"], null, false, false, "Flowing crimson georgette with delicate sequin work along the border."],
        ["Magenta Rajshahi Silk", "sarees", 8900, null, [7326221], 7, ["Magenta", "Green"], "New", false, true, "Pure Rajshahi silk in a jewel magenta with a contrasting green anchal."],
        ["Silver Grey Muslin", "sarees", 10200, null, [7516956], 3, ["Silver"], "Limited", true, false, "Revived Dhakai muslin in moonlit silver — so fine it folds into a handbag."],
        ["Classic Maroon Chiffon", "sarees", 3900, 3400, [11629757], 12, ["Maroon"], null, false, false, "An easy-drape maroon chiffon for office parties and dawats."],
        ["Rose Pink Mirror-work Lehenga", "lehengas", 18500, 16500, [37628608, 37628619], "S:2 M:3 L:2", ["Pink"], "Bestseller", true, true, "Rose pink lehenga covered in hand-set mirror work, with a sheer net dupatta."],
        ["Mustard Garden Lehenga", "lehengas", 12500, null, [16651974], "S:3 M:4 L:2", ["Mustard"], null, false, true, "Sunny mustard lehenga printed with a garden of florals — perfect for gaye holud."],
        ["Ivory Pearl Lehenga", "lehengas", 21000, null, [16125951], "S:1 M:2 L:1", ["Ivory"], "Limited", true, false, "Ivory lehenga with pearl and sequin embroidery for reception nights."],
        ["Crimson Bridal Lehenga", "lehengas", 38000, null, [34345410, 13661845, 12792004], "S:1 M:2 L:1", ["Red"], "Bridal", true, true, "Our signature bridal lehenga in crimson with zardozi, dabka and a double dupatta."],
        ["Blush Pink Bridal Lehenga", "lehengas", 32000, 29500, [13022537], "S:1 M:1 L:1", ["Blush Pink"], "Bridal", true, false, "Soft blush bridal lehenga with silver threadwork for a modern bride."],
        ["Royal Magenta Lehenga", "lehengas", 16800, 14900, [12062663], "S:2 M:3 L:2", ["Magenta"], null, false, false, "Royal magenta lehenga with a gota-patti border and organza dupatta."],
        ["Mint Chikankari Three Piece", "three-piece", 4200, null, [20407198], "S:4 M:6 L:5 XL:2", ["Mint"], "New", false, true, "Mint georgette three piece with Lucknowi chikankari and a printed chiffon dupatta."],
        ["Lemon Lawn Three Piece", "three-piece", 3600, 3200, [20407233], "S:5 M:8 L:6 XL:3", ["Lemon"], "New", false, false, "Cool lemon lawn with tonal embroidery — summer's favourite."],
        ["Teal Floral Three Piece", "three-piece", 3900, null, [20690508, 20690513], "S:6 M:9 L:7 XL:4", ["Teal"], null, true, true, "Teal cotton printed with blooming florals, finished with lace trims."],
        ["Indigo Print Three Piece", "three-piece", 3500, null, [20690516], "S:5 M:7 L:6 XL:3", ["Indigo"], null, false, false, "Indigo block print on soft cotton with a white dupatta."],
        ["Rose Garden Three Piece", "three-piece", 3700, 3300, [20690519], "S:4 M:6 L:4 XL:2", ["White", "Pink"], null, false, true, "Ivory cotton with a rose garden print and a soft pink dupatta."],
        ["Olive Green Embroidered Three Piece", "three-piece", 4600, null, [22064201], "S:3 M:5 L:4 XL:2", ["Olive"], "Bestseller", true, false, "Olive green with dense floral embroidery on the yoke and sleeves."],
        ["Maroon Velvet Three Piece", "three-piece", 6900, null, [34933700], "S:2 M:4 L:3 XL:1", ["Maroon"], "Winter", false, true, "Plush maroon velvet with an embroidered organza dupatta for winter weddings."],
        ["Lavender Lucknowi Three Piece", "three-piece", 5200, 4700, [36634909], "S:3 M:5 L:4 XL:2", ["Lavender"], null, false, false, "Lavender Lucknowi three piece with tiny mirror accents."],
        ["Powder Blue Three Piece", "three-piece", 3800, null, [20791992], "S:4 M:6 L:5 XL:3", ["Powder Blue"], null, false, false, "Powder blue cotton with white embroidery and a matching dupatta."],
        ["Rust Embroidered Kurti", "kurtis", 2200, 1890, [20777176], "S:5 M:8 L:7 XL:4 XXL:2", ["Rust"], null, false, true, "Rust kurti with self embroidery — pair with the matching dupatta or jeans."],
        ["Navy Printed Kurti Set", "kurtis", 2600, null, [34368242], "S:4 M:6 L:5 XL:3", ["Navy"], "New", false, false, "Navy printed kurti with palazzo — easy weekend comfort."],
        ["Beige Floral Kurti", "kurtis", 1950, null, [20690539], "S:6 M:8 L:6 XL:4", ["Beige"], null, false, false, "Beige floral kurti in breathable cotton for everyday wear."],
    ];

    const products = {};
    let sku = 1001;
    for (const [i, [name, cat, price, sale, ids, stockSpec, colors, badge, featured, trending, description]] of PRODUCTS.entries()) {
        if (!categories[cat]) continue;
        const slug = slugify(name);
        if (await one("SELECT 1 FROM products WHERE slug = $1", [slug])) continue;
        const images = ids.map((id) => img(id));
        const row = await insert("products", {
            category_id: categories[cat], name, slug, sku: `NB-${sku++}`, description,
            price, sale_price: sale, stock: typeof stockSpec === "number" ? stockSpec : 0,
            variants: typeof stockSpec === "string" ? sizes(stockSpec) : [],
            colors: colors.map((c) => ({ name: c })), badge, image: images[0], gallery: images,
            details: CARE[cat].map((info) => ({ info })),
            is_active: true, is_featured: featured, is_trending: trending, sort_order: 10 + i,
            created_at: new Date(Date.now() - (60 - i) * DAY),
        });
        products[name] = row;
    }

    // ---------- Hero slide ----------
    await insert("hero_slides", {
        title: "Wedding Season, Woven In Gold", highlight: "Gold",
        subtitle: "Bridal lehengas and Benarasi sarees, hand-finished in Dhaka and delivered across Bangladesh.",
        image: img(13022612), button_text: "Shop Bridal", button_link: "/shop?category=lehengas", sort_order: 5, is_active: true,
    });

    // ---------- Testimonials ----------
    const TESTIMONIALS = [
        ["Nusrat Jahan", "Dhanmondi, Dhaka", "Wore the Crimson Bridal Lehenga for my wedding — everyone asked where it was from. The embroidery is even better in person.", 5],
        ["Farzana Akter", "Chattogram", "Ordered two three pieces for Eid. Delivery took two days and the fabric is so soft. Already planning my next order!", 5],
        ["Tasnim Rahman", "Sylhet", "The Jamdani is truly handwoven, you can feel it. Cash on delivery made it easy to trust a new shop.", 4],
    ];
    for (const [i, [name, role, content, rating]] of TESTIMONIALS.entries()) {
        await insert("testimonials", { name, role, content, rating, sort_order: 10 + i, is_active: true });
    }

    // ---------- Lookbook ----------
    const LOOKS = [
        ["The Bridal Story", "Crimson Bridal Lehenga", img(12792004)],
        ["Holud Afternoon", "Mustard Garden Lehenga", img(16651974)],
        ["Summer in Lawn", "Teal Floral Three Piece", img(20690513)],
        ["Evening in Katan", "Black Gold Katan Silk Saree", img(29172782)],
    ];
    for (const [i, [title, productName, image]] of LOOKS.entries()) {
        await insert("lookbooks", { title, image, product_id: products[productName]?.id ?? null, sort_order: 10 + i, is_active: true });
    }

    // ---------- Instagram ----------
    for (const [i, id] of [20690519, 37628619, 14205210, 17113983, 13022612, 20407233].entries()) {
        await insert("instagram_posts", { image: img(id), caption: `Noor Banu style #${10 + i}`, link: "https://instagram.com/NoorBanuDhaka", sort_order: 10 + i, is_active: true });
    }

    // ---------- Blog ----------
    const BLOGS = [
        ["How to Spot a Real Dhakai Jamdani", img(28058186), `
<p>A real Jamdani is woven by hand on a pit loom, one motif at a time. Here is how to tell it apart from a machine copy.</p>
<h2>1. Look at the back</h2>
<p>Hand-woven motifs look almost the same on both sides, with tiny loose threads at the edges of each motif. Machine prints are flat on the back.</p>
<h2>2. Feel the weight</h2>
<p>Traditional Jamdani is light and airy. If it feels heavy or stiff, it is probably mixed with synthetic yarn.</p>
<h2>3. Ask about the weaver</h2>
<p>Every Noor Banu Jamdani comes from weaving families in Rupganj and Sonargaon. We are happy to tell you who wove yours.</p>
<blockquote>A good Jamdani takes from two weeks to six months to weave. That patience is what you are wearing.</blockquote>`],
        ["Eid Styling Guide: Three Looks, One Wardrobe", img(20690508), `
<p>Eid means three days of visits, dawats and photos. You don't need nine new outfits — just three good pieces you can mix.</p>
<h2>Day one: fresh and light</h2>
<p>Start with a lawn or cotton three piece in a pastel. Our <a href="/shop?category=three-piece">Teal Floral</a> and <a href="/shop?category=three-piece">Lemon Lawn</a> stay cool through a long afternoon.</p>
<h2>Day two: the saree day</h2>
<p>A soft silk or georgette saree with simple jewellery. Let the colour do the talking.</p>
<h2>Day three: evening glamour</h2>
<p>Save the embroidery and velvet for the evening dawat. A statement dupatta can change the whole look.</p>
<ul><li>Keep one pair of neutral heels for all three days</li><li>Steam, don't iron, your embroidered pieces</li><li>Pack a spare safety-pin kit!</li></ul>`],
        ["Caring for Silk and Embroidered Pieces", img(37054322), `
<p>Good clothes last for generations when they are looked after. A few simple habits make all the difference.</p>
<h2>Storing</h2>
<ul><li>Wrap silk sarees in plain cotton or muslin, never plastic</li><li>Refold every few months so the creases don't weaken the fibre</li><li>Keep a few neem leaves or cloves in the cupboard instead of naphthalene</li></ul>
<h2>Cleaning</h2>
<p>Dry clean silk, Benarasi and heavy embroidery. For cotton three pieces, wash inside out in cold water and dry in the shade.</p>
<h2>Ironing</h2>
<p>Iron silk on the reverse with a cloth in between, and never iron directly on zari or sequins.</p>`],
        ["Choosing Your Bridal Lehenga", img(34345410), `
<p>Your wedding lehenga is the outfit you will look back on most. Here is what our stylists tell every bride.</p>
<h2>Start with the venue</h2>
<p>Outdoor day ceremonies suit lighter fabrics and pastel shades. Grand evening receptions can carry deep reds, maroons and heavy zardozi.</p>
<h2>Mind the weight</h2>
<p>A fully worked bridal lehenga can weigh 8–10 kg. Try walking and sitting in it before you decide.</p>
<h2>Plan the dupatta</h2>
<p>A double dupatta — one on the head, one draped — gives beautiful photos. Ask us about matching the second dupatta to the groom's sherwani.</p>
<p>Book a fitting at our Gulshan studio or message us on WhatsApp for a video consultation.</p>`],
    ];
    for (const [i, [title, thumbnail, content]] of BLOGS.entries()) {
        const slug = slugify(title);
        if (await one("SELECT 1 FROM blogs WHERE slug = $1", [slug])) continue;
        await insert("blogs", { title, slug, thumbnail, content: content.trim(), created_at: new Date(Date.now() - (40 - i * 9) * DAY) });
    }

    // ---------- Coupons ----------
    const COUPONS = [
        { code: "EID25", type: "percent", value: 25, min_order_amount: 5000, max_discount: 1500, usage_limit: 200, is_active: true, expires_at: new Date(Date.now() + 45 * DAY) },
        { code: "BRIDAL5000", type: "fixed", value: 5000, min_order_amount: 30000, max_discount: null, usage_limit: 50, is_active: true },
        { code: "PUJA15", type: "percent", value: 15, min_order_amount: 3000, max_discount: 1000, usage_limit: null, is_active: true, expires_at: new Date(Date.now() - 10 * DAY) },
    ];
    for (const c of COUPONS) {
        if (!(await one("SELECT 1 FROM coupons WHERE code = $1", [c.code]))) await insert("coupons", c);
    }

    // ---------- Customers ----------
    const password = await bcrypt.hash("demo1234", 10);
    const CUSTOMERS = [
        ["Nusrat Jahan", "01711000101", "nusrat@example.com", "House 12, Road 7, Dhanmondi", "Dhaka", "inside_dhaka"],
        ["Farzana Akter", "01811000202", "farzana@example.com", "45 GEC Circle", "Chattogram", "outside_dhaka"],
        ["Tasnim Rahman", "01911000303", null, "Zindabazar Main Road", "Sylhet", "outside_dhaka"],
        ["Sadia Islam", "01611000404", "sadia@example.com", "Flat 3B, Road 11, Banani", "Dhaka", "inside_dhaka"],
        ["Mehjabin Chowdhury", "01511000505", "mehjabin@example.com", "Sector 7, Uttara", "Dhaka", "inside_dhaka"],
        ["Rumana Haque", "01311000606", null, "Shaheb Bazar", "Rajshahi", "outside_dhaka"],
        ["Lamia Sultana", "01711000707", "lamia@example.com", "Mirpur DOHS", "Dhaka", "inside_dhaka"],
        ["Anika Tabassum", "01811000808", "anika@example.com", "KDA Avenue", "Khulna", "outside_dhaka"],
    ];
    const customers = [];
    for (const [i, [name, phone, email, address, city, area]] of CUSTOMERS.entries()) {
        let user = await one("SELECT * FROM users WHERE phone = $1", [phone]);
        if (!user) {
            user = await insert("users", { name, phone, email, password, address, city, shipping_area: area, is_admin: false, created_at: new Date(Date.now() - (50 - i * 4) * DAY) });
        }
        customers.push(user);
    }

    // ---------- Subscribers ----------
    for (const email of ["shopper.dhaka@example.com", "eid.lover@example.com", "jamdani.fan@example.com", "bride2027@example.com", "style.ctg@example.com", "silk.sylhet@example.com"]) {
        if (!(await one("SELECT 1 FROM subscribers WHERE email = $1", [email]))) await insert("subscribers", { email });
    }

    // ---------- Orders (last 30 days) ----------
    const settings = Object.fromEntries((await all("SELECT key, value FROM site_settings")).map((s) => [s.key, s.value]));
    const inside = Number(settings.shipping_inside_dhaka || 70);
    const outside = Number(settings.shipping_outside_dhaka || 130);
    const freeOver = Number(settings.free_shipping_threshold || 0);
    const productRows = await all("SELECT * FROM products WHERE is_active = true AND category_id IN (SELECT id FROM categories WHERE is_active)");
    const guests = [
        ["Sharmin Akter", "01722000111", "Road 3, Mohammadpur", "Dhaka", "inside_dhaka"],
        ["Jannatul Ferdous", "01822000222", "Kazir Dewri", "Chattogram", "outside_dhaka"],
        ["Moumita Das", "01922000333", "Tilagor", "Sylhet", "outside_dhaka"],
        ["Rifat Ara", "01622000444", "Bashundhara R/A, Block C", "Dhaka", "inside_dhaka"],
        ["Shirin Sultana", "01522000555", "Station Road", "Rangpur", "outside_dhaka"],
    ];
    const finalPrice = (p) => (p.sale_price !== null && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price) : Number(p.price));

    // Older orders are mostly delivered; the newest ones still need action.
    const statusFor = (daysAgo) => {
        if (daysAgo < 1) return pickOne(["pending", "pending", "confirmed"]);
        if (daysAgo < 3) return pickOne(["pending", "confirmed", "processing"]);
        if (daysAgo < 6) return pickOne(["processing", "shipped", "shipped"]);
        return pickOne(["delivered", "delivered", "delivered", "delivered", "shipped", "cancelled", "returned"]);
    };

    let ordersMade = 0;
    for (let n = 0; n < 30; n++) {
        const daysAgo = Math.floor(rand() ** 1.4 * 29); // more orders in recent days
        const createdAt = new Date(Date.now() - daysAgo * DAY - Math.floor(rand() * 10) * 3600_000);
        const status = statusFor(daysAgo);
        const asCustomer = rand() < 0.55;
        const c = asCustomer ? pickOne(customers) : null;
        const [name, phone, address, city, area] = c ? [c.name, c.phone, c.address, c.city, c.shipping_area] : pickOne(guests);

        // 1–3 lines; bridal pieces are rare.
        const lines = [];
        const count = 1 + Math.floor(rand() * rand() * 3);
        for (let k = 0; k < count; k++) {
            let p = pickOne(productRows);
            if (Number(p.price) > 20000 && rand() < 0.7) p = pickOne(productRows.filter((x) => Number(x.price) < 9000));
            const qty = rand() < 0.85 ? 1 : 2;
            // Never sell the last piece: the demo shop shouldn't fill up with "sold out" cards.
            const hasSizes = Array.isArray(p.variants) && p.variants.length > 0;
            const variants = hasSizes ? p.variants.filter((v) => v.stock > qty) : [];
            if (hasSizes && !variants.length) continue;
            if (!hasSizes && p.stock <= qty) continue;
            const size = hasSizes ? pickOne(variants).size : null;
            const color = Array.isArray(p.colors) && p.colors.length ? pickOne(p.colors).name : null;
            const unit = finalPrice(p);
            lines.push({ p, size, color, qty, unit, total: unit * qty });
        }
        if (!lines.length) continue;

        const subtotal = lines.reduce((s, l) => s + l.total, 0);
        let coupon = null;
        let discount = 0;
        if (subtotal >= 5000 && rand() < 0.3) {
            coupon = "EID25";
            discount = Math.min(subtotal * 0.25, 1500);
        } else if (subtotal >= 1000 && rand() < 0.2) {
            coupon = "WELCOME10";
            discount = subtotal * 0.1;
        }
        discount = Math.round(discount * 100) / 100;
        const shipping = freeOver > 0 && subtotal - discount >= freeOver ? 0 : area === "outside_dhaka" ? outside : inside;
        const total = Math.max(0, subtotal - discount) + shipping;

        const order = await insert("orders", {
            user_id: c?.id ?? null, customer_name: name, customer_phone: phone, customer_email: c?.email ?? null,
            shipping_address: address, city, shipping_area: area,
            note: rand() < 0.2 ? pickOne(["Please call before delivery.", "Gift wrap please 🎁", "Deliver after 5 pm."]) : null,
            admin_note: ["shipped", "delivered"].includes(status) ? `Steadfast tracking SF${100000 + n * 37}` : null,
            subtotal, discount, shipping_cost: shipping, total, coupon_code: coupon,
            payment_method: "cod", payment_status: status === "delivered" ? "paid" : status === "returned" ? "refunded" : "unpaid",
            status, created_at: createdAt, updated_at: createdAt,
        });
        await db.query("UPDATE orders SET order_number = $1 WHERE id = $2", [`NB${String(order.id).padStart(6, "0")}`, order.id]);

        for (const l of lines) {
            await insert("order_items", {
                order_id: order.id, product_id: l.p.id, product_name: l.p.name, product_image: l.p.image,
                size: l.size, color: l.color, unit_price: l.unit, quantity: l.qty, line_total: l.total,
                created_at: createdAt, updated_at: createdAt,
            });
            // Live orders hold stock; cancelled/returned ones gave it back.
            if (!["cancelled", "returned"].includes(status)) {
                if (l.size) {
                    l.p.variants = l.p.variants.map((v) => (v.size === l.size ? { ...v, stock: Math.max(0, v.stock - l.qty) } : v));
                    await db.query("UPDATE products SET variants = $1 WHERE id = $2", [JSON.stringify(l.p.variants), l.p.id]);
                } else {
                    l.p.stock = Math.max(0, l.p.stock - l.qty);
                    await db.query("UPDATE products SET stock = $1 WHERE id = $2", [l.p.stock, l.p.id]);
                }
            }
        }
        if (coupon) await db.query("UPDATE coupons SET used_count = used_count + 1 WHERE code = $1", [coupon]);
        ordersMade++;
    }

    await insert("site_settings", { key: "demo_seeded", value: new Date().toISOString(), type: "text" });
    await db.query("COMMIT");
    console.log(`Demo data added: ${Object.keys(products).length} products, ${BLOGS.length} blog posts, ${customers.length} customers, ${ordersMade} orders, plus testimonials, lookbook, Instagram, coupons and a hero slide.`);
} catch (error) {
    await db.query("ROLLBACK");
    console.error("Seeding failed, nothing was changed:", error.message);
    process.exitCode = 1;
} finally {
    await db.end();
}
