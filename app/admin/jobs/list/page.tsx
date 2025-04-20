"use client";

import { useState, useEffect } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function FailedJobs() {
  const [failedJobs, setFailedJobs] = useState<any[]>([]);  // Ensures failedJobs is always an array
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Authentication required. Please log in");
      setError("Authentication required. Please log in.");
    } else {
      console.log("use authenticated");
      setAuthToken(token);  // This will now trigger the effect after the token is set.
    }
  }, []); // Only runs once, when the component mounts

  useEffect(() => {
    if (authToken) {
      fetchFailedJobs();
    }
  }, [authToken]); // This effect depends on authToken and will run whenever it's updated

  const fetchFailedJobs = async () => {
    console.log(authToken);
    if (!authToken) return;
    
    try {
      const response = await fetch(`${API_URL}/failed-jobs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();
      
      // Check if responseData contains the 'data' field
      if (response.ok && Array.isArray(responseData.data)) {
        setFailedJobs(responseData.data); // Set the 'data' array
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  

  const retryFailedJob = async (jobId: string) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/retry-failed-job/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to retry job");
      fetchFailedJobs(); // Refresh the failed jobs list
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <DashboardLayout>

      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Failed Jobs</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Job ID</th>
                <th className="border px-4 py-2">Exception</th>
                <th className="border px-4 py-2">Failed At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(failedJobs) && failedJobs.length > 0 ? (
                failedJobs.map((job) => (
                  <tr key={job.job_id} className="border">
                    <td className="border px-4 py-2">{job.job_id}</td>
                    <td className="border px-4 py-2">{job.exception}</td>
                    <td className="border px-4 py-2">{job.failed_at}</td>
                    <td className="border px-4 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => retryFailedJob(job.job_id)}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">No failed jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </DashboardLayout>
    
  );
}
