/**
 * Run: node generate-csv.js
 * Generates rista-products.csv with correct Shopify column alignment
 */

const fs = require("fs");

// Exact 57-column header from Shopify template with Handle header column
const HEADER = "Handle,Title,Description,Vendor,Product category,Type,Tags,Published on online store,Status,SKU,Barcode,Option1 name,Option1 value,Option1 Linked To,Option2 name,Option2 value,Option2 Linked To,Option3 name,Option3 value,Option3 Linked To,Price,Compare-at price,Cost per item,Charge tax,Tax code,Unit price total measure,Unit price total measure unit,Unit price base measure,Unit price base measure unit,Inventory tracker,Inventory quantity,Continue selling when out of stock,Weight value (grams),Weight unit for display,Requires shipping,Fulfillment service,Product image URL,Image position,Image alt text,Variant image URL,Gift card,SEO title,SEO description,Color (product.metafields.shopify.color-pattern),Google Shopping / Google product category,Google Shopping / Gender,Google Shopping / Age group,Google Shopping / Manufacturer part number (MPN),Google Shopping / Ad group name,Google Shopping / Ads labels,Google Shopping / Condition,Google Shopping / Custom product,Google Shopping / Custom label 0,Google Shopping / Custom label 1,Google Shopping / Custom label 2,Google Shopping / Custom label 3,Google Shopping / Custom label 4";

// Build a row as an array of exactly 57 values then join with commas
function row(
    handle, title, vendor, category, type, tags, published, status,
    sku, opt1name, opt1val, price,
    inventoryTracker, inventoryQty, requiresShipping, giftCard
) {
    const cols = new Array(57).fill("");
    cols[0]  = handle;          // Handle
    cols[1]  = title;           // Title
    cols[2]  = "";              // Description
    cols[3]  = vendor;          // Vendor
    cols[4]  = category;        // Product category
    cols[5]  = type;            // Type
    cols[6]  = tags;            // Tags
    cols[7]  = published;       // Published on online store
    cols[8]  = status;          // Status
    cols[9]  = sku;             // SKU
    cols[10] = "";              // Barcode
    cols[11] = opt1name;        // Option1 name
    cols[12] = opt1val;         // Option1 value
    cols[13] = "";              // Option1 Linked To
    cols[14] = "";              // Option2 name
    cols[15] = "";              // Option2 value
    cols[16] = "";              // Option2 Linked To
    cols[17] = "";              // Option3 name
    cols[18] = "";              // Option3 value
    cols[19] = "";              // Option3 Linked To
    cols[20] = price;           // Price  ← col 21 (0-indexed: 20)
    cols[21] = "";              // Compare-at price
    cols[22] = "";              // Cost per item
    cols[23] = "TRUE";          // Charge tax
    cols[24] = "";              // Tax code
    cols[25] = "";              // Unit price total measure
    cols[26] = "";              // Unit price total measure unit
    cols[27] = "";              // Unit price base measure
    cols[28] = "";              // Unit price base measure unit
    cols[29] = inventoryTracker; // Inventory tracker
    cols[30] = inventoryQty;    // Inventory quantity
    cols[31] = "DENY";          // Continue selling when out of stock
    cols[32] = "0";             // Weight value (grams)
    cols[33] = "g";             // Weight unit for display
    cols[34] = requiresShipping; // Requires shipping
    cols[35] = "manual";        // Fulfillment service
    cols[36] = "";              // Product image URL
    cols[37] = "";              // Image position
    cols[38] = "";              // Image alt text
    cols[39] = "";              // Variant image URL
    cols[40] = giftCard;        // Gift card
    cols[41] = "";              // SEO title
    cols[42] = "";              // SEO description
    // cols 43-56: Google Shopping fields — all empty
    return cols.map(v => String(v).includes(",") ? `"${v}"` : v).join(",");
}

const V  = "My Coffee Co";
const IT = "shopify";
const IQ = "100";
const RS = "FALSE";
const GC = "FALSE";

const CAT_HOT = "Food & Beverages > Beverages > Coffee";
const CAT_BEV = "Food & Beverages > Beverages";

// Products: [title, handle, category, type, tags, variants: [{sku, opt1val, price}]]
const products = [
    { title: "Espresso",                  handle: "espresso",                  cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Title",  variants: [{sku:"225", val:"Default", price:"99"}] },
    { title: "Cortado",                   handle: "cortado",                   cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Title",  variants: [{sku:"226", val:"Default", price:"149"}] },
    { title: "Pour Over",                 handle: "pour-over",                 cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Title",  variants: [{sku:"247", val:"Default", price:"149"}] },
    { title: "Americano",                 handle: "americano",                 cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Size",   variants: [{sku:"228", val:"Regular", price:"109"},{sku:"229", val:"Large", price:"129"},{sku:"230", val:"Extra Large", price:"159"}] },
    { title: "Cappuccino",                handle: "cappuccino",                cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Size",   variants: [{sku:"232", val:"Regular", price:"149"},{sku:"233", val:"Large", price:"179"},{sku:"234", val:"Extra Large", price:"209"}] },
    { title: "Latte",                     handle: "latte",                     cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Size",   variants: [{sku:"237", val:"Regular", price:"149"},{sku:"238", val:"Large", price:"179"},{sku:"239", val:"Extra Large", price:"209"}] },
    { title: "Flat White",                handle: "flat-white",                cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Size",   variants: [{sku:"240", val:"Regular", price:"159"},{sku:"241", val:"Large", price:"189"},{sku:"242", val:"Extra Large", price:"219"}] },
    { title: "Mocha",                     handle: "mocha",                     cat: CAT_HOT, type: "Hot Coffee",  tags: "Hot Coffee",  opt1name: "Size",   variants: [{sku:"244", val:"Regular", price:"189"},{sku:"245", val:"Large", price:"219"},{sku:"246", val:"Extra Large", price:"249"}] },
    { title: "Protein Hot Latte",         handle: "protein-hot-latte",         cat: CAT_HOT, type: "NEW DRINKS", tags: "NEW DRINKS",  opt1name: "Size",   variants: [{sku:"475", val:"Regular", price:"189"},{sku:"476", val:"Large", price:"189"},{sku:"477", val:"Extra Large", price:"219"}] },
    { title: "Signature Protein Shake",   handle: "signature-protein-shake",   cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS",  opt1name: "Size",   variants: [{sku:"479", val:"Regular", price:"149"},{sku:"480", val:"Large", price:"159"},{sku:"481", val:"Extra Large", price:"209"}] },
    { title: "Sugar Free Protein Milkshake", handle: "sugar-free-protein-milkshake", cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS", opt1name: "Size", variants: [{sku:"483", val:"Regular", price:"179"},{sku:"484", val:"Large", price:"199"},{sku:"485", val:"Extra Large", price:"249"}] },
    { title: "Vanilla Oat Milk Iced Matcha", handle: "vanilla-oat-milk-iced-matcha", cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS", opt1name: "Size", variants: [{sku:"487", val:"Regular", price:"199"},{sku:"488", val:"Large", price:"249"},{sku:"489", val:"Extra Large", price:"299"}] },
    { title: "Vanilla Oat Protein Shake", handle: "vanilla-oat-protein-shake", cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS",  opt1name: "Size",   variants: [{sku:"491", val:"Regular", price:"149"},{sku:"492", val:"Large", price:"199"},{sku:"493", val:"Extra Large", price:"249"}] },
    { title: "Vegan Oat Shakerato",       handle: "vegan-oat-shakerato",       cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS",  opt1name: "Size",   variants: [{sku:"495", val:"Regular", price:"219"},{sku:"496", val:"Large", price:"249"},{sku:"497", val:"Extra Large", price:"269"}] },
    { title: "Signature Cold Chocolate",  handle: "signature-cold-chocolate",  cat: CAT_BEV, type: "NEW DRINKS", tags: "NEW DRINKS",  opt1name: "Size",   variants: [{sku:"499", val:"Large",   price:"219"},{sku:"500", val:"Extra Large", price:"249"}] },
];

const rows = [HEADER];

for (const p of products) {
    p.variants.forEach((v, i) => {
        rows.push(row(
            p.handle,
            i === 0 ? p.title : "",
            i === 0 ? V : "",
            i === 0 ? p.cat : "",
            i === 0 ? p.type : "",
            i === 0 ? p.tags : "",
            i === 0 ? "TRUE" : "",
            i === 0 ? "Active" : "",
            v.sku,
            p.opt1name,
            v.val,
            v.price,
            IT, IQ, RS, GC
        ));
    });
}

fs.writeFileSync("rista-products.csv", rows.join("\n"), "utf8");
console.log(`Written ${rows.length - 1} product rows to rista-products.csv`);
console.log("Verify first data row column count:", rows[1].split(",").length, "(should be 57)");

