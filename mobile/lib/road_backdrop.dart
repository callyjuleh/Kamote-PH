import 'dart:math' as math;
import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'theme.dart';

/// Fullscreen navy gradient with the road + signage pattern used behind
/// hero headers. `blur` paints an unfocused frosted layer for overlays.
class RoadBackdrop extends StatelessWidget {
  const RoadBackdrop({super.key, this.dark = false, this.blur = false});

  final bool dark;
  final bool blur;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final pattern = SvgPicture.string(
      _scene,
      width: size.width,
      height: size.height,
      fit: BoxFit.cover,
    );
    return ClipRect(
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: dark || blur
                    ? [const Color(0xFF0A1F44), const Color(0xFF12325F)]
                    : [const Color(0xFF123A6B), const Color(0xFF0E2C55)],
              ),
            ),
            child: pattern,
          ),
          if (blur)
            const ColoredBox(color: Color(0x99091A33)),
        ],
      ),
    );
  }

  Widget clip(Widget child) => ClipRect(child: child);

  static String get _scene => '''
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#122F55" stop-opacity="0"/>
        <stop offset="1" stop-color="#0A1F44" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g opacity="0.18" stroke="#FFFFFF" stroke-linecap="round" fill="none">
      <path d="M-40 820 L120 560 L190 260 L150 -40" stroke-width="6"/>
      <path d="M-40 820 L120 560 L190 260 L150 -40" stroke-width="2" stroke-dasharray="18 14"/>
      <path d="M460 840 L300 580 L250 280 L270 -20" stroke-width="6"/>
      <path d="M460 840 L300 580 L250 280 L270 -20" stroke-width="2" stroke-dasharray="18 14"/>
      <path d="M200 900 L200 400 L210 120 L190 -60" stroke-width="1.5"/>
    </g>
    <g opacity="0.22" fill="#FFFFFF">
      <path d="M74 236 L106 186 L138 236 Z"/>
      <rect x="282" y="470" width="56" height="40" rx="6"/>
      <path d="M50 700 A24 24 0 0 1 98 700 Z"/>
      <rect x="150" y="90" width="48" height="52" rx="6"/>
      <rect x="298" y="160" width="52" height="34" rx="6"/>
    </g>
  </svg>''';
}

class BackdropTrigger extends StatefulWidget {
  const BackdropTrigger({super.key, required this.builder});
  final WidgetBuilder builder;
  @override
  State<BackdropTrigger> createState() => _BackdropTriggerState();
}

class _BackdropTriggerState extends State<BackdropTrigger> {
  double _lift = 0;

  void _onScale(ScaleUpdateDetails details) {
    setState(() {
      final dy = details.focalPointDelta.dy * 0.02;
      _lift = (_lift + dy).clamp(0, math.max(0, MediaQuery.sizeOf(context).height * 0.5));
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    return GestureDetector(
      onScaleUpdate: _onScale,
      child: Stack(
        children: [
          Positioned.fill(
            child: RoadBackdrop(
              blur: _lift > 40,
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOut,
            top: _lift,
            left: 0,
            right: 0,
            bottom: 0,
            child: ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(_lift.clamp(0, 28))),
              child: Container(
                height: size.height,
                color: RW.paper,
                child: widget.builder(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}