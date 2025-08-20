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
    } catch (e) {}
    return { [getCurrentMonth()]: { income: 0, expenses: [] } };
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ["Food", "Travel", "Shopping", "Bills"];
  });

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!data[selectedMonth]) {
      setData((prev) => ({
        ...prev,
        [selectedMonth]: { income: 0, expenses: [] },
      }));
    }
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_DATA, JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem(STORAGE_CATS, JSON.stringify(categories)), [categories]);

  const [incomeInput, setIncomeInput] = useState<number>(data[selectedMonth]?.income || 0);
  useEffect(() => setIncomeInput(data[selectedMonth]?.income || 0), [selectedMonth, data]);

  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expCategory, setExpCategory] = useState(categories[0] || "");
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const monthExpenses: Expense[] = data[selectedMonth]?.expenses || [];

  const handleSaveIncome = () => {
    setData((prev) => ({
      ...prev,
      [selectedMonth]: {
        ...(prev[selectedMonth] || { income: 0, expenses: [] }),
        income: Number(incomeInput),
      },
    }));
  };

  const handleAddOrUpdateExpense = () => {
    if (!expTitle || !expAmount || !expCategory) return;
    setData((prev) => {
      const month = prev[selectedMonth] || { income: 0, expenses: [] };
      const expenses = month.expenses ? [...month.expenses] : [];
      if (editingExpId) {
        const updated = expenses.map((e) =>
          e.id === editingExpId
            ? { ...e, title: expTitle, amount: Number(expAmount), category: expCategory }
            : e
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
      return {
        ...prev,
        [selectedMonth]: { ...month, expenses: (month.expenses || []).filter((e) => e.id !== id) },
      };
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
    const used = Object.values(data).some((m) =>
      (m.expenses || []).some((e) => e.category === cat)
    );
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
      {/* ...rest of your JSX remains the same... */}
    </div>
  );
}
