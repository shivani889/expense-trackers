import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type Expense = { id: number; title: string; amount: number; category: string };
type MonthData = { income: number; expenses: Expense[] };
type Data = Record<string, MonthData>;

export default function App() {
  const STORAGE_DATA = "expense-data";
  const STORAGE_CATS = "expense-categories";

  const [data, setData] = useState<Data>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DATA);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { [getCurrentMonth()]: { income: 0, expenses: [] } };
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ["Food", "Travel", "Shopping", "Bills"];
  });

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Ensure month exists whenever selectedMonth changes
  useEffect(() => {
    if (!data[selectedMonth]) {
      setData((prev) => ({
        ...prev,
        [selectedMonth]: { income: 0, expenses: [] },
      }));
    }
  }, [selectedMonth, data]);

  // Persist data & categories
  useEffect(() => localStorage.setItem(STORAGE_DATA, JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem(STORAGE_CATS, JSON.stringify(categories)), [categories]);

  const [incomeInput, setIncomeInput] = useState<number>(data[selectedMonth]?.income || 0);
  useEffect(() => setIncomeInput(data[selectedMonth]?.income || 0), [selectedMonth, data]);

  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expCategory, setExpCategory] = useState<string>(categories[0] || "");
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  // Update expCategory if categories change
  useEffect(() => {
    setExpCategory(categories[0] || "");
  }, [categories]);

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const monthExpenses: Expense[] = data[selectedMonth]?.expenses || [];

  // Handlers
  const handleSaveIncome = () => {
    setData((prev) => ({
      ...prev,
      [selectedMonth]: { ...(prev[selectedMonth] || { income: 0, expenses: [] }), income: Number(incomeInput) },
    }));
  };

  const handleAddOrUpdateExpense = () => {
    if (!expTitle || !expAmount || !expCategory) return;
    setData((prev) => {
      const month = prev[selectedMonth] || { income: 0, expenses: [] };
      const expenses = month.expenses ? [...month.expenses] : [];
      if (editingExpId) {
        const updated = expenses.map((e) =>
          e.id === editingExpId ? { ...e, title: expTitle, amount: Number(expAmount), category: expCategory } : e
        );
        return { ...prev, [selectedMonth]: { ...month, expenses: updated } };
      } else {
        const newExp: Expense = { id: Date.now(), title: expTitle, amount: Number(expAmount), category: expCategory };
        return { ...prev, [selectedMonth]: { ...month, expenses: [...expenses, newExp] } };
      }
    });
    setExpTitle("");
    setExpAmount("");
    setExpCategory(categories[0] || "");
    setEditingExpId(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpTitle(expense.title);
    setExpAmount(expense.amount.toString());
    setExpCategory(expense.category);
    setEditingExpId(expense.id);
  };

  const handleDeleteExpense = (id: number) => {
    setData((prev) => {
      const month = prev[selectedMonth] || { income: 0, expenses: [] };
      return { ...prev, [selectedMonth]: { ...month, expenses: (month.expenses || []).filter((e) => e.id !== id) } };
    });
  };

  const handleAddCategory = () => {
    const v = newCategoryInput.trim();
    if (!v) return;
    if (categories.includes(v)) {
      alert("Category already exists");
      return;
    }
    setCategories((prev) => [...prev, v]);
    setNewCategoryInput("");
  };

  const startEditCategory = (cat: string) => {
    setEditingCategory(cat);
    setNewCategoryInput(cat);
  };

  const handleSaveEditedCategory = () => {
    const v = newCategoryInput.trim();
    if (!v || !editingCategory) return;
    if (categories.includes(v) && v !== editingCategory) {
      alert("Category name already used");
      return;
    }

    setCategories((prev) => prev.map((c) => (c === editingCategory ? v : c)));

    setData((prev) => {
      const copy: Data = JSON.parse(JSON.stringify(prev));
      Object.keys(copy).forEach((m) => {
        copy[m].expenses = (copy[m].expenses || []).map((ex: Expense) =>
          ex.category === editingCategory ? { ...ex, category: v } : ex
        );
      });
      return copy;
    });

    setEditingCategory(null);
    setNewCategoryInput("");
  };

  const handleDeleteCategory = (cat: string) => {
    const used = Object.values(data).some((m) => (m.expenses || []).some((e) => e.category === cat));
    if (used) {
      alert("Cannot delete category with existing expenses.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c !== cat));
    if (editingCategory === cat) {
      setEditingCategory(null);
      setNewCategoryInput("");
    }
  };

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining = (data[selectedMonth]?.income || 0) - totalExpense;

  const chartData = useMemo(() => {
    const ex = data[selectedMonth]?.expenses || [];
    return categories.map((cat) => ({
      name: cat,
      value: ex.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }));
  }, [categories, data, selectedMonth]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#DC143C"];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">💰 Expense Tracker</h1>

      {/* Month Selector */}
      <div className="flex justify-center mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {Object.keys(data)
            .sort()
            .map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
        </select>
      </div>

      {/* Income & Expense Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl shadow">
          <h3 className="font-semibold">Total Income</h3>
          <p className="text-2xl">₹{data[selectedMonth]?.income || 0}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-xl shadow">
          <h3 className="font-semibold">Total Expense</h3>
          <p className="text-2xl">₹{totalExpense}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-xl shadow">
          <h3 className="font-semibold">Remaining</h3>
          <p className="text-2xl">₹{remaining}</p>
        </div>
      </div>

      {/* Income Input */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Set Total Income</h2>
        <div className="flex gap-2">
          <input
            type="number"
            value={incomeInput}
            onChange={(e) => setIncomeInput(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <button onClick={handleSaveIncome} className="bg-black text-white px-4 py-2 rounded-lg">
            Save
          </button>
        </div>
      </div>

      {/* Add/Edit Expense */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">{editingExpId ? "Edit Expense" : "Add Expense"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Title"
            value={expTitle}
            onChange={(e) => setExpTitle(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Amount"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="border rounded-lg px-3 py-2">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button onClick={handleAddOrUpdateExpense} className="bg-black text-white px-4 py-2 rounded-lg">
            {editingExpId ? "Update" : "Add"}
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Expenses</h2>
        {monthExpenses.length === 0 ? (
          <p className="text-gray-500">No expenses yet.</p>
        ) : (
          <ul className="divide-y">
            {monthExpenses.map((e) => (
              <li key={e.id} className="flex justify-between py-2 items-center">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-gray-500">{e.category}</div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="font-semibold">₹{e.amount}</div>
                  <button onClick={() => handleEditExpense(e)} className="text-blue-500">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chart + Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Category-wise Chart</h2>
          <PieChart width={350} height={300}>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Manage Categories</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
            {editingCategory ? (
              <button onClick={handleSaveEditedCategory} className="bg-black text-white px-4 py-2 rounded-lg">
                Save
              </button>
            ) : (
              <button onClick={handleAddCategory} className="bg-black text-white px-4 py-2 rounded-lg">
                Add
              </button>
            )}
          </div>
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c} className="flex justify-between py-2 items-center">
                {c}
                <div className="flex gap-2">
                  <button onClick={() => startEditCategory(c)} className="text-blue-500">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCategory(c)} className="text-red-500">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
