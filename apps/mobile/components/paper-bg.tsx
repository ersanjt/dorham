import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { color } from "../lib/theme";

/** Quiet girih wash — atmosphere for tea-paper screens. */
export function PaperBg() {
  const { width, height } = Dimensions.get("window");
  const tile = 26;
  const cols = Math.ceil(width / tile) + 1;
  const rows = Math.ceil(height / tile) + 1;
  const diamonds: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) diamonds.push({ x: c * tile, y: r * tile });
    }
  }

  const motifX = width - 118;
  const motifY = 72;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.paper }]} />
      <View
        style={{
          position: "absolute",
          top: -100,
          right: -70,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: color.claySoft,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 100,
          left: -100,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: "rgba(139, 74, 50, 0.09)",
        }}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {diamonds.map((d, i) => (
          <Path
            key={i}
            d={`M ${d.x + tile / 2} ${d.y + 3} L ${d.x + tile - 3} ${d.y + tile / 2} L ${d.x + tile / 2} ${d.y + tile - 3} L ${d.x + 3} ${d.y + tile / 2} Z`}
            stroke={color.line}
            strokeWidth={0.7}
            fill="none"
            opacity={0.32}
          />
        ))}
        {/* Corner star — one graphic anchor, not sticker clutter */}
        <Circle cx={motifX + 40} cy={motifY + 40} r={38} stroke={color.clay} strokeWidth={1.2} fill="none" opacity={0.18} />
        <Circle cx={motifX + 40} cy={motifY + 40} r={22} stroke={color.copper} strokeWidth={1} fill="none" opacity={0.16} />
        <Path
          d={`M ${motifX + 40} ${motifY + 12} L ${motifX + 48} ${motifY + 32} L ${motifX + 70} ${motifY + 40} L ${motifX + 48} ${motifY + 48} L ${motifX + 40} ${motifY + 68} L ${motifX + 32} ${motifY + 48} L ${motifX + 10} ${motifY + 40} L ${motifX + 32} ${motifY + 32} Z`}
          stroke={color.clay}
          strokeWidth={1.4}
          fill="rgba(177,46,40,0.06)"
          opacity={0.55}
        />
        <Rect x={0} y={0} width={width} height={4} fill={color.clay} opacity={0.7} />
        <Rect x={0} y={height - 3} width={width} height={3} fill={color.clay} opacity={0.25} />
      </Svg>
    </View>
  );
}
