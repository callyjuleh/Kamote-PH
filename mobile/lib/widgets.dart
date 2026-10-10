import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'data.dart';
import 'icons.dart';
import 'theme.dart';

/// Scrollable page body on the standard paper background.
class ScreenScroll extends StatelessWidget {
  const ScreenScroll({
    super.key,
    this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 32),
    this.child,
    this.bg,
  });

  final EdgeInsetsGeometry padding;
  final Widget? child;
  final Color? bg;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: bg ?? RW.paper,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: padding,
          child: child ?? const SizedBox.shrink(),
        ),
      ),
    );
  }
}

class Gap extends StatelessWidget {
  const Gap(this.space, {super.key});
  final double space;
  @override
  Widget build(BuildContext context) => SizedBox(height: space);
}

/// Rounded card with an optional tinted background and tap behavior.
class Surface extends StatelessWidget {
  const Surface({
    super.key,
    this.color,
    this.borderColor,
    this.radius = 20,
    this.padding,
    this.child,
    this.onTap,
  });

  final Color? color;
  final Color? borderColor;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final Widget? child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color ?? Colors.white,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: borderColor ?? RW.border),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Lightweight tappable wrapper with a ripple.
class Pressable extends StatelessWidget {
  const Pressable({
    super.key,
    this.onTap,
    this.radius = 16,
    this.color = Colors.transparent,
    this.child,
  });

  final VoidCallback? onTap;
  final double radius;
  final Color color;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: child,
      ),
    );
  }
}

class AppHeader extends StatelessWidget {
  const AppHeader({
    super.key,
    this.title,
    this.leading,
    this.trailing,
    this.padding = const EdgeInsets.symmetric(vertical: 8),
  });

  final String? title;
  final Widget? leading;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        children: [
          if (leading != null) ...[leading!, const Gap(10)],
          if (title != null)
            Expanded(child: Text(title!, style: ts(size: 26, weight: FontWeight.w700))),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class SectionHeading extends StatelessWidget {
  const SectionHeading({super.key, this.label, this.action, this.padding});

  final String? label;
  final Widget? action;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          if (label != null)
            Expanded(child: Text(label!, style: ts(size: 18, weight: FontWeight.w700))),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class TextLink extends StatelessWidget {
  const TextLink({
    super.key,
    this.label,
    this.tint = RW.blue,
    this.onTap,
    this.withChevron = true,
  });

  final String? label;
  final Color tint;
  final VoidCallback? onTap;
  final bool withChevron;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null)
            Text(label!, style: ts(size: 13, color: tint, weight: FontWeight.w600)),
          if (withChevron) ...[
            const Gap(2),
            RWIcon('chevron', size: 13, color: tint),
          ],
        ],
      ),
    );
  }
}

class ProgressBar extends StatelessWidget {
  const ProgressBar({
    super.key,
    required this.value,
    this.color = RW.blue,
    this.track = const Color(0xFFE9E9EE),
    this.height = 8,
    this.radius = 6,
  });

  final double value;
  final Color color;
  final Color track;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final v = value.clamp(0.0, 1.0);
    return Container(
      height: height,
      decoration: BoxDecoration(color: track, borderRadius: BorderRadius.circular(radius)),
      child: Align(
        alignment: Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: v,
          child: Container(
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(radius),
            ),
          ),
        ),
      ),
    );
  }
}

/// Progress rendered as traffic lights: red when empty, amber halfway, green when done.
class SignalProgress extends StatelessWidget {
  const SignalProgress({super.key, required this.value, this.size = 8});

  final double value;
  final double size;

  @override
  Widget build(BuildContext context) {
    final v = value.clamp(0.0, 1.0);
    final showRed = v > 0.02;
    final showAmber = v >= 0.34;
    final showGreen = v >= 0.67;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _dot(RW.red, showRed),
        SizedBox(width: 3),
        _dot(RW.yellow, showAmber),
        SizedBox(width: 3),
        _dot(RW.signalGreen, showGreen),
      ],
    );
  }

  Widget _dot(Color on, bool lit) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: lit ? on : const Color(0xFFE0E0E5),
        border: Border.all(color: lit ? on : const Color(0xFFD2D2D7)),
      ),
    );
  }
}

Color toneBg(Tone tone) {
  switch (tone) {
    case Tone.yellow:
      return RW.tintYellow;
    case Tone.red:
      return RW.tintRed;
    case Tone.sky:
      return RW.tintBlue;
    case Tone.blue:
      return RW.tintBlue;
  }
}

Color toneFg(Tone tone) {
  switch (tone) {
    case Tone.yellow:
      return const Color(0xFF9A6B00);
    case Tone.red:
      return RW.red;
    case Tone.sky:
      return RW.navy;
    case Tone.blue:
      return RW.blue;
  }
}

class StatIcon extends StatelessWidget {
  const StatIcon({super.key, required this.tone, required this.icon, this.size = 40});

  final Tone tone;
  final String icon;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: toneBg(tone), borderRadius: BorderRadius.circular(size / 3)),
      child: Center(child: RWIcon(icon, size: size * 0.5, color: toneFg(tone))),
    );
  }
}

class RoundIconButton extends StatelessWidget {
  const RoundIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.size = 42,
    this.bg = Colors.white,
    this.fg = RW.navy,
  });

  final String icon;
  final VoidCallback? onTap;
  final double size;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: bg,
      shape: CircleBorder(side: BorderSide(color: RW.border)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: size,
          height: size,
          child: Center(child: RWIcon(icon, size: size * 0.5, color: fg)),
        ),
      ),
    );
  }
}

class TimePill extends StatelessWidget {
  const TimePill({super.key, required this.text, this.bg = RW.tintBlue, this.fg = RW.blue});

  final String text;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          RWIcon('clock', size: 13, color: fg),
          const Gap(4),
          Text(text, style: ts(size: 12, color: fg, weight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class CapsuleButton extends StatelessWidget {
  const CapsuleButton({
    super.key,
    required this.label,
    this.onTap,
    this.color = RW.blue,
    this.fg = Colors.white,
    this.icon,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onTap;
  final Color color;
  final Color fg;
  final String? icon;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(28),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Container(
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(color: color.withValues(alpha: 0.24), blurRadius: 14, offset: const Offset(0, 6)),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: expand ? MainAxisAlignment.center : MainAxisAlignment.start,
            children: [
              if (icon != null) ...[RWIcon(icon!, size: 18, color: fg), const Gap(8)],
              Text(label, style: ts(size: 16, color: fg, weight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class AiEntry extends StatelessWidget {
  const AiEntry({super.key, this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      borderRadius: BorderRadius.circular(24),
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [RW.navy, Color(0xFF12325F)],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(color: RW.navy.withValues(alpha: 0.28), blurRadius: 18, offset: const Offset(0, 8)),
            ],
          ),
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: RW.tintBlue,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Center(child: RWIcon('spark', size: 24, color: RW.blue)),
              ),
              const Gap(14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ask Dai, your driving tutor',
                        style: ts(size: 16, color: Colors.white, weight: FontWeight.w700)),
                    const Gap(3),
                    Text('Signals, rules, and situations — answered by the local AI',
                        style: ts(size: 12.5, color: const Color(0xB3FFFFFF))),
                  ],
                ),
              ),
              const Gap(8),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Center(child: RWIcon('chevron', size: 15, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A traffic light showing which lamps are lit. Pulsates when `flashing`.
class TrafficLight extends StatefulWidget {
  const TrafficLight({super.key, required this.lit, this.flashing = false, this.size = 22});

  final List<Lamp> lit;
  final bool flashing;
  final double size;

  @override
  State<TrafficLight> createState() => _TrafficLightState();
}

class _TrafficLightState extends State<TrafficLight> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const off = Color(0xFFD9D9DE);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _lamp(widget.lit.contains(Lamp.red) ? RW.red : off),
        const SizedBox(height: 6),
        _lamp(widget.lit.contains(Lamp.amber) ? RW.yellow : off),
        const SizedBox(height: 6),
        _lamp(widget.lit.contains(Lamp.green) ? RW.signalGreen : off),
      ],
    );
  }

  Widget _lamp(Color color) {
    Widget dot = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        border: Border.all(color: const Color(0xFFB9B9C0)),
        boxShadow: [
          if (color != const Color(0xFFD9D9DE))
            BoxShadow(color: color.withValues(alpha: 0.45), blurRadius: 8, spreadRadius: 1),
        ],
      ),
    );
    if (widget.flashing && color != const Color(0xFFD9D9DE)) {
      dot = FadeTransition(
        opacity: Tween<double>(begin: 0.35, end: 1).animate(_pulse),
        child: ScaleTransition(scale: Tween<double>(begin: 0.92, end: 1).animate(_pulse), child: dot),
      );
    }
    return dot;
  }
}

/// Circular progress ring drawn with a thick arc.
class ConicRing extends StatelessWidget {
  const ConicRing({
    super.key,
    required this.value,
    this.size = 96,
    this.thickness = 10,
    this.color = RW.blue,
    this.track = const Color(0xFFE8E9EE),
    this.child,
  });

  final double value;
  final double size;
  final double thickness;
  final Color color;
  final Color track;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(
          value: value.clamp(0.0, 1.0),
          thickness: thickness,
          color: color,
          track: track,
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.value, required this.thickness, required this.color, required this.track});

  final double value;
  final double thickness;
  final Color color;
  final Color track;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromCircle(
      center: Offset(size.width / 2, size.height / 2),
      radius: (size.width / 2) - (thickness / 2),
    );
    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..color = track;
    canvas.drawCircle(rect.center, rect.width / 2, trackPaint);

    if (value <= 0) return;
    final arcPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawArc(rect, -math.pi / 2, 2 * math.pi * value, false, arcPaint);
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.value != value || old.color != color || old.track != track || old.thickness != thickness;
}

/// Weekly goal card: ring + achieved total + day bars.
class GoalChart extends StatelessWidget {
  const GoalChart({
    super.key,
    this.value,
    this.unit = 'min',
    this.label = 'This week',
    this.bars,
  });

  final double? value;
  final String unit;
  final String label;
  final List<DayStat>? bars;

  @override
  Widget build(BuildContext context) {
    final total = bars?.fold<double>(0, (sum, d) => sum + d.total) ?? 0;
    final chartBars = bars ?? const <DayStat>[];
    final maxBar = chartBars.isEmpty
        ? 1.0
        : chartBars
            .map((d) => d.total.toDouble())
            .fold<double>(0, (a, b) => a > b ? a : b);
    final v = value ?? total;
    return Surface(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          ConicRing(
            value: v / goal,
            size: 104,
            thickness: 12,
            color: RW.blue,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('${v.round()}', style: ts(size: 26, weight: FontWeight.w800)),
                Text(unit, style: ts(size: 11, color: RW.ink3)),
              ],
            ),
          ),
          const Gap(18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: ts(size: 16, weight: FontWeight.w700)),
                const Gap(2),
                Text('Target · $goal $unit', style: ts(size: 12, color: RW.ink3)),
                const Gap(14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final day in chartBars)
                      Expanded(
                        child: Column(
                          children: [
                            Container(
                              height: 46,
                              alignment: Alignment.bottomCenter,
                              child: FractionallySizedBox(
                                heightFactor: (day.total / maxBar).clamp(0.08, 1.0),
                                child: Container(
                                  width: 9,
                                  decoration: BoxDecoration(
                                    color: day.total >= (goal / 2) ? RW.blue : RW.tintBlue,
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                ),
                              ),
                            ),
                            const Gap(5),
                            Text(day.day,
                                style: ts(size: 10, color: RW.ink3, weight: FontWeight.w600)),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Pinned bottom bar used by quiz and detail screens.
class ActionBar extends StatelessWidget {
  const ActionBar({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: RW.paper,
      elevation: 12,
      shadowColor: const Color(0x33000000),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: child,
        ),
      ),
    );
  }
}