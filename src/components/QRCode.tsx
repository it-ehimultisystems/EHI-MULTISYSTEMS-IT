export const QRCode = ({ id, size = 150 }: { id: string; size?: number }) => {
  const cells = Array(21).fill(0).map(() => Array(21).fill(false));

  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      const pos = row * 21 + col;
      const charCode = id.charCodeAt(pos % id.length);
      cells[row][col] = ((charCode ^ (row * 3) ^ (col * 5)) % 2) === 0;
    }
  }

  // Draw finder patterns
  const drawFinder = (rOffset: number, cOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r + rOffset][c + cOffset] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);       // top-left
  drawFinder(0, 14);      // top-right
  drawFinder(14, 0);      // bottom-left

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect width="21" height="21" fill="#FFFFFF" />
      {cells.map((row, r) => 
        row.map((active, c) => 
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0B0F19" /> : null
        )
      )}
    </svg>
  );
};
