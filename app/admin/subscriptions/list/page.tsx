"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function SubscribeClient() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]); // Add subscriptions state
  const [formData, setFormData] = useState({
    client_id: "",
    plan_id: "",
    start_date: "",
    end_date: "",
    status: "active", // Default to 'active'
  });

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [showModal, setShowModal] = useState(false);


  const handleOpenModal = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };


  const openClientModal = (client) => {
    setSelectedClient(client);
  };

  const openPlanModal = (plan) => {
    setSelectedPlan(plan);
  };

  const closeModal = () => {
    setSelectedClient(null);
    setSelectedPlan(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    }
    setAuthToken(token);

    // Fetch clients, plans, and subscriptions from the API
    const fetchData = async () => {
      try {
        const clientsResponse = await fetch(`${API_URL}/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const plansResponse = await fetch(`${API_URL}/plans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const subscriptionsResponse = await fetch(`${API_URL}/subscriptions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!clientsResponse.ok || !plansResponse.ok || !subscriptionsResponse.ok) {
          throw new Error("Failed to fetch clients, plans, or subscriptions");
        }

        const clientsData = await clientsResponse.json();
        const plansData = await plansResponse.json();
        const subscriptionsData = await subscriptionsResponse.json();

        setClients(clientsData.data);
        setPlans(plansData.data);
        setSubscriptions(subscriptionsData.data); // Set the subscriptions data
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchData();
  }, [authToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleGenerateInvoice = async (subscriptionId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    }
    setAuthToken(token);
    try {
      // Fetch the PDF from the backend
      const response = await fetch(`${API_URL}/generate-invoice/${subscriptionId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if the response is OK (successful)
      if (response.ok) {
        // Create a Blob object to trigger the download
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${subscriptionId}.pdf`; // Name of the downloaded file
        link.click();
      } else {
        alert('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('An error occurred while generating the invoice');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!authToken) {
      setError("You are not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Subscription creation failed");
      }

      setSuccess("Client subscribed successfully!");
      setFormData({
        client_id: "",
        plan_id: "",
        start_date: "",
        end_date: "",
        status: "active",
      });

      // Optionally, you can fetch updated subscriptions after successful submission
      const updatedSubscriptions = await fetch(`${API_URL}/subscriptions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((res) => res.json());

      setSubscriptions(updatedSubscriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }




  };



  return (
    <DashboardLayout>
      <div className="flex min-h-screen items-start justify-center bg-gray-100 py-8">
        <div className="w-full max-w-5xl rounded-lg bg-white p-6 shadow-md">

          {/* Display Subscriptions List */}
          <h2 className="mb-4 text-center text-2xl font-bold">Current Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No subscriptions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto mt-4 text-sm text-gray-700">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">Client</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">Plan</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">Start Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">End Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800"> Billing Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-800">Current Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription, index) => (
                    <tr
                      key={subscription.id}
                      className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2">
                        <a
                          href="#"
                          onClick={() => openClientModal(subscription.client)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {subscription.client.name}
                        </a>
                      </td>
                      <td className="px-4 py-2">
                        <a
                          href="#"
                          onClick={() => openPlanModal(subscription.plan)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {subscription.plan.name}
                        </a>
                      </td>
                      <td className="px-4 py-2">{subscription.start_date}</td>
                      <td className="px-4 py-2">{subscription.end_date}</td>
                      <td className="px-4 py-2">{subscription.billing_date}</td>
                      <td className="px-4 py-2">{subscription.status}</td>
                      <td>
                        <button
                          onClick={() => handleGenerateInvoice(subscription.id)}
                          className="bg-blue-500 text-white py-1 px-4 rounded"
                        >
                          Generate Invoice
                        </button>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-2xl font-bold mb-4">{selectedClient.name} - Details</h3>
            <p><strong>Names:</strong> {selectedClient.name}</p>
            <p><strong>Email:</strong> {selectedClient.email}</p>
            <p><strong>Phone:</strong> {selectedClient.phone}</p>
            <p><strong>Address:</strong> {selectedClient.address}</p>
            <button onClick={closeModal} className="mt-4 bg-red-500 text-white py-2 px-4 rounded">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-2xl font-bold mb-4">{selectedPlan.name} - Details</h3>
            <p><strong>Price:</strong> ${selectedPlan.price}</p>
            <p><strong>Duration:</strong> {selectedPlan.duration} months</p>
            <p><strong>Description:</strong> {selectedPlan.description}</p>
            <button onClick={closeModal} className="mt-4 bg-red-500 text-white py-2 px-4 rounded">
              Close
            </button>

          </div>
        </div>
      )}
      {/* Client Invoice Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">{selectedClient.name}'s Invoices</h3>
            <ul className="space-y-2">
              {selectedClient.invoices && selectedClient.invoices.length > 0 ? (
                selectedClient.invoices.map((invoice) => (
                  <li key={invoice.id} className="border-b pb-2">
                    <span className="block">Invoice #{invoice.id}</span>
                    <span className="block text-gray-500">Amount: ${invoice.amount}</span>
                    <a
                      href={`/api/invoices/download/${invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Download PDF
                    </a>
                  </li>
                ))
              ) : (
                <p>No invoices found.</p>
              )}
            </ul>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full bg-gray-500 text-white p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}