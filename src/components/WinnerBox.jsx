function WinnerBox({ winner }) {
  if (!winner) return null;

  return (
    <div className="mb-4 font-semibold border p-4 rounded bg-yellow-100">
      🏆 <strong>Kazanan:</strong> {winner.username} ({winner.points} puan)
    </div>
  );
}

export default WinnerBox;
