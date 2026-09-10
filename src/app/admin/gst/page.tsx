"use client";

import AdminGstForm from "@/components/admin-gst-form";

export default function GstPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">GST</h2>
        <p className="text-brand-muted">
          GST number, CGST, SGST, and whether tax is added on customer and admin
          bills.
        </p>
      </div>
      <AdminGstForm />
    </div>
  );
}
