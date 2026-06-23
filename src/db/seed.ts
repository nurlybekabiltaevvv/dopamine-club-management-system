import { db } from "./index";
import {
  users,
  halls,
  computers,
  packages,
  products,
} from "./schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  // Clear existing data
  await db.execute(sql`TRUNCATE TABLE reservations, transactions, sale_items, sales, sessions, computers, halls, packages, products, users RESTART IDENTITY CASCADE`);

  // ============= USERS =============
  const [admin] = await db
    .insert(users)
    .values({
      username: "admin",
      fullName: "Администратор",
      phone: "+77001234567",
      email: "admin@dopamine.kz",
      role: "admin",
      balance: "0",
      bonusPoints: 0,
    })
    .returning();

  const [operator] = await db
    .insert(users)
    .values({
      username: "operator",
      fullName: "Оператор Смены",
      phone: "+77007654321",
      role: "operator",
      balance: "0",
      bonusPoints: 0,
    })
    .returning();

  const clientSeed = await db
    .insert(users)
    .values([
      {
        username: "aibek",
        fullName: "Айбек Касымов",
        phone: "+77011112233",
        role: "client",
        balance: "15000",
        bonusPoints: 750,
      },
      {
        username: "daniyar",
        fullName: "Данияр Сериков",
        phone: "+77022223344",
        role: "client",
        balance: "32000",
        bonusPoints: 1600,
      },
      {
        username: "madina",
        fullName: "Мадина Алиева",
        phone: "+77033334455",
        role: "client",
        balance: "8500",
        bonusPoints: 425,
      },
    ])
    .returning();

  // ============= HALLS =============
  // Standart, Room1-2, Vip1-2-3, Bootcamp1-2, Trio1-2, Solo1-2
  const hallsData: Array<{
    name: string;
    type: "standart" | "room" | "vip" | "bootcamp" | "trio" | "solo";
    hourlyRate: string;
    capacity: number;
    description: string;
  }> = [
    { name: "Standart", type: "standart", hourlyRate: "800", capacity: 10, description: "Общий зал • RTX 3060 / i5" },
    { name: "Room1", type: "room", hourlyRate: "1500", capacity: 4, description: "Комната 1 • приватная игра" },
    { name: "Room2", type: "room", hourlyRate: "1500", capacity: 4, description: "Комната 2 • приватная игра" },
    { name: "Vip1", type: "vip", hourlyRate: "2500", capacity: 6, description: "VIP зал 1 • RTX 4070 / i7" },
    { name: "Vip2", type: "vip", hourlyRate: "2500", capacity: 6, description: "VIP зал 2 • RTX 4070 / i7" },
    { name: "Vip3", type: "vip", hourlyRate: "2500", capacity: 6, description: "VIP зал 3 • RTX 4070 / i7" },
    { name: "Bootcamp1", type: "bootcamp", hourlyRate: "1800", capacity: 5, description: "Bootcamp 1 • командные игры" },
    { name: "Bootcamp2", type: "bootcamp", hourlyRate: "1800", capacity: 5, description: "Bootcamp 2 • командные игры" },
    { name: "Trio1", type: "trio", hourlyRate: "2200", capacity: 3, description: "Трио 1 • 240Hz / 1ms" },
    { name: "Trio2", type: "trio", hourlyRate: "2200", capacity: 3, description: "Трио 2 • 240Hz / 1ms" },
    { name: "Solo1", type: "solo", hourlyRate: "1200", capacity: 1, description: "Solo 1 • стримерская станция" },
    { name: "Solo2", type: "solo", hourlyRate: "1200", capacity: 1, description: "Solo 2 • стримерская станция" },
  ];

  const insertedHalls = await db.insert(halls).values(hallsData).returning();

  // ============= COMPUTERS =============
  const computerSeedData: {
    name: string;
    hallId: number;
    specs: string;
    position: number;
  }[] = [];

  let position = 1;
  for (const hall of insertedHalls) {
    for (let i = 1; i <= hall.capacity; i++) {
      computerSeedData.push({
        name: `${hall.name}-${i}`,
        hallId: hall.id,
        specs: "RTX 3060 / i5-12400F / 16GB RAM / 240Hz",
        position: position++,
      });
    }
  }
  await db.insert(computers).values(computerSeedData);

  // ============= PACKAGES =============
  await db.insert(packages).values([
    {
      name: "Час",
      type: "hour",
      description: "Стандартный 1 час игры в зале Standart",
      durationMinutes: 60,
      price: "800",
    },
    {
      name: "2+1",
      type: "two_plus_one",
      description: "Оплати 2 часа — получи 3-й в подарок. Экономия 33%",
      durationMinutes: 180,
      price: "1600",
    },
    {
      name: "3+2",
      type: "three_plus_two",
      description: "Оплати 3 часа — получи 2 часа бонус",
      durationMinutes: 300,
      price: "2400",
    },
    {
      name: "5 часов",
      type: "five_hours",
      description: "Пакет на 5 часов. Удобно для турниров",
      durationMinutes: 300,
      price: "3500",
    },
    {
      name: "Утро",
      type: "morning",
      description: "Безлимит с 08:00 до 14:00",
      durationMinutes: 360,
      price: "3000",
    },
    {
      name: "День",
      type: "day",
      description: "Безлимит с 14:00 до 22:00",
      durationMinutes: 480,
      price: "4500",
    },
    {
      name: "Ночь",
      type: "night",
      description: "Безлимит с 22:00 до 08:00. Для хардкорщиков",
      durationMinutes: 600,
      price: "5500",
    },
  ]);

  // ============= PRODUCTS =============
  await db.insert(products).values([
    // Drinks
    { name: "Coca-Cola 0.5", category: "drink", price: "700", cost: "280", stock: 50, sku: "DR-COKE-05" },
    { name: "Pepsi 0.5", category: "drink", price: "700", cost: "280", stock: 40, sku: "DR-PEP-05" },
    { name: "Fanta 0.5", category: "drink", price: "700", cost: "280", stock: 35, sku: "DR-FAN-05" },
    { name: "Sprite 0.5", category: "drink", price: "700", cost: "280", stock: 30, sku: "DR-SPR-05" },
    { name: "Red Bull 0.25", category: "drink", price: "1500", cost: "650", stock: 60, sku: "DR-RB-25" },
    { name: "Burn 0.25", category: "drink", price: "1300", cost: "550", stock: 40, sku: "DR-BURN-25" },
    { name: "Чай зелёный", category: "drink", price: "600", cost: "200", stock: 25, sku: "DR-TEA-G" },
    { name: "Кофе Американо", category: "drink", price: "900", cost: "300", stock: 30, sku: "DR-COF-A" },
    { name: "Капучино", category: "drink", price: "1200", cost: "400", stock: 25, sku: "DR-COF-C" },
    { name: "Латте", category: "drink", price: "1300", cost: "400", stock: 25, sku: "DR-COF-L" },
    { name: "Вода 0.5", category: "drink", price: "400", cost: "120", stock: 80, sku: "DR-WAT-05" },
    { name: "Сок в ассортименте 0.3", category: "drink", price: "800", cost: "300", stock: 30, sku: "DR-JCE" },
    // Snacks
    { name: "Чипсы Lays 150г", category: "snack", price: "1100", cost: "450", stock: 40, sku: "SN-LAYS" },
    { name: "Доритос 150г", category: "snack", price: "1200", cost: "500", stock: 35, sku: "SN-DOR" },
    { name: "Pringles 165г", category: "snack", price: "1800", cost: "800", stock: 25, sku: "SN-PRIN" },
    { name: "Snickers 50г", category: "snack", price: "600", cost: "250", stock: 60, sku: "SN-SNK" },
    { name: "Twix 50г", category: "snack", price: "600", cost: "250", stock: 50, sku: "SN-TWX" },
    { name: "Bounty 55г", category: "snack", price: "600", cost: "250", stock: 45, sku: "SN-BNT" },
    { name: "Сухарики 100г", category: "snack", price: "500", cost: "200", stock: 40, sku: "SN-SUH" },
    { name: "Орешки 100г", category: "snack", price: "1500", cost: "650", stock: 30, sku: "SN-ORE" },
    { name: "Пицца Маргарита", category: "snack", price: "3500", cost: "1500", stock: 15, sku: "SN-PIZ-M" },
    { name: "Хот-дог классический", category: "snack", price: "1800", cost: "700", stock: 20, sku: "SN-HD" },
    // Merch
    { name: "Футболка Dopamine", category: "merch", price: "12000", cost: "4500", stock: 15, sku: "MR-TSH" },
    { name: "Худи Dopamine", category: "merch", price: "25000", cost: "9000", stock: 10, sku: "MR-HUD" },
    { name: "Кепка Dopamine", category: "merch", price: "8000", cost: "2800", stock: 12, sku: "MR-CAP" },
    { name: "Кружка Dopamine", category: "merch", price: "4500", cost: "1500", stock: 20, sku: "MR-MUG" },
    { name: "Стикер-пак Dopamine", category: "merch", price: "1500", cost: "400", stock: 50, sku: "MR-STK" },
  ]);

  return {
    admin,
    operator,
    clients: clientSeed,
    halls: insertedHalls,
  };
}
