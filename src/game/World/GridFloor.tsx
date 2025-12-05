import { Grid } from '@react-three/drei';

export const GridFloor = () => {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[100, 100]} // Size of the grid
      cellSize={1}
      cellThickness={1}
      cellColor="#6f6f6f"
      sectionSize={5}
      sectionThickness={1.5}
      sectionColor="#00ffff" // Cyan for Tron look
      fadeDistance={50}
      infiniteGrid
    />
  );
};
