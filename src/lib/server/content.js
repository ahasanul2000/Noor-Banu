import { plain } from "./serialize";

/** Active rows in the admin-chosen order. */
export const VISIBLE = { where: { is_active: true }, orderBy: [{ sort_order: "asc" }, { id: "asc" }] };

/** The storefront reads `image`; the admin panel stores the upload as `thumbnail`. */
export const presentBlog = (blog) => ({ ...plain(blog), image: blog.thumbnail });
