// === frontend/src/components/Table.jsx ===

function Table({ points, onUpdate }) {
  return (
    <div className="overflow-x-auto mt-8">
      <table className="min-w-full text-sm text-left table-auto border-collapse custom-table">
        <thead>
          <tr className="bg-purple-700 text-white text-base">
            <th className="px-6 py-3">#</th>
            <th className="px-6 py-3">Kullanıcı</th>
            <th className="px-6 py-3 text-center">Puan</th>
            <th className="px-6 py-3 text-center">Düzenle</th>
          </tr>
        </thead>
        <tbody>
          {points.map((user, index) => (
            <tr key={user.user_id} className="hover:bg-purple-800 transition text-base">
              <td className="px-6 py-3 text-purple-300 font-bold">{index + 1}</td>
              <td className="px-6 py-3">{user.username}</td>
              <td className="px-6 py-3 text-center">{user.points}</td>
              <td className="px-6 py-3 text-center">
                <input
                  type="number"
                  defaultValue={user.points}
                  onBlur={(e) =>
                    onUpdate(user.user_id, parseInt(e.target.value || "0"))
                  }
                  className="bg-purple-900 border border-purple-700 rounded px-4 py-2 text-white w-28 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
