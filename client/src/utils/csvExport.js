// src/utils/csvExport.js

export const exportToCSV = (data, filename = "data.csv") => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);

  const rows = data.map(row =>
    headers.map(field => `"${row[field] ?? ""}"`).join(",")
  );

  const csvContent =
    [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};