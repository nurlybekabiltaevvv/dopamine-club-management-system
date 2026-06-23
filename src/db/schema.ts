import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============= ENUMS =============
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "operator",
  "client",
]);

export const computerStatusEnum = pgEnum("computer_status", [
  "free",
  "busy",
  "reserved",
  "maintenance",
  "offline",
]);

export const hallTypeEnum = pgEnum("hall_type", [
  "standart",
  "room",
  "vip",
  "bootcamp",
  "trio",
  "solo",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "paused",
  "finished",
  "cancelled",
]);

export const packageTypeEnum = pgEnum("package_type", [
  "hour",
  "two_plus_one",
  "three_plus_two",
  "five_hours",
  "morning",
  "day",
  "night",
  "per_minute",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "drink",
  "snack",
  "merch",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "session",
  "product",
  "subscription",
  "topup",
]);

// ============= TABLES =============
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: userRoleEnum("role").notNull().default("client"),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  bonusPoints: integer("bonus_points").notNull().default(0),
  passwordHash: text("password_hash"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const halls = pgTable("halls", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: hallTypeEnum("type").notNull(),
  description: text("description"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
});

export const computers = pgTable("computers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hallId: integer("hall_id")
    .notNull()
    .references(() => halls.id, { onDelete: "cascade" }),
  status: computerStatusEnum("status").notNull().default("free"),
  specs: text("specs"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: packageTypeEnum("type").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  hallType: hallTypeEnum("hall_type"), // null means all halls
  isActive: boolean("is_active").notNull().default(true),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  computerId: integer("computer_id")
    .notNull()
    .references(() => computers.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  packageId: integer("package_id").references(() => packages.id),
  operatorId: uuid("operator_id").references(() => users.id),
  status: sessionStatusEnum("status").notNull().default("active"),
  startAt: timestamp("start_at").notNull().defaultNow(),
  endAt: timestamp("end_at"),
  pausedAt: timestamp("paused_at"),
  totalPausedMinutes: integer("total_paused_minutes").notNull().default(0),
  pricePerHour: numeric("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: productCategoryEnum("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id), // optional
  operatorId: uuid("operator_id").references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  operatorId: uuid("operator_id").references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  computerId: integer("computer_id")
    .notNull()
    .references(() => computers.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============= RELATIONS =============
export const hallsRelations = relations(halls, ({ many }) => ({
  computers: many(computers),
}));

export const computersRelations = relations(computers, ({ one, many }) => ({
  hall: one(halls, { fields: [computers.hallId], references: [halls.id] }),
  sessions: many(sessions),
  reservations: many(reservations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  sales: many(sales),
  transactions: many(transactions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  computer: one(computers, {
    fields: [sessions.computerId],
    references: [computers.id],
  }),
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  package: one(packages, {
    fields: [sessions.packageId],
    references: [packages.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

// ============= TYPES =============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Hall = typeof halls.$inferSelect;
export type NewHall = typeof halls.$inferInsert;
export type Computer = typeof computers.$inferSelect;
export type NewComputer = typeof computers.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
