import { api, type Meal } from "./api";

export async function exportMealsCSV() {
  // Fetch all history pages
  let allMeals: Meal[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const res = await api.getHistory(page);
    allMeals = [...allMeals, ...res.data.meals];
    hasNext = res.data.has_next;
    page++;
    if (page > 50) break; // safety limit
  }

  if (allMeals.length === 0) {
    throw new Error("No data to export");
  }

  const headers = [
    "Date",
    "Meal Type",
    "Name",
    "Quantity",
    "Unit",
    "Calories",
    "Protein (g)",
    "Carbs (g)",
    "Fat (g)",
  ];

  const rows = allMeals.map((m) => [
    (m.timestamp || "").slice(0, 10),
    m.meal_type,
    `"${(m.name || "").replace(/"/g, '""')}"`,
    m.quantity,
    m.unit,
    m.calories,
    m.protein,
    m.carbs,
    m.fat,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nourishai-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
