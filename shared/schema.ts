import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  price: z.number(),
  quantity: z.number(),
  coverUrl: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  cart: json("cart").$type<CartItem[]>().default(sql`'[]'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  description: text("description"),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  bookId: varchar("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default("default"),
  storeName: text("store_name").notNull().default("BookHub"),
  storeEmail: text("store_email").notNull().default("contact@bookhub.com"),
  storePhone: text("store_phone").notNull().default("+91 9876543210"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  orderNotifications: boolean("order_notifications").notNull().default(true),
  lowStockAlerts: boolean("low_stock_alerts").notNull().default(true),
  newArrivalDuration: integer("new_arrival_duration").notNull().default(30),
  newArrivalUnit: text("new_arrival_unit").notNull().default("days"),
  recentlyUpdatedDuration: integer("recently_updated_duration").notNull().default(14),
  recentlyUpdatedUnit: text("recently_updated_unit").notNull().default("days"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeUnitSchema = z.enum(["seconds", "minutes", "hours", "days", "months"]);
export type TimeUnit = z.infer<typeof timeUnitSchema>;

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
}).extend({
  newArrivalDuration: z.number().int().min(1, "Must be at least 1").max(365, "Cannot exceed 365").optional(),
  newArrivalUnit: timeUnitSchema.optional(),
  recentlyUpdatedDuration: z.number().int().min(1, "Must be at least 1").max(365, "Cannot exceed 365").optional(),
  recentlyUpdatedUnit: timeUnitSchema.optional(),
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
