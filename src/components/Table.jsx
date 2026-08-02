// === frontend/src/components/Table.jsx ===

function Table({
  points,
  onUpdate,
  onWheel,
}) {
  return (
    <div className="overflow-x-auto mt-8">
      <table className="min-w-full text-sm text-left table-auto border-collapse custom-table">
        <thead>
          <tr className="bg-purple-700 text-white text-base">
            <th className="px-6 py-3">#</th>

            <th className="px-6 py-3">
              Kullanıcı
            </th>

            <th className="px-6 py-3 text-center">
              Puan
            </th>

            <th className="px-6 py-3 text-center">
              Düzenle
            </th>

            <th className="px-6 py-3 text-center">
              Çark
            </th>
          </tr>
        </thead>

        <tbody>
          {points.map((user, index) => (
            <tr
              key={user.user_id}
              className="hover:bg-purple-800 transition text-base"
            >
              <td className="px-6 py-3 text-purple-300 font-bold">
                {index + 1}
              </td>

              <td className="px-6 py-3">
                <div className="table-user-cell">
                  <div className="table-user-avatar">
                    {String(
                      user.username || "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="table-user-details">
                    <strong>
                      {user.username}
                    </strong>

                    <small>
                      ID: {user.user_id}
                    </small>
                  </div>
                </div>
              </td>

              <td className="px-6 py-3 text-center">
                <span className="table-points-badge">
                  {Number(
                    user.points || 0
                  ).toLocaleString("tr-TR")}
                </span>
              </td>

              <td className="px-6 py-3 text-center">
                <input
                  type="number"
                  defaultValue={user.points}
                  onBlur={(event) => {
                    const newValue = Number.parseInt(
                      event.target.value || "0",
                      10
                    );

                    onUpdate(
                      user.user_id,
                      Number.isFinite(newValue)
                        ? newValue
                        : 0
                    );
                  }}
                  className="table-point-input bg-purple-900 border border-purple-700 rounded px-4 py-2 text-white w-28 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </td>

              <td className="px-6 py-3 text-center">
                <button
                  type="button"
                  className="table-wheel-button"
                  onClick={() =>
                    onWheel(user)
                  }
                  disabled={!onWheel}
                  title={`${user.username} için çark aç`}
                >
                  <span className="table-wheel-icon">
                    🎡
                  </span>

                  <span>Çark Aç</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {points.length === 0 && (
        <div className="table-empty-state">
          <span>👥</span>

          <strong>
            Kullanıcı bulunamadı
          </strong>

          <p>
            Kullanıcılar chate yazdıkça burada
            görünecek.
          </p>
        </div>
      )}
    </div>
  );
}

export default Table;