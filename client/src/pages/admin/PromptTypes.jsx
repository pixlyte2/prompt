import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

export default function PromptTypes() {
  const [channels, setChannels] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    channelId: ""
  });

  const load = async () => {
    const ch = await api.get("/channels");
    const pt = await api.get("/prompt-types");

    setChannels(ch.data);
    setTypes(pt.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.name || !form.channelId) {
      return alert("All fields required");
    }

    await api.post("/prompt-types", form);
    setForm({ name: "", channelId: "" });
    load();
  };

  return (
    <AdminLayout title="Prompt Types">
      {/* CREATE FORM */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Create Prompt Type
        </h3>

        <div className="flex gap-3">
          <input
            className="border px-3 py-2 rounded-lg w-full"
            placeholder="Prompt type name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <select
            className="border px-3 py-2 rounded-lg"
            value={form.channelId}
            onChange={(e) =>
              setForm({ ...form, channelId: e.target.value })
            }
          >
            <option value="">Select Channel</option>
            {channels.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={create}
            className="bg-blue-600 text-white px-6 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">
          Prompt Types
        </h3>

        {types.map((t) => (
          <div key={t._id} className="border-b py-2">
            {t.name} – {t.channelId?.name}
          </div>
        ))}

        {types.length === 0 && (
          <p className="text-gray-500">No prompt types found</p>
        )}
      </div>
    </AdminLayout>
  );
}
