// Full structure created by /setup-servidor.
// type: "text" | "voice"
// message: if present, gets posted automatically when the channel is created
// No permissions are touched by this file at all. Every channel is created
// with default (open) permissions. Configure any restrictions manually
// in Discord afterwards if you want them.
export const SERVER_STRUCTURE = [
  {
    category: "👋 WELCOME",
    channels: [
      {
        name: "rules",
        type: "text",
        message:
          "**📜 Server rules**\n\n1. Respect everyone, no insults or discrimination.\n2. No spam or advertising other servers without permission.\n3. Purchases and support go through a ticket (`/ticket` or the panel), not staff DMs.\n4. Staff has the final word in case of doubt.\n\n*(Edit this message with your real rules whenever you want.)*",
      },
    ],
  },
  {
    category: "📢 INFO",
    channels: [
      { name: "announcements", type: "text" },
      { name: "updates", type: "text" },
      { name: "roles", type: "text", message: "🎭 Self-assignable roles go here (notifications, games, etc.). Set it up with your favorite reaction-roles system." },
      {
        name: "faq",
        type: "text",
        message: "**❓ Frequently asked questions**\n\n*(Fill in with your real questions. Example:)*\n\n**How fast is delivery?** Instant, as soon as payment is confirmed.\n**What payment methods do you accept?** Check #payment-methods.",
      },
    ],
  },
  {
    category: "🛍️ STORE",
    channels: [
      { name: "catalog", type: "text", message: "🛒 Check out the full catalog on the store website, or use `/vouch` once you've bought something." },
      { name: "new-products", type: "text" },
      { name: "deals", type: "text" },
      {
        name: "how-to-buy",
        type: "text",
        message:
          "**🛍️ How to buy**\n\n1. Browse the catalog and pick your product.\n2. Complete the payment.\n3. Get your product instantly.\n4. If something goes wrong, open a ticket in #ticket-panel.",
      },
      { name: "payment-methods", type: "text", message: "**💳 Accepted payment methods**\n\n• PayPal\n\n*(Update this list if you add more methods.)*" },
      { name: "warranty-and-refunds", type: "text", message: "**🛡️ Warranty and refunds**\n\n*(Fill in with your real policy: timeframes, what's covered, how to request one.)*" },
      { name: "order-status", type: "text", message: "📦 To check your order status, open a ticket and ask staff to use `/order` or `/invoice`." },
      { name: "reviews", type: "text" },
      { name: "store-questions", type: "text" },
    ],
  },
  {
    category: "📦 PRODUCTS",
    channels: Array.from({ length: 30 }, (_, i) => ({ name: `product-${i + 1}`, type: "text" })),
  },
  {
    category: "🎫 TICKETS",
    ticketCategory: true,
    channels: [],
  },
  {
    category: "🎫 SUPPORT",
    channels: [
      { name: "ticket-panel", type: "text" },
      { name: "service-status", type: "text" },
    ],
  },
  {
    category: "🎮 COMMUNITY",
    channels: [
      { name: "general-chat", type: "text" },
      { name: "free-tips", type: "text" },
      { name: "results", type: "text" },
      { name: "clips", type: "text" },
      { name: "introduce-yourself", type: "text" },
      { name: "memes", type: "text" },
    ],
  },
  {
    category: "🏆 EVENTS",
    channels: [
      { name: "events", type: "text" },
      { name: "tournaments", type: "text" },
    ],
  },
  {
    category: "🔒 STAFF",
    channels: [
      { name: "staff-chat", type: "text" },
      { name: "ticket-logs", type: "text" },
      { name: "sales-logs", type: "text" },
      { name: "pending-tasks", type: "text" },
      { name: "staff-announcements", type: "text" },
      { name: "internal-feedback", type: "text" },
    ],
  },
  {
    category: "🚫 MODERATION",
    channels: [
      { name: "warn-log", type: "text" },
      { name: "ban-log", type: "text" },
    ],
  },
  {
    category: "🎤 VOICE",
    channels: [
      { name: "General", type: "voice" },
      { name: "Strategy Talk", type: "voice" },
      { name: "Streaming", type: "voice" },
      { name: "AFK", type: "voice" },
    ],
  },
  {
    category: "🔒 STAFF VOICE",
    channels: [
      { name: "Staff", type: "voice" },
      { name: "Meetings", type: "voice" },
    ],
  },
];

// Roles created by /setup-servidor if they don't already exist (matched by name).
// These are created with no channel permissions wired up automatically.
export const SERVER_ROLES = [
  { key: "founder", name: "👑 Founder", color: 0xffd700, hoist: true, permissions: ["Administrator"] },
  {
    key: "staff",
    name: "🛠️ Staff",
    color: 0x3355ff,
    hoist: true,
    permissions: [
      "ManageMessages",
      "ManageChannels",
      "ManageThreads",
      "KickMembers",
      "BanMembers",
      "ManageNicknames",
      "MuteMembers",
      "DeafenMembers",
      "ModerateMembers",
      "ViewAuditLog",
    ],
  },
  { key: "verified", name: "✅ Verified", color: 0x2ecc71, hoist: false, permissions: [] },
  { key: "customer", name: "🛍️ Customer", color: 0xffc53d, hoist: true, permissions: [] },
  {
    key: "moderator",
    name: "🛡️ Moderator",
    color: 0x5865f2,
    hoist: true,
    permissions: ["KickMembers", "BanMembers", "ManageMessages", "MuteMembers", "DeafenMembers", "ModerateMembers", "ManageNicknames"],
  },
  { key: "support", name: "🎫 Support", color: 0x2ecc71, hoist: true, permissions: ["ManageMessages"] },
  { key: "bots", name: "🤖 Bots", color: 0x99aab5, hoist: true, permissions: [] },
  { key: "partner", name: "🤝 Partners", color: 0x1abc9c, hoist: true, permissions: [] },
];
