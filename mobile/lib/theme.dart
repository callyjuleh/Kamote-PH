import 'package:flutter/material.dart';

/// RoadWise brand tokens.
class RW {
  static const blue = Color(0xFF007AFF);
  static const navy = Color(0xFF0A1F44);
  static const paper = Color(0xFFF2F2F7);
  static const red = Color(0xFFFF3B30);
  static const yellow = Color(0xFFFFCC00);
  static const signalGreen = Color(0xFF34C759);
  static const tintBlue = Color(0xFFEAF2FF);
  static const tintRed = Color(0xFFFFE7E5);
  static const tintYellow = Color(0xFFFFF7E0);
  static const tintGreen = Color(0xFFE6F6EC);
  static const ink = Color(0xFF1D1D1F);
  static const ink2 = Color(0xFF57575A);
  static const ink3 = Color(0xFF86868B);
  static const border = Color(0xFFE5E5EA);
  static const surfaceBlue = Color(0xFF0A1F44);
}

TextStyle ts({
  double size = 17,
  FontWeight weight = FontWeight.w500,
  Color? color,
  double height = 1.2,
}) =>
    TextStyle(fontSize: size, height: height, fontWeight: weight, color: color ?? RW.ink);

TextStyle display() => const TextStyle(color: RW.paper, height: 1.1, fontWeight: FontWeight.w700);

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: RW.blue);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: RW.paper,
    appBarTheme: const AppBarTheme(
      backgroundColor: RW.paper,
      foregroundColor: RW.ink,
      elevation: 0,
      centerTitle: true,
    ),
    textTheme: TextTheme(
      headlineLarge: ts(size: 34, weight: FontWeight.w700, height: 1.05),
      titleLarge: ts(size: 28, weight: FontWeight.w700, height: 1.1),
      titleMedium: ts(size: 20, weight: FontWeight.w700, height: 1.2),
      bodyLarge: ts(size: 17, weight: FontWeight.w400),
      bodyMedium: ts(size: 15, weight: FontWeight.w400),
      labelLarge: ts(size: 16, weight: FontWeight.w600),
    ),
  );
}