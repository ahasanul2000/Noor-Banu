// Shared by the API, the admin panel and the storefront (no server imports here).

export const ORDER_STATUSES = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
};

export const PAYMENT_STATUSES = {
    unpaid: "Unpaid",
    paid: "Paid",
    refunded: "Refunded",
};

/** Orders in these statuses have their items back in stock and don't count as sales. */
export const RESTOCKED_STATUSES = ["cancelled", "returned"];

export const SHIPPING_AREAS = {
    inside_dhaka: "Inside Dhaka",
    outside_dhaka: "Outside Dhaka",
};
