"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { v4 as uuidv4 } from "uuid";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Item {
  id: number;
  name: string;
  quantity: number;
  brand: string;
}

interface Client {
  id: number;
  name: string;
}

export default function AddDeliveryNote() {
  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    { item_id: number; name: string; quantity: number; max_quantity: number }[]
  >([]);

  const [noteNumber, setNoteNumber] = useState<string>(uuidv4().slice(0, 8).toUpperCase());
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const results = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(results);
    } else {
      setFilteredItems([]);
    }
  }, [searchTerm, items]);

  useEffect(() => {
    if (clientSearchTerm.trim()) {
      const results = clients.filter((client) =>
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
      );
      setFilteredClients(results);
    } else {
      setFilteredClients([]);
    }
  }, [clientSearchTerm, clients]);

  const fetchItems = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_URL}/items/inStock`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setError("Failed to load items");
      }
    } catch (err) {
      setError("Something went wrong loading items.");
    }
  };

  const fetchClients = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setClients(data.data);
      } else {
        setError("Failed to load clients");
      }
    } catch (err) {
      setError("Something went wrong loading clients.");
    }
  };

  const addItemToNote = (item: Item) => {
    if (selectedItems.find((i) => i.item_id === item.id)) return;

    setSelectedItems((prev) => [
      ...prev,
      {
        item_id: item.id,
        name: item.name,
        quantity: 1,
        max_quantity: item.quantity,
      },
    ]);
    setSearchTerm("");
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };

  const removeItem = (itemId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.item_id !== itemId));
  };

  const handleSubmit = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return setError("Please log in first.");

    if (!selectedClient) {
      return setError("Please select a client.");
    }

    const payload = {
      delivery_number: noteNumber,
      delivery_date: deliveryDate,
      client_id: selectedClient.id,
      delivery_note_items: selectedItems.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/delivery-notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Delivery note created successfully!");
        setSelectedItems([]);
        setNoteNumber(uuidv4().slice(0, 8).toUpperCase());
        setDeliveryDate("");
        setSelectedClient(null);
        setClientSearchTerm("");
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Error submitting delivery note.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md relative">
        <h2 className="text-2xl font-bold mb-4">Create Delivery Note</h2>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <div className="mb-4">
          <label className="block font-semibold">Note Number:</label>
          <input type="text" className="w-full border p-2 rounded" value={noteNumber} readOnly />
        </div>

        <div className="mb-4 relative" tabIndex={0}
          onBlur={() => setTimeout(() => setFilteredClients([]), 100)}>
          <label className="block font-semibold">Select Client:</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={clientSearchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setClientSearchTerm(value);
              const matches = clients.filter((client) =>
                client.name.toLowerCase().includes(value.toLowerCase())
              );
              setFilteredClients(matches);
            }}
            placeholder="Search client..."
          />
          {filteredClients.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded shadow max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => {
                    setSelectedClient(client);
                    setClientSearchTerm(client.name);
                    setFilteredClients([]);
                  }}
                >
                  {client.name}
                </li>
              ))}
            </ul>
          )}
        </div>


        <div className="mb-4">
          <label className="block font-semibold">Delivery Date:</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>

        <div className="mb-4 relative">
          <label className="block font-semibold">Search Item:</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type item name..."
          />
          {filteredItems.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded shadow max-h-48 overflow-auto">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => addItemToNote(item)}
                >
                  {item.name} ({item.brand}) - {item.quantity} in stock
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Selected Items</h3>
          {selectedItems.length === 0 ? (
            <p className="text-gray-500">No items selected</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Max</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.item_id}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        max={item.max_quantity}
                        value={item.quantity}
                        className="w-20 border p-1 rounded"
                        onChange={(e) =>
                          handleQuantityChange(item.item_id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2 text-center">{item.max_quantity}</td>
                    <td className="p-2 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeItem(item.item_id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Submit Delivery Note
        </button>
      </div>
    </DashboardLayout>
  );
}
