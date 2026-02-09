export default function Topbar({ title }) {
  return (
    <div className="bg-white border-b px-6 py-4">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
    </div>
  );
}
